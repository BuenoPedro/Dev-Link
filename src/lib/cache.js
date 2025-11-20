class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  get(key, maxAge = 3000000) {
    // 30 segundos por padrão
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }
}

export const apiCache = new SimpleCache();
