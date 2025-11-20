// Sistema de eventos para atualizações em tempo real
class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Erro no event listener:', error);
        }
      });
    }
  }
}

// Cache global mais estável
const cache = new Map();
const pendingRequests = new Map();
const events = new EventEmitter();

const base = '';

function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const t = localStorage.getItem('token');
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

// Cache com TTL mais longo para evitar piscadas
function getCacheTTL(path) {
  if (path.includes('/users/') && !path.includes('/me')) return 600000; // 10 min para outros usuários
  if (path.includes('/suggestions')) return 300000; // 5 min para sugestões
  if (path.includes('/connections/my')) return 180000; // 3 min para conexões
  if (path.includes('/connections/requests')) return 120000; // 2 min para pedidos
  if (path.includes('/auth/me')) return 180000; // 3 min para próprio perfil
  return 120000; // 2 min padrão
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  const ttl = getCacheTTL(key);
  if (Date.now() - cached.timestamp > ttl) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });

  // Limpar cache apenas se estiver MUITO grande (300+ itens)
  if (cache.size > 300) {
    const now = Date.now();
    const keysToDelete = [];

    for (const [k, v] of cache.entries()) {
      if (now - v.timestamp > 3600000) {
        // 1 hora
        keysToDelete.push(k);
      }
    }

    keysToDelete.forEach((k) => cache.delete(k));
  }
}

// Invalidar cache de posts de forma mais seletiva
function invalidatePostsCache() {
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key === '/api/posts') {
      // Apenas a lista principal de posts
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => cache.delete(key));

  console.log('📝 Cache de posts invalidado (seletivo)');
}

// Função para invalidação TOTAL (só quando necessário)
function forceInvalidateAllPosts() {
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key.includes('/posts')) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => cache.delete(key));

  console.log('🔥 Cache de posts invalidado (completo)');
}

async function request(path, options = {}) {
  const res = await fetch(base + path, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Rate limit atingido');
    }
    const text = await res.text();
    const errorData = text ? JSON.parse(text) : null;
    const msg = errorData?.message || errorData?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const get = async (path, options = {}) => {
  const cacheKey = path;

  // Verificar cache primeiro (com prioridade alta)
  if (options.useCache !== false && options.skipCache !== true) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`💾 Cache hit: ${path}`);
      return cached;
    }
  }

  // Verificar se já tem uma requisição pendente
  if (pendingRequests.has(cacheKey)) {
    console.log(`⏳ Aguardando requisição: ${path}`);
    return pendingRequests.get(cacheKey);
  }

  // Fazer a requisição
  const requestPromise = request(path, { method: 'GET', ...options })
    .then((data) => {
      if (options.useCache !== false && options.skipCache !== true) {
        setCache(cacheKey, data);
        console.log(`💾 Dados salvos no cache: ${path}`);
      }
      return data;
    })
    .catch((error) => {
      console.error(`❌ Erro na requisição ${path}:`, error);

      // Em caso de erro, tentar cache antigo (mesmo expirado)
      if (error.message.includes('Rate limit') || error.message.includes('Failed to fetch')) {
        const staleCache = cache.get(cacheKey);
        if (staleCache) {
          console.warn('⚠️ Usando cache antigo devido ao erro');
          return staleCache.data;
        }
      }
      throw error;
    })
    .finally(() => {
      pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

const post = async (path, body, options = {}) => {
  const result = await request(path, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });

  // Invalidação SUAVE para posts
  if (path.includes('/posts') && result.post) {
    // NÃO invalidar imediatamente - a UI otimística já cuidou
    console.log('📝 Post criado - UI otimística ativa');

    // Emitir evento para componentes interessados
    setTimeout(() => {
      events.emit('postCreated', result.post);
    }, 100);

    // Invalidar cache apenas após um tempo (para sincronização futura)
    setTimeout(() => {
      invalidatePostsCache();
    }, 30000); // 30s depois
  }

  if (path.includes('/comments') && result.comment) {
    // Para comentários, invalidar apenas cache do post específico
    const postId = path.split('/posts/')[1].split('/comments')[0];
    cache.delete(`/api/posts/${postId}/comments`);
    events.emit('commentCreated', result.comment);
  }

  if (path.includes('/like')) {
    // Likes não invalidam cache - apenas atualizam estado local
    events.emit('postLiked', {
      postId: path.split('/posts/')[1].split('/')[0],
      liked: result.liked,
    });
  }

  return result;
};

const put = async (path, body, options = {}) => {
  const result = await request(path, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options,
  });

  // Invalidar cache específico
  if (path.includes('/posts')) {
    invalidatePostsCache();
    events.emit('postUpdated', result.post);
  }

  if (path.includes('/profile') || path.includes('/users/')) {
    // Invalidar apenas cache do usuário específico
    const userId = path.split('/users/')[1]?.split('/')[0];
    if (userId || path.includes('/profile')) {
      const keysToDelete = [];
      for (const key of cache.keys()) {
        if (key.includes('/auth/me') || (userId && key.includes(`/users/${userId}`))) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => cache.delete(key));
    }
  }

  return result;
};

const del = async (path, options = {}) => {
  const result = await request(path, {
    method: 'DELETE',
    ...options,
  });

  // Invalidar cache específico
  if (path.includes('/posts/')) {
    const postId = path.split('/posts/')[1].split('/')[0];
    invalidatePostsCache();
    events.emit('postDeleted', postId);
  }

  return result;
};

// Exportar API com sistema de eventos
export const api = {
  get,
  post,
  put,
  del,
  delete: del,
  // Métodos de eventos
  on: events.on.bind(events),
  off: events.off.bind(events),
  emit: events.emit.bind(events),
  // Métodos de cache
  invalidateCache: invalidatePostsCache,
  forceInvalidateCache: forceInvalidateAllPosts,
  clearCache: () => cache.clear(),
  // Debug
  getCacheSize: () => cache.size,
  getCacheKeys: () => Array.from(cache.keys()),
  getCacheInfo: () => {
    const info = {};
    for (const [key, value] of cache.entries()) {
      info[key] = {
        age: Math.round((Date.now() - value.timestamp) / 1000),
        ttl: Math.round(getCacheTTL(key) / 1000),
        expired: Date.now() - value.timestamp > getCacheTTL(key),
      };
    }
    return info;
  },
};
