// Client service for Edge Functions with built-in rate limiting
// Note: rateLimitService removed - edge functions handle their own rate limiting

const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';
const CLIENT_KEY = import.meta.env.VITE_SYNC_CLIENT_KEY;

// Gemini API Rate Limits (from geminimodelrate limits.md)
const GEMINI_LIMITS = {
  'gemini-2.5-pro': { rpm: 5, tpm: 250000, rpd: 100 },
  'gemini-2.5-flash': { rpm: 10, tpm: 250000, rpd: 250 },
  'gemini-2.5-flash-lite': { rpm: 15, tpm: 250000, rpd: 1000 },
  'gemini-2.0-flash': { rpm: 15, tpm: 1000000, rpd: 200 },
  'gemini-2.0-flash-lite': { rpm: 30, tpm: 1000000, rpd: 200 },
  'gemini-embedding': { rpm: 100, tpm: 30000, rpd: 1000 }
};

class EdgeFunctionClient {
  private syncQueue: any[] = [];
  private syncing = false;

  // Batch sync operations to Edge Function
  async syncBatch(items: any[]) {
    if (!navigator.onLine) {
      throw new Error('Offline - cannot sync');
    }

    const response = await fetch(`${EDGE_FUNCTION_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-key': CLIENT_KEY
      },
      body: JSON.stringify({
        client_id: this.getClientId(),
        items: items.slice(0, 50) // Max 50 per batch
      })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    return response.json();
  }

  // Queue operations for batch sync
  async queueForSync(item: any) {
    this.syncQueue.push({
      ...item,
      local_uuid: item.local_uuid || crypto.randomUUID(),
      timestamp: new Date().toISOString()
    });

    // Auto-sync when queue reaches batch size
    if (this.syncQueue.length >= 10) {
      await this.processSyncQueue();
    }
  }

  // Process sync queue with rate limiting
  async processSyncQueue() {
    if (this.syncing || !this.syncQueue.length || !navigator.onLine) return;

    this.syncing = true;
    try {
      const batch = this.syncQueue.splice(0, 50);
      const result = await this.syncBatch(batch);
      
      // Handle results
      for (const res of result.results) {
        if (res.status === 'error') {
          console.error(`Sync error for ${res.local_uuid}:`, res.error);
        }
      }
      
      return result;
    } finally {
      this.syncing = false;
    }
  }

  // Parse note (rate limiting handled by edge function)
  async parseNote(content: string, options: any = {}) {
    const response = await fetch(`${EDGE_FUNCTION_URL}/parseNote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-key': CLIENT_KEY
        },
        body: JSON.stringify({
          text: content,
          client_id: this.getClientId(),
          user_role: options.user_role,
          user_id: options.user_id,
          model: options.model || 'gemini-2.0-flash-lite'
        })
      });

      if (response.status === 429) {
        throw new Error('Rate limit exceeded - try again later');
      }
      
      if (!response.ok) {
        throw new Error(`Parse failed: ${response.status}`);
      }

      return response.json();
  }

  // Get similar notes using RAG
  async getSimilarNotes(content: string, limit: number = 5) {
    const response = await fetch(`${EDGE_FUNCTION_URL}/similarNotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-key': CLIENT_KEY
      },
      body: JSON.stringify({
        text: content,
        limit
      })
    });

    if (!response.ok) {
      throw new Error(`Similar notes failed: ${response.status}`);
    }

    return response.json();
  }

  // Get client identifier
  private getClientId(): string {
    let clientId = localStorage.getItem('client_id');
    if (!clientId) {
      clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('client_id', clientId);
    }
    return clientId;
  }

  // Start periodic sync (every 30 seconds)
  startPeriodicSync() {
    setInterval(() => {
      if (navigator.onLine && this.syncQueue.length > 0) {
        this.processSyncQueue().catch(console.error);
      }
    }, 30000);

    // Sync when coming online
    window.addEventListener('online', () => {
      setTimeout(() => this.processSyncQueue().catch(console.error), 1000);
    });
  }

  // Get rate limit info for model
  getRateLimit(model: string) {
    return GEMINI_LIMITS[model as keyof typeof GEMINI_LIMITS] || GEMINI_LIMITS['gemini-2.0-flash-lite'];
  }

  // Select optimal model based on content complexity
  selectModel(content: string): string {
    const wordCount = content.split(/\s+/).length;
    const hasNumbers = /\d+/.test(content);
    const hasMultipleOperations = (content.match(/\b(buy|bought|cook|cooked|sell|sold|transfer|sent)\b/gi) || []).length > 2;
    
    if (wordCount > 50 || hasMultipleOperations) {
      return 'gemini-2.5-flash'; // More complex parsing
    }
    
    if (hasNumbers && wordCount > 20) {
      return 'gemini-2.0-flash'; // Balanced speed/accuracy
    }
    
    return 'gemini-2.0-flash-lite'; // Fastest for simple notes
  }
}

export const edgeFunctionClient = new EdgeFunctionClient();

// Auto-start periodic sync
edgeFunctionClient.startPeriodicSync();