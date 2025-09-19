interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
  version: string;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items
  storageType: 'memory' | 'localStorage' | 'sessionStorage';
  enableCompression: boolean;
}

class CacheManager {
  private cache = new Map<string, CacheItem>();
  private config: CacheConfig;
  private accessOrder = new Map<string, number>();
  private version = '1.0.0';

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      maxSize: 100,
      storageType: 'memory',
      enableCompression: false,
      ...config
    };

    // Load from persistent storage
    if (this.config.storageType !== 'memory') {
      this.loadFromStorage();
    }

    // Cleanup expired items periodically
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  // Widget-specific cache strategies
  static readonly STRATEGIES = {
    COMPETITOR_DATA: { ttl: 4 * 60 * 60 * 1000, staleWhileRevalidate: true }, // 4 hours
    TREND_ANALYSIS: { ttl: 24 * 60 * 60 * 1000, staleWhileRevalidate: true }, // 24 hours
    CULTURAL_INSIGHTS: { ttl: 7 * 24 * 60 * 60 * 1000, staleWhileRevalidate: false }, // 7 days
    AB_TEST_RESULTS: { ttl: 5 * 60 * 1000, staleWhileRevalidate: true }, // 5 minutes
    PERFORMANCE_METRICS: { ttl: 10 * 60 * 1000, staleWhileRevalidate: true } // 10 minutes
  };

  async get<T>(key: string, strategy?: keyof typeof CacheManager.STRATEGIES): Promise<T | null> {
    const item = this.cache.get(key) || this.loadFromPersistentStorage(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = now > item.expiry;
    
    // Update access order for LRU
    this.accessOrder.set(key, now);

    // Handle stale-while-revalidate
    if (isExpired && strategy) {
      const config = CacheManager.STRATEGIES[strategy];
      if (config.staleWhileRevalidate) {
        // Return stale data immediately, revalidate in background
        this.scheduleRevalidation(key, strategy);
        return item.data;
      } else {
        // Data is expired and no stale-while-revalidate
        this.delete(key);
        return null;
      }
    }

    if (isExpired) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  async set<T>(
    key: string, 
    data: T, 
    strategy?: keyof typeof CacheManager.STRATEGIES,
    customTTL?: number
  ): Promise<void> {
    const now = Date.now();
    let ttl = customTTL || this.config.defaultTTL;

    if (strategy) {
      ttl = CacheManager.STRATEGIES[strategy].ttl;
    }

    const item: CacheItem<T> = {
      data: this.config.enableCompression ? this.compress(data) : data,
      timestamp: now,
      expiry: now + ttl,
      version: this.version
    };

    // Ensure cache doesn't exceed max size
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, item);
    this.accessOrder.set(key, now);

    // Persist to storage if configured
    if (this.config.storageType !== 'memory') {
      this.saveToPersistentStorage(key, item);
    }

    // Analytics
    this.trackCacheOperation('set', key, strategy);
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    
    if (this.config.storageType !== 'memory') {
      this.removeFromPersistentStorage(key);
    }

    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    
    if (this.config.storageType !== 'memory') {
      this.clearPersistentStorage();
    }
  }

  // Check if data exists and is valid
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const isExpired = Date.now() > item.expiry;
    if (isExpired) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const totalItems = this.cache.size;
    let expiredItems = 0;
    let totalSize = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expiredItems++;
      }
      totalSize += this.estimateSize(item.data);
    }

    return {
      totalItems,
      expiredItems,
      validItems: totalItems - expiredItems,
      totalSize,
      hitRate: this.getHitRate(),
      memoryUsage: this.config.storageType === 'memory' ? totalSize : 0
    };
  }

  // Prefetch data for critical widgets
  async prefetch(keys: string[], priority: 'high' | 'low' = 'low'): Promise<void> {
    const delay = priority === 'high' ? 0 : 100;
    
    for (const key of keys) {
      if (!this.has(key)) {
        setTimeout(() => {
          // Trigger background fetch - this would integrate with your data fetching logic
          console.log(`Prefetching data for ${key}`);
        }, delay);
      }
    }
  }

  // Private methods

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired items`);
    }
  }

  private scheduleRevalidation(key: string, strategy: keyof typeof CacheManager.STRATEGIES): void {
    // This would integrate with your actual data fetching logic
    setTimeout(() => {
      console.log(`Revalidating stale data for ${key} with strategy ${strategy}`);
      // Trigger background fetch and update cache
    }, 1000);
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    const storage = this.getStorage();
    if (!storage) return;

    try {
      const cacheData = storage.getItem('dashboard-cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.cache = new Map(parsed.cache || []);
        this.accessOrder = new Map(parsed.accessOrder || []);
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  private saveToPersistentStorage(key: string, item: CacheItem): void {
    if (typeof window === 'undefined') return;

    const storage = this.getStorage();
    if (!storage) return;

    try {
      // Store individual items to avoid size limits
      storage.setItem(`cache-${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Error saving to persistent storage:', error);
    }
  }

  private loadFromPersistentStorage(key: string): CacheItem | null {
    if (typeof window === 'undefined') return null;

    const storage = this.getStorage();
    if (!storage) return null;

    try {
      const item = storage.getItem(`cache-${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Error loading from persistent storage:', error);
      return null;
    }
  }

  private removeFromPersistentStorage(key: string): void {
    if (typeof window === 'undefined') return;

    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(`cache-${key}`);
    }
  }

  private clearPersistentStorage(): void {
    if (typeof window === 'undefined') return;

    const storage = this.getStorage();
    if (!storage) return;

    // Clear all cache-related items
    const keys = Object.keys(storage);
    keys.forEach(key => {
      if (key.startsWith('cache-') || key === 'dashboard-cache') {
        storage.removeItem(key);
      }
    });
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    switch (this.config.storageType) {
      case 'localStorage':
        return window.localStorage;
      case 'sessionStorage':
        return window.sessionStorage;
      default:
        return null;
    }
  }

  private compress<T>(data: T): T {
    // Simple compression placeholder - in production you might use a library
    return data;
  }

  private estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  private hitRate = 0;
  private hitCount = 0;
  private missCount = 0;

  private getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? (this.hitCount / total) * 100 : 0;
  }

  private trackCacheOperation(operation: 'get' | 'set' | 'delete', key: string, strategy?: string): void {
    if (operation === 'get') {
      const hasData = this.cache.has(key);
      if (hasData) {
        this.hitCount++;
      } else {
        this.missCount++;
      }
    }

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Cache Operation', {
        operation,
        key,
        strategy,
        hitRate: this.getHitRate()
      });
    }
  }
}

// Global cache instance with different configurations for different use cases
export const dashboardCache = new CacheManager({
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxSize: 50,
  storageType: 'localStorage',
  enableCompression: true
});

export const sessionCache = new CacheManager({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 20,
  storageType: 'memory',
  enableCompression: false
});

export { CacheManager };