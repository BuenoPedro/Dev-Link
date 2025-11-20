import { apiCache } from './cache';
import { rateLimiter } from './rateLimiter';

export class RequestManager {
  constructor() {
    this.pendingRequests = new Map();
  }

  async makeRequest(url, requestFn, options = {}) {
    const { useCache = true, cacheTime = 30000, rateLimit = true, rateLimitKey = url, retries = 1, retryDelay = 1000 } = options;

    // Verificar cache primeiro
    if (useCache) {
      const cached = apiCache.get(url, cacheTime);
      if (cached) {
        return cached;
      }
    }

    // Verificar rate limiting
    if (rateLimit && !rateLimiter.canMakeRequest(rateLimitKey, 5, 60000)) {
      throw new Error('Muitas requisições. Aguarde alguns segundos.');
    }

    // Verificar se já existe uma requisição pendente para esta URL
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url);
    }

    // Fazer a requisição
    const requestPromise = this.executeWithRetry(requestFn, retries, retryDelay);
    this.pendingRequests.set(url, requestPromise);

    try {
      const result = await requestPromise;

      // Cachear o resultado
      if (useCache) {
        apiCache.set(url, result);
      }

      return result;
    } finally {
      this.pendingRequests.delete(url);
    }
  }

  async executeWithRetry(requestFn, retries, delay) {
    let lastError;

    for (let i = 0; i <= retries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        if (i < retries && (error.message.includes('429') || error.message.includes('Too Many Requests'))) {
          console.warn(`Tentativa ${i + 1} falhou, tentando novamente em ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }
}

export const requestManager = new RequestManager();
