// IndexedDB offline-first storage for all tables
class OfflineDB {
  private db: IDBDatabase | null = null;
  private tables = ['ai_analysis', 'ai_audit_logs', 'ai_conversations', 'branch_stock', 
                   'daily_sales_summary', 'expense_summary', 'expenses', 'notes', 
                   'product_performance', 'products', 'sales', 'summaries', 
                   'user_profiles', 'workers'];

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
        
        // Create stores for all tables
        this.tables.forEach(tableName => {
          if (!db.objectStoreNames.contains(tableName)) {
            try {
              const store = db.createObjectStore(tableName, { keyPath: 'id', autoIncrement: true });
              store.createIndex('sync_status', 'sync_status');
              store.createIndex('created_at', 'created_at');
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
    
    const record = {
      ...data,
      sync_status: 'pending',
      created_at: new Date().toISOString()
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
}

export const offlineDB = new OfflineDB();