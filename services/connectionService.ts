// Connection detection service (YouTube-style)
class ConnectionService {
  private isOnline = navigator.onLine;
  private listeners: ((online: boolean) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupEventListeners();
    this.startPeriodicCheck();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
    
    // Visibility change detection (like YouTube)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkConnection();
      }
    });
  }

  private startPeriodicCheck() {
    // Check every 30 seconds (like YouTube)
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, 30000);
  }

  private async checkConnection(): Promise<boolean> {
    try {
      // Try to fetch a small resource (like YouTube does)
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const online = response.ok;
      this.updateStatus(online);
      return online;
    } catch {
      this.updateStatus(false);
      return false;
    }
  }

  private updateStatus(online: boolean) {
    if (this.isOnline !== online) {
      this.isOnline = online;
      this.listeners.forEach(listener => listener(online));
    }
  }

  // Public API
  get online(): boolean {
    return this.isOnline;
  }

  onStatusChange(callback: (online: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async forceCheck(): Promise<boolean> {
    return this.checkConnection();
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
}

export const connectionService = new ConnectionService();