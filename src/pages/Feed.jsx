import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import SidebarUser from '../components/SidebarUser';
import { FiRefreshCw } from 'react-icons/fi';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const observerTarget = useRef(null);

  // Carregar dados do usuário atual
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userData = await api.get('/api/auth/me');
        setCurrentUser(userData.user);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    loadCurrentUser();
  }, []);

  // Carregar posts com paginação
  const loadPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await api.get(`/api/posts?page=${pageNum}&limit=10`, {
        useCache: false,
      });

      const newPosts = response.posts || [];

      if (append) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      } else {
        setPosts(newPosts);
      }

      if (newPosts.length < 10) {
        setHasMore(false);
      }
    } catch (error) {
      setError(error.message);
      console.error('Erro ao carregar posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(1, false);
  }, [loadPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, page, loadPosts]);

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const handleLikeUpdate = (postId, liked) => {
    setPosts((prev) =>
      prev.map((post) => {
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
  };

  if (loadingUser) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6">
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-20">
            <SidebarUser />
          </div>
        </aside>
        <main className="col-span-1 lg:col-span-2">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Carregando...</span>
          </div>
        </main>
        <aside className="hidden lg:block lg:col-span-1">
          <Sidebar />
        </aside>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6">
      {/* Coluna esquerda - SidebarUser (25%) - STICKY FIXO */}
      <aside className="hidden lg:block lg:col-span-1">
        <div className="sticky top-20">
          <SidebarUser />
        </div>
      </aside>

      {/* Coluna central - Feed de Posts (50%) */}
      <main className="col-span-1 lg:col-span-2">
        {loading && posts.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Carregando publicações...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => {
                setPage(1);
                setHasMore(true);
                loadPosts(1, false);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <FiRefreshCw /> Tentar novamente
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma publicação ainda
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Quando alguém publicar algo, aparecerá aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onPostDelete={handlePostDeleted}
                  onLikeUpdate={handleLikeUpdate}
                />
              ))}
            </div>

            {loadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600"></div>
                <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
                  Carregando mais publicações...
                </span>
              </div>
            )}

            {hasMore && !loadingMore && (
              <div ref={observerTarget} className="h-20 flex items-center justify-center">
                <div className="text-sm text-gray-400">Role para carregar mais...</div>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Você chegou ao fim das publicações 🎉
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Coluna direita - Sidebar (25%) - STICKY COM SCROLL INVISÍVEL */}
      <aside className="hidden lg:block lg:col-span-1 relative">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
          <Sidebar />
        </div>
      </aside>
    </div>
  );
}