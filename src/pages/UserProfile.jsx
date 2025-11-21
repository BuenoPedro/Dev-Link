import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { FiEdit2, FiPlus, FiTrash2, FiBriefcase, FiUser, FiGlobe, FiMapPin, FiGithub, FiMessageCircle } from 'react-icons/fi';
import SidebarProfile from '../components/SidebarProfile';
import ConnectionButton from '../components/ConnectionButton';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';

export default function UserProfile() {
  const { id } = useParams();
  const debouncedId = useDebounce(id, 300);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('perfil');
  const [lastLoadTime, setLastLoadTime] = useState(0);

  // Posts states
  const [posts, setPosts] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Refs para detectar quando o usuário está digitando
  const userIsTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  // form perfil
  const [form, setForm] = useState({
    displayName: '',
    headline: '',
    bio: '',
    avatarUrl: '',
    location: '',
    websiteUrl: '',
    githubUrl: '',
    birthDate: '',
  });

  // skills
  const [skills, setSkills] = useState([]);
  const [skillForm, setSkillForm] = useState({ name: '', proficiency: 3, yearsExp: 0, customName: '' });

  // Lista de linguagens e tecnologias ordenadas alfabeticamente
  const skillOptions = [
    'Angular',
    'Bootstrap',
    'C',
    'C#',
    'C++',
    'CSS',
    'Docker',
    'Express.js',
    'Figma',
    'Flutter',
    'Git',
    'Go',
    'HTML',
    'Java',
    'JavaScript',
    'jQuery',
    'Kotlin',
    'Laravel',
    'MongoDB',
    'MySQL',
    'Next.js',
    'Node.js',
    'PHP',
    'PostgreSQL',
    'Python',
    'React',
    'React Native',
    'Ruby',
    'Rust',
    'SASS/SCSS',
    'SQL',
    'SQLite',
    'Swift',
    'Tailwind CSS',
    'TypeScript',
    'Vue.js',
    'WordPress',
  ]
    .sort()
    .concat(['Outro']);

  // experiências
  const [exps, setExps] = useState([]);
  const [expForm, setExpForm] = useState({
    id: null,
    company: '',
    title: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  });

  const canSaveProfile = useMemo(() => true, []);
  const isOwnProfile = !debouncedId;

  // Função para marcar que usuário está digitando
  const markUserTyping = () => {
    userIsTypingRef.current = true;

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset após 3 segundos de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      userIsTypingRef.current = false;
    }, 3000);
  };

  // Carregar posts do usuário - CORRIGIDO
  const loadUserPosts = async (userId = null) => {
    try {
      setLoadingPosts(true);
      const postsData = await api.get('/api/posts', { params: { limit: 100 } });

      let filteredPosts = [];

      if (userId) {
        // Posts de outro usuário específico
        filteredPosts = (postsData.posts || []).filter((post) => post.authorType === 'USER' && String(post.authorId) === String(userId));
      } else {
        // Posts do próprio usuário logado
        filteredPosts = (postsData.posts || []).filter((post) => post.authorType === 'USER' && String(post.authorId) === String(me?.id));
      }

      setPosts(filteredPosts);
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
      // Prevenir múltiplas requisições em sequência
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
          // Para perfis de outros usuários
          userData = await api.get(`/api/users/${debouncedId}`);
        } else {
          // Para próprio perfil
          userData = await api.get('/api/auth/me');
        }

        if (!mounted) return;

        setMe(userData.user);

        // SÓ ATUALIZAR FORMULÁRIO SE O USUÁRIO NÃO ESTIVER DIGITANDO
        if (!userIsTypingRef.current) {
          const p = userData.user?.profile ?? {};
          setForm({
            displayName: p.displayName || '',
            headline: p.headline || '',
            bio: p.bio || '',
            avatarUrl: p.avatarUrl || '',
            location: p.location || '',
            websiteUrl: p.websiteUrl || '',
            githubUrl: p.githubUrl || '',
            birthDate: p.birthDate ? p.birthDate.slice(0, 10) : '',
          });
        }

        setSkills(userData.user?.skills || []);
        setExps(userData.user?.experiences || []);

        // Carregar posts do usuário - IMPORTANTE: passar o ID correto
        if (mounted) {
          await loadUserPosts(debouncedId || userData.user?.id);
        }
      } catch (err) {
        if (!mounted) return;

        if (err.message.includes('Too Many Requests') || err.message.includes('429') || err.message.includes('Muitas requisições')) {
          console.warn('Rate limit atingido, aguardando...');
          setTimeout(() => {
            if (mounted) loadProfile();
          }, 5000);
          return;
        }

        console.error('Erro ao carregar perfil:', err);
        if (!debouncedId) {
          window.location.href = '/';
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [debouncedId, lastLoadTime]);

  const profile = me?.profile || {};
  const isAdmin = me?.role === 'ADMIN';

  // -------- Posts functions
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setShowCreatePost(false);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  // -------- Perfil (só funciona para próprio perfil)
  const saveProfile = async (e) => {
    e?.preventDefault?.();
    if (!canSaveProfile || !isOwnProfile) return;
    const payload = { ...form };
    try {
      const r = await api.put('/api/users/me/profile', payload);
      setMe((old) => {
        const next = { ...(old || {}), ...r.user };
        next.profile = r.user.profile;
        return next;
      });
      setOpen(false);
      userIsTypingRef.current = false;
    } catch (err) {
      alert(err.message || 'Falha ao salvar perfil');
    }
  };

  // -------- Skills (só funciona para próprio perfil)
  const addSkill = async (e) => {
    e?.preventDefault?.();
    const skillName = skillForm.name === 'Outro' ? skillForm.customName.trim() : skillForm.name.trim();
    if (!skillName || !isOwnProfile) return;

    try {
      const r = await api.post('/api/skills/me', {
        name: skillName,
        proficiency: Number(skillForm.proficiency) || 3,
        yearsExp: Number(skillForm.yearsExp) || 0,
      });
      const link = {
        userId: me.id,
        skillId: r.skill.id,
        proficiency: r.skill.link.proficiency,
        yearsExp: r.skill.link.yearsExp,
        skill: { id: r.skill.id, name: r.skill.name },
      };
      setSkills((prev) => {
        const exists = prev.some((s) => String(s.skillId) === String(link.skillId));
        return exists ? prev.map((s) => (String(s.skillId) === String(link.skillId) ? link : s)) : [link, ...prev];
      });
      setSkillForm({ name: '', proficiency: 3, yearsExp: 0, customName: '' });
    } catch (err) {
      alert(err.message || 'Falha ao adicionar competência');
    }
  };

  const removeSkill = async (skillId) => {
    if (!confirm('Remover esta competência?') || !isOwnProfile) return;
    try {
      await api.del(`/api/skills/me/${skillId}`);
      setSkills((prev) => prev.filter((s) => String(s.skillId) !== String(skillId)));
    } catch (err) {
      alert(err.message || 'Falha ao remover competência');
    }
  };

  // -------- Experiências (só funciona para próprio perfil)
  const resetExpForm = () => {
    setExpForm({ id: null, company: '', title: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    userIsTypingRef.current = false;
  };

  const editExp = (exp) => {
    if (!isOwnProfile) return;
    setTab('experiencias');
    setOpen(true);
    setExpForm({
      id: exp.id,
      company: exp.company,
      title: exp.title,
      startDate: exp.startDate?.slice(0, 10) || '',
      endDate: exp.endDate ? exp.endDate.slice(0, 10) : '',
      isCurrent: !!exp.isCurrent,
      description: exp.description || '',
    });
  };

  const submitExp = async (e) => {
    e?.preventDefault?.();
    if (!isOwnProfile) return;
    const payload = {
      company: expForm.company,
      title: expForm.title,
      startDate: expForm.startDate,
      endDate: expForm.isCurrent ? null : expForm.endDate || null,
      isCurrent: !!expForm.isCurrent,
      description: expForm.description || '',
    };
    try {
      if (expForm.id) {
        const r = await api.put(`/api/experiences/${expForm.id}`, payload);
        setExps((prev) => prev.map((x) => (String(x.id) === String(r.experience.id) ? r.experience : x)));
      } else {
        const r = await api.post('/api/experiences/me', payload);
        setExps((prev) => [r.experience, ...prev]);
      }
      resetExpForm();
    } catch (err) {
      alert(err.message || 'Falha ao salvar experiência');
    }
  };

  const removeExp = async (id) => {
    if (!confirm('Excluir esta experiência?') || !isOwnProfile) return;
    try {
      await api.del(`/api/experiences/${id}`);
      setExps((prev) => prev.filter((x) => String(x.id) !== String(id)));
    } catch (err) {
      alert(err.message || 'Falha ao excluir experiência');
    }
  };

  if (loading) {
    return (
      <div className="pt-24 max-w-4xl mx-auto px-4">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Carregando perfil...</span>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="pt-24 max-w-4xl mx-auto px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Usuário não encontrado</h2>
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
                src={profile.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.displayName || me.email)}
                alt=""
                className="w-20 h-20 rounded-full object-cover"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.displayName || me.email}</h1>
                {profile.headline && <p className="text-gray-600 dark:text-gray-300">{profile.headline}</p>}
                {profile.location && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <FiMapPin /> {profile.location}
                  </p>
                )}

                <div className="flex gap-3 mt-2 text-sm">
                  {profile.websiteUrl && (
                    <a className="inline-flex items-center gap-1 text-sky-600 hover:underline" href={profile.websiteUrl} target="_blank" rel="noreferrer">
                      <FiGlobe /> Website
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a className="inline-flex items-center gap-1 text-sky-600 hover:underline" href={profile.githubUrl} target="_blank" rel="noreferrer">
                      <FiGithub /> GitHub
                    </a>
                  )}
                </div>
              </div>

              {/* Botões de ação */}
              <div className="ml-auto flex gap-3">
                {!isOwnProfile && <ConnectionButton userId={debouncedId} />}

                {isOwnProfile && (
                  <button
                    onClick={() => {
                      setTab('perfil');
                      setOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors"
                  >
                    <FiEdit2 /> Editar perfil
                  </button>
                )}
              </div>
            </div>

            {profile.bio && <p className="mt-4 text-gray-700 dark:text-gray-200 whitespace-pre-line">{profile.bio}</p>}
          </div>

          {/* Bloco especial para ADMIN */}
          {isAdmin && isOwnProfile && (
            <div className="rounded-2xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Perfil de Administrador</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">Este usuário é um administrador.</p>
              <button
                onClick={() => (window.location.href = '/admin')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors"
              >
                Ir para página de Admin
              </button>
            </div>
          )}

          {/* Competências */}
          {!isAdmin && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Competências {skills.length > 0 && `(${skills.length})`}</h2>
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      setTab('competencias');
                      setOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiPlus /> Gerenciar
                  </button>
                )}
              </div>

              {skills?.length ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {skills
                    .sort((a, b) => a.skill.name.localeCompare(b.skill.name))
                    .map((s) => (
                      <div key={s.skillId} className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-3 bg-gray-50 dark:bg-gray-800">
                        <div className="text-gray-900 dark:text-gray-100 font-medium">{s.skill.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Proficiência: {s.proficiency}/5 {s.yearsExp ? `• ${s.yearsExp} ano(s)` : ''}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                          <div className="bg-sky-600 h-1.5 rounded-full transition-all" style={{ width: `${(s.proficiency / 5) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FiPlus className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{isOwnProfile ? 'Adicione suas competências técnicas' : 'Nenhuma competência cadastrada'}</p>
                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        setTab('competencias');
                        setOpen(true);
                      }}
                      className="mt-2 text-sky-600 hover:text-sky-700 text-sm font-medium"
                    >
                      Adicionar primeira competência
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Experiências */}
          {!isAdmin && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Experiências {exps.length > 0 && `(${exps.length})`}</h2>
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      resetExpForm();
                      setTab('experiencias');
                      setOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiPlus /> Adicionar
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {exps.length ? (
                  exps.map((e) => (
                    <div key={e.id} className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <FiBriefcase className="text-sky-600" /> {e.title}
                          </div>
                          <div className="text-gray-600 dark:text-gray-300 font-medium">{e.company}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(e.startDate).toLocaleDateString('pt-BR')} — {e.isCurrent ? 'Atual' : e.endDate ? new Date(e.endDate).toLocaleDateString('pt-BR') : '—'}
                          </div>
                          {e.description && <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-line">{e.description}</p>}
                        </div>
                        {isOwnProfile && (
                          <div className="flex gap-2 ml-4">
                            <button
                              className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                              onClick={() => editExp(e)}
                            >
                              Editar
                            </button>
                            <button className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white transition-colors" onClick={() => removeExp(e.id)}>
                              <FiTrash2 />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <FiBriefcase className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{isOwnProfile ? 'Adicione suas experiências profissionais' : 'Nenhuma experiência cadastrada'}</p>
                    {isOwnProfile && (
                      <button
                        onClick={() => {
                          resetExpForm();
                          setTab('experiencias');
                          setOpen(true);
                        }}
                        className="mt-2 text-sky-600 hover:text-sky-700 text-sm font-medium"
                      >
                        Adicionar primeira experiência
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

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

            {showCreatePost && isOwnProfile && (
              <div className="mb-6">
                <CreatePost onPostCreated={handlePostCreated} />
              </div>
            )}

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
                    {isOwnProfile ? 'Nenhuma publicação ainda' : 'Este usuário ainda não publicou nada'}
                  </h3>
                  {isOwnProfile ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Compartilhe seus conhecimentos e experiências</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Quando {profile.displayName || 'este usuário'} publicar algo, aparecerá aqui</p>
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
          <SidebarProfile />
        </div>
      </div>

      {/* DRAWER à direita - só aparece no próprio perfil */}
      {open && isOwnProfile && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
          <div className="w-full max-w-xl h-full overflow-y-auto bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6">
            <div className="flex gap-2 mb-6">
              {[
                { key: 'perfil', label: 'Perfil', icon: <FiUser /> },
                { key: 'experiencias', label: 'Experiências', icon: <FiBriefcase /> },
                { key: 'competencias', label: 'Competências', icon: <FiPlus /> },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={
                    'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                    (tab === t.key ? 'bg-sky-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700')
                  }
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* ABA PERFIL */}
            {tab === 'perfil' && (
              <form onSubmit={saveProfile} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar Perfil</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome de exibição</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => {
                      markUserTyping();
                      setForm({ ...form, displayName: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headline</label>
                  <input
                    type="text"
                    value={form.headline}
                    onChange={(e) => {
                      markUserTyping();
                      setForm({ ...form, headline: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Sua função ou título"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => {
                      markUserTyping();
                      setForm({ ...form, bio: e.target.value });
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL do Avatar</label>
                  <input
                    type="url"
                    value={form.avatarUrl}
                    onChange={(e) => {
                      markUserTyping();
                      setForm({ ...form, avatarUrl: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Localização</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => {
                      markUserTyping();
                      setForm({ ...form, location: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Cidade, Estado"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                  <input
                    type="url"
                    value={form.websiteUrl}
                    onChange={(e) => {
                      markUserTyping();
                      setForm({ ...form, websiteUrl: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="https://seusite.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub</label>
                  <input
                    type="url"
                    value={form.githubUrl}
                    onChange={(e) => {
                      markUserTyping();
                      setForm({ ...form, githubUrl: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="https://github.com/seuusuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de nascimento</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => {
                      markUserTyping();
                      setForm({ ...form, birthDate: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    Salvar Perfil
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
            )}

            {/* ABA EXPERIÊNCIAS */}
            {tab === 'experiencias' && (
              <form onSubmit={submitExp} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{expForm.id ? 'Editar Experiência' : 'Adicionar Experiência'}</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                  <input
                    type="text"
                    value={expForm.company}
                    onChange={(e) => {
                      markUserTyping();
                      setExpForm({ ...expForm, company: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Nome da empresa"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo</label>
                  <input
                    type="text"
                    value={expForm.title}
                    onChange={(e) => {
                      markUserTyping();
                      setExpForm({ ...expForm, title: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Seu cargo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de início</label>
                  <input
                    type="date"
                    value={expForm.startDate}
                    onChange={(e) => {
                      markUserTyping();
                      setExpForm({ ...expForm, startDate: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isCurrent"
                    checked={expForm.isCurrent}
                    onChange={(e) => {
                      markUserTyping();
                      setExpForm({ ...expForm, isCurrent: e.target.checked });
                    }}
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="isCurrent" className="text-sm text-gray-700 dark:text-gray-300">
                    Trabalho aqui atualmente
                  </label>
                </div>

                {!expForm.isCurrent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de fim</label>
                    <input
                      type="date"
                      value={expForm.endDate}
                      onChange={(e) => {
                        markUserTyping();
                        setExpForm({ ...expForm, endDate: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                  <textarea
                    value={expForm.description}
                    onChange={(e) => {
                      markUserTyping();
                      setExpForm({ ...expForm, description: e.target.value });
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Descreva suas responsabilidades e conquistas..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    {expForm.id ? 'Atualizar' : 'Adicionar'} Experiência
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetExpForm();
                      setOpen(false);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* ABA COMPETÊNCIAS */}
            {tab === 'competencias' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gerenciar Competências</h2>

                <form onSubmit={addSkill} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Linguagem/Tecnologia</label>
                    <select
                      value={skillForm.name}
                      onChange={(e) => {
                        markUserTyping();
                        setSkillForm({ ...skillForm, name: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione uma linguagem/tecnologia</option>
                      {skillOptions.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campo personalizado quando "Outro" for selecionado */}
                  {skillForm.name === 'Outro' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da tecnologia</label>
                      <input
                        type="text"
                        value={skillForm.customName}
                        onChange={(e) => {
                          markUserTyping();
                          setSkillForm({ ...skillForm, customName: e.target.value });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="Ex: AspClassic, TurboBasic..."
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Escreva a tecnologia tudo junto. Ex: AspClassic</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proficiência ({skillForm.proficiency}/5)</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={skillForm.proficiency}
                      onChange={(e) => {
                        markUserTyping();
                        setSkillForm({ ...skillForm, proficiency: Number(e.target.value) });
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Iniciante</span>
                      <span>Básico</span>
                      <span>Intermediário</span>
                      <span>Avançado</span>
                      <span>Expert</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anos de experiência</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={skillForm.yearsExp}
                      onChange={(e) => {
                        markUserTyping();
                        setSkillForm({ ...skillForm, yearsExp: Number(e.target.value) });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    Adicionar Competência
                  </button>
                </form>

                {/* Lista de competências existentes */}
                {skills.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Suas competências:</h3>
                    <div className="space-y-2">
                      {skills
                        .sort((a, b) => a.skill.name.localeCompare(b.skill.name))
                        .map((s) => (
                          <div key={s.skillId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">{s.skill.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Proficiência: {s.proficiency}/5 {s.yearsExp ? `• ${s.yearsExp} ano(s)` : ''}
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                <div className="bg-sky-600 h-1.5 rounded-full transition-all" style={{ width: `${(s.proficiency / 5) * 100}%` }}></div>
                              </div>
                            </div>
                            <button onClick={() => removeSkill(s.skillId)} className="p-1 ml-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors">
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
