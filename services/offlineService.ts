// IndexedDB offline-first storage for all tables
class OfflineDB {
  private db: IDBDatabase | null = null;
  private tables = ['ai_analysis', 'ai_audit_logs', 'ai_conversations', 'branch_stock', 
                   'daily_sales_summary', 'expense_summary', 'expenses', 'notes', 
                   'product_performance', 'products', 'sales', 'summaries', 
                   'user_profiles', 'workers', 'operations', 'lots', 'owners', 'branches'];

  async init() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB not available');
    }
    
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('CharnoksDB', 1);
      request.onerror = () => reject(new Error('IndexedDB failed to open'));
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create meta store for sync tracking
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
        
        // Create stores for all tables
        this.tables.forEach(tableName => {
          if (!db.objectStoreNames.contains(tableName)) {
            try {
              const store = db.createObjectStore(tableName, { keyPath: 'id', autoIncrement: true });
              store.createIndex('sync_status', 'sync_status');
              store.createIndex('created_at', 'created_at');
              store.createIndex('updated_at', 'updated_at');
              store.createIndex('local_uuid', 'local_uuid', { unique: true });
              store.createIndex('deleted', 'deleted');
            } catch (error) {
              console.warn(`Failed to create store ${tableName}:`, error);
            }
          }
        });
      };
    });
  }

  async save(tableName: string, data: any) {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.db.objectStoreNames.contains(tableName)) {
      throw new Error(`Store ${tableName} does not exist`);
    }
    
    // Validate save operation to prevent duplicates
    try {
      const { validateSave } = await import('./dataDeduplicationService');
      const validation = await validateSave(tableName, data);
      
      if (!validation.valid) {
        console.warn(`❌ Save blocked: ${validation.reason}`);
        throw new Error(validation.reason);
      }
    } catch (validationError) {
      console.warn('Validation service unavailable, proceeding with save');
    }
    
    const record = {
      ...data,
      local_uuid: data.local_uuid || crypto.randomUUID(), // Generate UUID if not provided
      sync_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false
    };
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([tableName], 'readwrite');
      const store = tx.objectStore(tableName);
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPending(tableName: string) {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.db.objectStoreNames.contains(tableName)) {
      throw new Error(`Store ${tableName} does not exist`);
    }
    
    return new Promise<any[]>((resolve, reject) => {
      const tx = this.db!.transaction([tableName], 'readonly');
      const store = tx.objectStore(tableName);
      const index = store.index('sync_status');
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markSynced(tableName: string, id: number) {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.tables.includes(tableName)) throw new Error(`Table ${tableName} not supported`);
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([tableName], 'readwrite');
      const store = tx.objectStore(tableName);
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.sync_status = 'synced';
          record.updated_at = new Date().toISOString();
          const putRequest = store.put(record);
          putRequest.onsuccess = () => resolve(putRequest.result);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Record not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // NEW METHODS FOR SYNC PLAN

  // Soft delete (tombstone) - marks record as deleted without removing it
  async softDelete(tableName: string, localUuid: string) {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.db.objectStoreNames.contains(tableName)) {
      throw new Error(`Store ${tableName} does not exist`);
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([tableName], 'readwrite');
      const store = tx.objectStore(tableName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const records = request.result;
        const record = records.find(r => r.local_uuid === localUuid);
        
        if (record) {
          record.deleted = true;
          record.sync_status = 'pending';
          record.updated_at = new Date().toISOString();
          
          const putRequest = store.put(record);
          putRequest.onsuccess = () => resolve(putRequest.result);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Record not found'));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get records modified since timestamp (for incremental sync)
  async getModifiedSince(tableName: string, timestamp: string) {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.db.objectStoreNames.contains(tableName)) {
      throw new Error(`Store ${tableName} does not exist`);
    }

    return new Promise<any[]>((resolve, reject) => {
      const tx = this.db!.transaction([tableName], 'readonly');
      const store = tx.objectStore(tableName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const records = request.result;
        const modifiedRecords = records.filter(record => 
          record.updated_at && record.updated_at > timestamp
        );
        resolve(modifiedRecords);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Upsert record (insert or update) for incoming sync data
  async upsert(tableName: string, data: any) {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.db.objectStoreNames.contains(tableName)) {
      throw new Error(`Store ${tableName} does not exist`);
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([tableName], 'readwrite');
      const store = tx.objectStore(tableName);
      
      // First try to find existing record by local_uuid
      const getRequest = store.getAll();
      getRequest.onsuccess = () => {
        const records = getRequest.result;
        const existingRecord = records.find(r => r.local_uuid === data.local_uuid);
        
        if (existingRecord) {
          // Update existing record
          const mergedRecord = { ...existingRecord, ...data, sync_status: 'synced' };
          const putRequest = store.put(mergedRecord);
          putRequest.onsuccess = () => resolve(putRequest.result);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          // Insert new record
          const newRecord = { ...data, sync_status: 'synced' };
          const addRequest = store.add(newRecord);
          addRequest.onsuccess = () => resolve(addRequest.result);
          addRequest.onerror = () => reject(addRequest.error);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Get/Set metadata for sync tracking
  async getLastSyncTimestamp() {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise<string | null>((resolve, reject) => {
      const tx = this.db!.transaction(['meta'], 'readonly');
      const store = tx.objectStore('meta');
      const request = store.get('last_remote_sync_ts');
      
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  async setLastSyncTimestamp(timestamp: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['meta'], 'readwrite');
      const store = tx.objectStore('meta');
      const request = store.put({ key: 'last_remote_sync_ts', value: timestamp });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data (for initial sync)
  async clearTable(tableName: string) {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.db.objectStoreNames.contains(tableName)) {
      throw new Error(`Store ${tableName} does not exist`);
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([tableName], 'readwrite');
      const store = tx.objectStore(tableName);
      const request = store.clear();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all records from a table (for offline-first loading)
  async getAll(tableName: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.db.objectStoreNames.contains(tableName)) {
      throw new Error(`Store ${tableName} does not exist`);
    }

    return new Promise<any[]>((resolve, reject) => {
      const tx = this.db!.transaction([tableName], 'readonly');
      const store = tx.objectStore(tableName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const records = request.result;
        // Filter out soft-deleted records and sort by updated_at desc
        const activeRecords = records
          .filter(record => !record.deleted)
          .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
        resolve(activeRecords);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get count of records in a table
  async getCount(tableName: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.db.objectStoreNames.contains(tableName)) {
      return 0;
    }

    return new Promise<number>((resolve, reject) => {
      const tx = this.db!.transaction([tableName], 'readonly');
      const store = tx.objectStore(tableName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineDB = new OfflineDB();