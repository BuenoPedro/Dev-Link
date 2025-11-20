import { useState, useEffect, useCallback } from 'react';
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
        if (showLoading && (!hasLoadedOnce || posts.length === 0)) {
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
        if (showLoading && (!hasLoadedOnce || posts.length === 0)) {
          setLoading(false);
        }
      }
    },
    [hasLoadedOnce, posts.length]
  );

  // Adicionar post (UI Otimística) - SEM sincronização automática
  const addPost = useCallback((post, isTemporary = false, replaceId = null) => {
    setPosts((prevPosts) => {
      if (post === null && replaceId) {
        // Remover post temporário (erro)
        return prevPosts.filter((p) => p.id !== replaceId);
      }

      if (replaceId) {
        // Substituir post temporário pelo real
        return prevPosts.map((p) => (p.id === replaceId ? { ...post, isTemporary: false } : p));
      }

      if (isTemporary) {
        // Adicionar post temporário no início
        return [{ ...post, isTemporary: true }, ...prevPosts];
      }

      // Verificar se já existe (evitar duplicatas)
      const exists = prevPosts.find((p) => p.id === post.id);
      if (exists && !exists.isTemporary) return prevPosts;

      // Adicionar post real no início
      return [{ ...post, isTemporary: false }, ...prevPosts.filter((p) => p.id !== post.id)];
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
            isLiked: liked,
            likesCount: liked ? post.likesCount + 1 : post.likesCount - 1,
          };
        }
        return post;
      })
    );
  }, []);

  // Escutar eventos da API - SEM reloads automáticos
  useEffect(() => {
    const handlePostCreated = (post) => {
      console.log('📡 Post criado via evento (ignorado - UI otimística ativa)');
      // Não fazer nada - a UI otimística já cuidou
    };

    const handlePostDeleted = (postId) => {
      console.log('📡 Post deletado via evento:', postId);
      removePost(postId);
    };

    const handlePostLiked = ({ postId, liked }) => {
      console.log('📡 Post curtido via evento:', { postId, liked });
      updateLike(postId, liked);
    };

    const handlePostUpdated = (post) => {
      console.log('📡 Post atualizado via evento:', post.id);
      updatePost(post);
    };

    // Registrar eventos
    api.on('postCreated', handlePostCreated);
    api.on('postDeleted', handlePostDeleted);
    api.on('postLiked', handlePostLiked);
    api.on('postUpdated', handlePostUpdated);

    // Cleanup
    return () => {
      api.off('postCreated', handlePostCreated);
      api.off('postDeleted', handlePostDeleted);
      api.off('postLiked', handlePostLiked);
      api.off('postUpdated', handlePostUpdated);
    };
  }, [removePost, updateLike, updatePost]);

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
      console.log('🔄 Sincronização forçada...');
      api.forceInvalidateCache();
      return loadPosts(false);
    },
  };
};
