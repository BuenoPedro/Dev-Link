class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  canMakeRequest(key, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove requisições antigas
    const validRequests = requests.filter((time) => now - time < windowMs);

    if (validRequests.length >= limit) {
      console.warn(`Rate limit atingido para ${key}. Limite: ${limit} requisições por ${windowMs}ms`);
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  clear() {
    this.requests.clear();
  }

  getRequestCount(key) {
    return this.requests.get(key)?.length || 0;
  }
}

export const rateLimiter = new RateLimiter();
