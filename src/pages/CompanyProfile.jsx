import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { FiEdit2, FiPlus, FiUser, FiGlobe, FiMessageCircle, FiCalendar } from 'react-icons/fi';
import SidebarCompany from '../components/SidebarCompany';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';

export default function CompanyProfile() {
  const { id } = useParams();
  const debouncedId = useDebounce(id, 300);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);

  // Posts states
  const [posts, setPosts] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Refs para detectar quando o usuário está digitando
  const userIsTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  // Form perfil (Adaptado para campos de Empresa)
  const [form, setForm] = useState({
    name: '',
    description: '',
    logoUrl: '',
    siteUrl: '',
    foundedAt: '',
  });

  const canSaveProfile = useMemo(() => true, []);
  const isOwnProfile = !debouncedId;

  // Função auxiliar para formatar CNPJ
  const formatCNPJ = (value) => {
    if (!value) return '';
    return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  // Função para marcar que usuário está digitando
  const markUserTyping = () => {
    userIsTypingRef.current = true;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      userIsTypingRef.current = false;
    }, 3000);
  };

  // Carregar posts do usuário
  const loadUserPosts = async (userId = null) => {
    try {
      setLoadingPosts(true);
      let postsData;

      if (userId) {
        // Posts de outro usuário/empresa
        postsData = await api.get('/api/posts', { params: { limit: 20 } });
        postsData.posts = postsData.posts.filter((post) => post.authorType === 'COMPANY' && post.authorId === userId);
      } else {
        // Posts próprios
        postsData = await api.get('/api/posts', { params: { limit: 20 } });
        // Ajuste aqui: assumindo que se é empresa, o authorType deve ser checado ou o backend filtra
        postsData.posts = postsData.posts.filter((post) => post.authorId === me?.id);
      }

      setPosts(postsData.posts || []);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const now = Date.now();
      if (now - lastLoadTime < 1000) {
        setTimeout(() => {
          if (mounted) loadProfile();
        }, 1000 - (now - lastLoadTime));
        return;
      }

      setLastLoadTime(now);

      try {
        let userData;

        if (debouncedId) {
          userData = await api.get(`/api/companies/${debouncedId}`);
        } else {
          // Carrega perfil da própria empresa logada - CORRIGIDO: /api/auth/me
          userData = await api.get('/api/auth/cme');
        }

        if (!mounted) return;

        // userData.user aqui é o objeto empresa retornado pelo backend
        setMe(userData.user);

        if (!userIsTypingRef.current) {
          const data = userData.user || {};
          setForm({
            name: data.name || '',
            description: data.description || '',
            logoUrl: data.logoUrl || '',
            siteUrl: data.siteUrl || '',
            foundedAt: data.foundedAt ? data.foundedAt.slice(0, 10) : '',
          });
        }

        if (mounted) {
          await loadUserPosts(debouncedId);
        }
      } catch (err) {
        if (!mounted) return;
        if (err.message.includes('Too Many Requests') || err.message.includes('429')) {
          setTimeout(() => { if (mounted) loadProfile(); }, 5000);
          return;
        }
        console.error('Erro ao carregar perfil:', err);
        if (!debouncedId) {
           // window.location.href = '/'; // Comentado para evitar redirect em dev se der erro
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [debouncedId, lastLoadTime]);

  // -------- Posts functions
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setShowCreatePost(false);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  // -------- Perfil (Salvar dados da Empresa)
  const saveProfile = async (e) => {
    e?.preventDefault?.();
    if (!canSaveProfile || !isOwnProfile) return;
    
    // Payload ajustado para campos de empresa
    const payload = { ...form };
    
    try {
      // Ajuste a rota conforme seu backend (ex: /api/companies/me ou similar)
      // Como o endpoint de leitura é /me, o de update deve ser coerente
      const r = await api.put('/api/companies/me', payload); 
      
      setMe((old) => ({ ...old, ...r.user })); // Atualiza estado local
      setOpen(false);
      userIsTypingRef.current = false;
    } catch (err) {
      alert(err.message || 'Falha ao salvar perfil');
    }
  };

  if (loading) {
    return (
      <div className="pt-24 max-w-4xl mx-auto px-4">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Carregando perfil da empresa...</span>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="pt-24 max-w-4xl mx-auto px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Empresa não encontrada</h2>
          <p className="text-gray-600 dark:text-gray-400">O perfil que você está procurando não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 max-w-6xl mx-auto px-4 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações básicas do perfil */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <img
                src={me.logoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(me.name)}
                alt=""
                className="w-20 h-20 rounded-full object-cover"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{me.name}</h1>
                
                {/* CNPJ no lugar da Headline */}
                {me.cnpj && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-mono mt-1">
                        CNPJ: {formatCNPJ(me.cnpj)}
                    </p>
                )}

                <div className="flex flex-wrap gap-3 mt-2 text-sm">
                  {me.siteUrl && (
                    <a className="inline-flex items-center gap-1 text-sky-600 hover:underline" href={me.siteUrl} target="_blank" rel="noreferrer">
                      <FiGlobe /> Website
                    </a>
                  )}
                  {me.foundedAt && (
                     <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <FiCalendar /> Desde {new Date(me.foundedAt).getFullYear()}
                     </span>
                  )}
                </div>
              </div>

              {/* Botões de ação */}
              <div className="ml-auto flex gap-3">
                {isOwnProfile && (
                  <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors"
                  >
                    <FiEdit2 /> Editar perfil
                  </button>
                )}
              </div>
            </div>

            {me.description && <p className="mt-4 text-gray-700 dark:text-gray-200 whitespace-pre-line">{me.description}</p>}
          </div>

          {/* Publicações */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                <FiMessageCircle className="inline mr-2" />
                Publicações {posts.length > 0 && `(${posts.length})`}
              </h2>
              {isOwnProfile && (
                <button
                  onClick={() => setShowCreatePost(!showCreatePost)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <FiPlus /> {showCreatePost ? 'Cancelar' : 'Nova Publicação'}
                </button>
              )}
            </div>

            {/* Formulário de criar post */}
            {showCreatePost && isOwnProfile && (
              <div className="mb-6">
                <CreatePost onPostCreated={handlePostCreated} />
              </div>
            )}

            {/* Lista de posts */}
            <div className="space-y-4">
              {loadingPosts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando publicações...</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post} currentUser={me} onPostDelete={handlePostDeleted} />)
              ) : (
                <div className="text-center py-8 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FiMessageCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {isOwnProfile ? 'Nenhuma publicação ainda' : 'Esta empresa ainda não publicou nada'}
                  </h3>
                  {isOwnProfile ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Compartilhe novidades e atualizações</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Quando {me.name || 'esta empresa'} publicar algo, aparecerá aqui</p>
                  )}
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      <FiPlus /> Criar primeira publicação
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR DIREITA */}
        <div className="space-y-6">
          <SidebarCompany companyId={me.id} />
        </div>
      </div>

      {/* DRAWER à direita - EDITAR PERFIL */}
      {open && isOwnProfile && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
          <div className="w-full max-w-xl h-full overflow-y-auto bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6">
            
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
               <FiUser className="text-sky-600 text-xl" />
               <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar Empresa</h2>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    markUserTyping();
                    setForm({ ...form, name: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Nome da empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição / Sobre</label>
                <textarea
                  value={form.description}
                  onChange={(e) => {
                    markUserTyping();
                    setForm({ ...form, description: e.target.value });
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Conte um pouco sobre a empresa..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL do Logo</label>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => {
                    markUserTyping();
                    setForm({ ...form, logoUrl: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="https://example.com/logo.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                <input
                  type="url"
                  value={form.siteUrl}
                  onChange={(e) => {
                    markUserTyping();
                    setForm({ ...form, siteUrl: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="https://suaempresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Fundação</label>
                <input
                  type="date"
                  value={form.foundedAt}
                  onChange={(e) => {
                    markUserTyping();
                    setForm({ ...form, foundedAt: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  Salvar Dados
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}