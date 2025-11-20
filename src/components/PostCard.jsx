import React, { useState } from 'react';
import { api } from '../lib/api';
import { FiHeart, FiMessageCircle, FiTrash2, FiSend, FiClock } from 'react-icons/fi';

const PostCard = ({ post, currentUser, onPostUpdate, onPostDelete }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [loading, setLoading] = useState(false);

  // Verificar se é post temporário
  const isTemporary = post.isTemporary || post.id.toString().startsWith('temp-');

  const handleLike = async () => {
    if (isTemporary) return; // Não permitir ações em posts temporários

    try {
      const response = await api.post(`/api/posts/${post.id}/like`);
      setIsLiked(response.liked);
      setLikesCount((prev) => (response.liked ? prev + 1 : prev - 1));

      // Notificar componente pai sobre atualização
      if (onPostUpdate) {
        onPostUpdate({ ...post, isLiked: response.liked, likesCount: response.liked ? likesCount + 1 : likesCount - 1 });
      }
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      alert('Erro ao curtir post. Tente novamente.');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isTemporary) return;

    setLoading(true);
    try {
      const response = await api.post(`/api/posts/${post.id}/comments`, {
        content: newComment.trim(),
      });

      setComments((prev) => [response.comment, ...prev]);
      setCommentsCount((prev) => prev + 1);
      setNewComment('');

      // Notificar componente pai sobre atualização
      if (onPostUpdate) {
        onPostUpdate({ ...post, commentsCount: commentsCount + 1 });
      }
    } catch (error) {
      alert(error.message || 'Erro ao comentar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isTemporary) return;

    if (!confirm('Tem certeza que deseja deletar este post?')) return;

    try {
      await api.delete(`/api/posts/${post.id}`);
      onPostDelete?.(post.id);
    } catch (error) {
      alert(error.message || 'Erro ao deletar post');
    }
  };

  const loadMoreComments = async () => {
    if (isTemporary) return;

    try {
      const response = await api.get(`/api/posts/${post.id}/comments`, {
        params: { page: 1, limit: 20 },
      });
      setComments(response.comments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const canDelete = () => {
    if (isTemporary) return false;
    if (post.authorType === 'USER' && post.authorId === currentUser?.id) return true;
    if (post.authorType === 'COMPANY') {
      // Verificar se o usuário é dono da empresa (isso deveria vir do backend)
      return false; // Por enquanto, só o backend valida
    }
    return false;
  };

  const getAuthorInfo = () => {
    if (post.authorType === 'USER') {
      return {
        name: post.author?.profile?.displayName || post.author?.email || 'Usuário',
        avatar:
          post.author?.profile?.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.profile?.displayName || post.author?.email || 'U')}&background=0ea5e9&color=fff`,
        type: 'user',
      };
    } else {
      return {
        name: post.author?.name || 'Empresa',
        avatar: post.author?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'E')}&background=0ea5e9&color=fff`,
        type: 'company',
      };
    }
  };

  const authorInfo = getAuthorInfo();

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm relative transition-all duration-300 ${
        isTemporary ? 'opacity-75 ring-2 ring-sky-200 dark:ring-sky-800' : ''
      }`}
    >
      {/* Indicador de post temporário */}
      {isTemporary && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full text-xs font-medium">
            <FiClock className="animate-pulse" size={12} />
            Enviando...
          </div>
        </div>
      )}

      {/* Header do post */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={authorInfo.avatar}
            alt={authorInfo.name}
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorInfo.name)}&background=0ea5e9&color=fff`;
            }}
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{authorInfo.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {post.authorType === 'COMPANY' && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded">Empresa</span>}
            </p>
          </div>
        </div>

        {/* Botão de deletar */}
        {canDelete() && !isTemporary && (
          <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Deletar post">
            <FiTrash2 />
          </button>
        )}
      </div>

      {/* Conteúdo do post */}
      <div className="mb-4">
        <p className="text-gray-800 dark:text-gray-100 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

        {post.imageUrl && (
          <div className="mb-4">
            <img
              src={post.imageUrl}
              alt="Imagem do post"
              className="w-full max-h-96 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={isTemporary}
            className={`flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
            }`}
            title={isTemporary ? 'Post sendo enviado...' : 'Curtir post'}
          >
            <FiHeart size={20} className={isLiked ? 'fill-current' : ''} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          <button
            onClick={() => !isTemporary && setShowComments(!showComments)}
            disabled={isTemporary}
            className="flex items-center space-x-2 text-gray-500 hover:text-sky-500 transition-colors dark:text-gray-400 dark:hover:text-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isTemporary ? 'Post sendo enviado...' : 'Ver comentários'}
          >
            <FiMessageCircle size={20} />
            <span className="text-sm font-medium">{commentsCount}</span>
          </button>
        </div>
      </div>

      {/* Seção de comentários */}
      {showComments && !isTemporary && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Formulário de novo comentário */}
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex gap-3">
              <img
                src={
                  currentUser?.profile?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.profile?.displayName || currentUser?.email || 'U')}&background=0ea5e9&color=fff`
                }
                alt="Você"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  disabled={loading}
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:opacity-50"
                  title="Enviar comentário"
                >
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <FiSend />}
                </button>
              </div>
            </div>
          </form>

          {/* Lista de comentários */}
          <div className="space-y-3">
            {comments.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>}

            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img
                  src={
                    comment.user?.profile?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.profile?.displayName || comment.user?.email || 'U')}&background=0ea5e9&color=fff`
                  }
                  alt={comment.user?.profile?.displayName || comment.user?.email}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{comment.user?.profile?.displayName || comment.user?.email}</h4>
                    <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Botão para carregar mais comentários */}
            {comments.length > 0 && comments.length < commentsCount && (
              <button onClick={loadMoreComments} className="w-full py-2 text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors">
                Ver mais comentários ({commentsCount - comments.length} restantes)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
