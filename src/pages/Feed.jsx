import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { usePosts } from '../hooks/usePosts';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import { FiRefreshCw, FiWifi, FiWifiOff } from 'react-icons/fi';

export default function Feed() {
  const { posts, loading, error, hasLoadedOnce, addPost, updatePost, removePost, refetch } = usePosts();

  const [currentUser, setCurrentUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();

    // Detectar status de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadUserData = async () => {
    try {
      const userResponse = await api.get('/api/auth/me');
      setCurrentUser(userResponse.user);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const handlePostCreated = (newPost, isTemporary = false, tempId = null) => {
    console.log('🚀 Novo post criado:', { newPost, isTemporary, tempId });
    addPost(newPost, isTemporary, tempId);
  };

  const handlePostUpdate = (updatedPost) => {
    console.log('📝 Post atualizado:', updatedPost);
    updatePost(updatedPost);
  };

  const handlePostDelete = (deletedPostId) => {
    console.log('🗑️ Post deletado:', deletedPostId);
    removePost(deletedPostId);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Loading inicial apenas no primeiro carregamento
  if (loading && !hasLoadedOnce) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Carregando feed...</span>
        </div>
      </div>
    );
  }

  // Error inicial
  if (error && !hasLoadedOnce) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Erro ao carregar o feed</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Carregando...
              </>
            ) : (
              <>
                <FiRefreshCw />
                Tentar novamente
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header com status e controles */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Feed</h1>

          {/* Indicador de conexão */}
          <div className="flex items-center gap-1">
            {isOnline ? <FiWifi className="text-green-500" size={16} title="Online" /> : <FiWifiOff className="text-red-500" size={16} title="Offline" />}
          </div>

          {/* Indicador de posts temporários */}
          {posts.some((p) => p.isTemporary) && (
            <div className="flex items-center gap-1 px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full text-xs">
              <div className="animate-pulse w-2 h-2 bg-sky-500 rounded-full"></div>
              {posts.filter((p) => p.isTemporary).length} enviando...
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Indicador de carregamento apenas quando refreshing manualmente */}
          {refreshing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>}

          {/* Botão de refresh manual */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || !isOnline}
            className="px-3 py-2 text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1"
            title={!isOnline ? 'Sem conexão' : 'Atualizar feed'}
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={14} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Alertas */}
      {!isOnline && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <FiWifiOff size={16} />
            <span className="text-sm font-medium">Você está offline</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Posts criados offline aparecerão quando a conexão for restabelecida</p>
        </div>
      )}

      {error && hasLoadedOnce && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <span>⚠️</span>
              <span className="text-sm">Erro ao atualizar: {error}</span>
            </div>
            <button onClick={handleRefresh} className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Formulário de criação */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Lista de posts com loading inteligente */}
      <div className="space-y-6">
        {posts.length === 0 && hasLoadedOnce ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum post ainda</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Seja o primeiro a compartilhar algo interessante!</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">💡 Dica: Posts aparecem instantaneamente quando você publica</p>
          </div>
        ) : posts.length === 0 && !hasLoadedOnce ? (
          // Loading para posts quando ainda não carregou
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Carregando posts...</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} currentUser={currentUser} onPostUpdate={handlePostUpdate} onPostDelete={handlePostDelete} />)
        )}
      </div>

      {/* Footer com estatísticas - apenas se tiver posts */}
      {posts.length > 0 && (
        <div className="text-center py-8 border-t border-gray-100 dark:border-gray-800">
          <div className="space-y-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              ✨ {posts.length} {posts.length === 1 ? 'post carregado' : 'posts carregados'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">UI otimística • Cache inteligente • Sem reloads automáticos</p>
          </div>
        </div>
      )}
    </div>
  );
}
