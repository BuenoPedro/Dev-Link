import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { FiImage, FiSend, FiX, FiUser } from 'react-icons/fi';

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await api.get('/api/auth/me');
      setMe(userData.user);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Digite algo para postar!');
      return;
    }

    setLoading(true);

    // Criar post temporário para exibição INSTANTÂNEA
    const tempPost = {
      id: `temp-${Date.now()}-${Math.random()}`,
      content: content.trim(),
      imageUrl: imageUrl.trim() || null,
      authorType: 'USER',
      authorId: me.id,
      author: {
        id: me.id,
        profile: me.profile,
        email: me.email,
      },
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTemporary: true,
    };

    // Salvar dados do formulário
    const tempContent = content;
    const tempImageUrl = imageUrl;

    // Mostrar post IMEDIATAMENTE
    if (onPostCreated) {
      onPostCreated(tempPost, true);
    }

    // Limpar formulário IMEDIATAMENTE
    handleClearForm();

    try {
      const postData = {
        content: tempContent.trim(),
        imageUrl: tempImageUrl.trim() || null,
        authorType: 'USER',
      };

      // Enviar para o backend
      const response = await api.post('/api/posts', postData);

      // Substituir post temporário pelo real
      if (onPostCreated) {
        onPostCreated(response.post, false, tempPost.id);
      }

      console.log('✅ Post criado com sucesso!');

      // REMOVIDO: Não fazer reload automático
      // A UI otimística já cuidou de mostrar o post
    } catch (error) {
      console.error('❌ Erro ao criar post:', error);

      // Restaurar formulário em caso de erro
      setContent(tempContent);
      setImageUrl(tempImageUrl);
      if (tempImageUrl) setShowImageInput(true);

      // Remover post temporário
      if (onPostCreated) {
        onPostCreated(null, false, tempPost.id);
      }

      alert(error.message || 'Erro ao criar post. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setContent('');
    setImageUrl('');
    setShowImageInput(false);
    setImagePreviewError(false);
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setImagePreviewError(false);
  };

  const handleImageError = () => {
    setImagePreviewError(true);
  };

  const removeImage = () => {
    setImageUrl('');
    setShowImageInput(false);
    setImagePreviewError(false);
  };

  if (!me) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={me.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(me.profile?.displayName || me.email || 'U')}&background=0ea5e9&color=fff`}
            alt="Você"
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(me.profile?.displayName || me.email || 'U')}&background=0ea5e9&color=fff`;
            }}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{me.profile?.displayName || me.email}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FiUser size={12} />
              Compartilhar como pessoa física
            </p>
          </div>
        </div>

        {/* Campo de texto */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que você está pensando? Compartilhe suas ideias, conhecimentos ou experiências..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
            maxLength={2000}
            disabled={loading}
          />
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">{content.length === 0 ? 'Mínimo 1 caractere' : `${content.length}/2000 caracteres`}</div>
            {content.length > 1800 && <div className="text-xs text-amber-600 dark:text-amber-400">⚠️ Próximo do limite</div>}
          </div>
        </div>

        {/* Campo de imagem */}
        {showImageInput && (
          <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <FiImage className="inline mr-1" />
                URL da Imagem
              </label>
              <button type="button" onClick={removeImage} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1" title="Remover imagem">
                <FiX size={16} />
              </button>
            </div>

            <input
              type="url"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="https://exemplo.com/sua-imagem.jpg"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              disabled={loading}
            />

            <div className="text-xs text-gray-500 dark:text-gray-400">💡 Dica: Use URLs de serviços como Imgur, Unsplash ou seus próprios arquivos hospedados</div>
          </div>
        )}

        {/* Preview da imagem */}
        {imageUrl && !imagePreviewError && (
          <div className="mt-3 relative">
            <img
              src={imageUrl}
              alt="Preview da imagem"
              className="w-full max-h-80 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              onError={handleImageError}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title="Remover imagem"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Erro de imagem */}
        {imageUrl && imagePreviewError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <span>❌</span>
              <span className="text-sm">Não foi possível carregar a imagem</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Verifique se a URL está correta e acessível</p>
          </div>
        )}

        {/* Barra de ações */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {/* Botão para adicionar imagem */}
            {!showImageInput && (
              <button
                type="button"
                onClick={() => setShowImageInput(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <FiImage size={16} />
                Adicionar imagem
              </button>
            )}

            {/* Contador de caracteres visual */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
              <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${content.length > 1800 ? 'bg-red-500' : content.length > 1200 ? 'bg-amber-500' : 'bg-sky-500'}`}
                  style={{ width: `${Math.min((content.length / 2000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Botão de envio */}
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <FiSend size={16} />
                Publicar
              </>
            )}
          </button>
        </div>

        {/* Dicas */}
        {content.length === 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>💡 Dicas para um bom post:</strong>
            </div>
            <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-1 ml-4 list-disc">
              <li>Compartilhe conhecimentos técnicos</li>
              <li>Conte sobre projetos interessantes</li>
              <li>Faça perguntas para a comunidade</li>
              <li>Celebre conquistas profissionais</li>
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
