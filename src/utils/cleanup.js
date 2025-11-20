import { apiCache } from '../lib/cache';
import { rateLimiter } from '../lib/rateLimiter';

export const cleanupResources = () => {
  console.log('Limpando recursos...');

  // Limpar cache se estiver muito grande
  if (apiCache.size() > 100) {
    apiCache.clear();
  }

  // Limpar rate limiter
  rateLimiter.clear();
};

// Limpar a cada 5 minutos
let cleanupInterval;

export const startCleanup = () => {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(cleanupResources, 5 * 60 * 1000);
};

export const stopCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

// Auto-iniciar quando o módulo for carregado
if (typeof window !== 'undefined') {
  startCleanup();
}
