import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';

export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Carregar posts SEM reloads automáticos
  const loadPosts = useCallback(
    async (showLoading = true) => {
      try {
        // Só mostra loading na primeira vez ou se não houver posts
        if (showLoading && !hasLoadedOnce) {
          setLoading(true);
        }

        setError(null);

        const response = await api.get('/api/posts');
        setPosts(response.posts || []);

        if (!hasLoadedOnce) {
          setHasLoadedOnce(true);
        }
      } catch (error) {
        setError(error.message);
        console.error('Erro ao carregar posts:', error);
      } finally {
        if (showLoading && !hasLoadedOnce) {
          setLoading(false);
        }
      }
    },
    [hasLoadedOnce]
  );

  // Adicionar post (UI Otimística) - SEM sincronização automática
  const addPost = useCallback((post, isTemporary = false, replaceId = null) => {
    setPosts((prevPosts) => {
      // Se é pra substituir um post temporário
      if (replaceId) {
        const index = prevPosts.findIndex((p) => p.id === replaceId);
        if (index !== -1) {
          const newPosts = [...prevPosts];
          newPosts[index] = post;
          return newPosts;
        }
      }

      // Se já existe, não adiciona
      if (prevPosts.some((p) => p.id === post.id)) {
        return prevPosts;
      }

      // Adiciona no início
      return [post, ...prevPosts];
    });
  }, []);

  // Atualizar post
  const updatePost = useCallback((updatedPost) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post)));
  }, []);

  // Remover post
  const removePost = useCallback((postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  }, []);

  // Atualizar like instantaneamente
  const updateLike = useCallback((postId, liked) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            liked,
            _count: {
              ...post._count,
              likes: liked ? post._count.likes + 1 : Math.max(0, post._count.likes - 1),
            },
          };
        }
        return post;
      })
    );
  }, []);

  // Escutar eventos da API - COM atualização de cache em background
  useEffect(() => {
    const handlePostCreated = (post) => {
      console.log('📝 Evento: Post criado', post);
      addPost(post);
    };

    const handlePostDeleted = (postId) => {
      console.log('🗑️ Evento: Post deletado', postId);
      removePost(postId);
    };

    const handlePostLiked = ({ postId, liked }) => {
      console.log('❤️ Evento: Post curtido', postId, liked);
      updateLike(postId, liked);
    };

    const handlePostUpdated = (post) => {
      console.log('✏️ Evento: Post atualizado', post);
      updatePost(post);
    };

    // NOVO: Escutar atualizações de cache em background
    const handleCacheUpdated = ({ path, data }) => {
      if (path === '/api/posts' && data?.posts) {
        console.log('🔄 Cache atualizado em background, sincronizando posts');
        setPosts(data.posts);
      }
    };

    // Registrar eventos
    api.on('postCreated', handlePostCreated);
    api.on('postDeleted', handlePostDeleted);
    api.on('postLiked', handlePostLiked);
    api.on('postUpdated', handlePostUpdated);
    api.on('cacheUpdated', handleCacheUpdated); // NOVO

    // Cleanup
    return () => {
      api.off('postCreated', handlePostCreated);
      api.off('postDeleted', handlePostDeleted);
      api.off('postLiked', handlePostLiked);
      api.off('postUpdated', handlePostUpdated);
      api.off('cacheUpdated', handleCacheUpdated); // NOVO
    };
  }, [removePost, updateLike, updatePost, addPost]);

  // Carregar posts apenas na inicialização
  useEffect(() => {
    loadPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    hasLoadedOnce,
    loadPosts,
    addPost,
    updatePost,
    removePost,
    updateLike,
    refetch: () => loadPosts(true),
    // Método para sincronização manual (se necessário)
    forceSync: () => {
      api.forceInvalidateCache();
      loadPosts(true);
    },
  };
};