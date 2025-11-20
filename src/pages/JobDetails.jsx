import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  FiArrowLeft, 
  FiBriefcase, 
  FiMapPin, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle 
} from 'react-icons/fi';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para UI (Feedback e Confirmação)
  const [feedback, setFeedback] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Busca dados do usuário (para saber role)
        let currentUser = null;
        try {
            const authRes = await api.get('/api/auth/me');
            currentUser = authRes.user;
        } catch (err) {
            console.log('Visitante');
        }

        if (!mounted) return;
        setMe(currentUser);

        // Se for admin de empresa, tela em branco (regra solicitada)
        if (currentUser?.role === 'COMPANY_ADMIN') {
            setLoading(false);
            return;
        }

        // 2. Busca detalhes da vaga
        // O backend atualizado agora retorna 'hasApplied: true' se o token for enviado
        const jobRes = await api.get(`/api/jobs/${id}`);
        
        if (!mounted) return;
        setJob(jobRes.job);

      } catch (err) {
        if (!mounted) return;
        console.error(err);
        setError('Não foi possível carregar os detalhes da vaga.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => { mounted = false; };
  }, [id]);

  const handleApply = async () => {
    setFeedback('');
    
    if (!me) {
        // Se não estiver logado, feedback visual ou redirect
        setFeedback("Faça login para se candidatar.");
        return;
    }
    if (me.role !== 'USER') {
        setFeedback("Apenas candidatos podem se aplicar.");
        return;
    }

    try {
      setActionLoading(true);
      await api.post(`/api/jobs/${id}/apply`);
      setJob(prev => ({ ...prev, hasApplied: true }));
    } catch (err) {
      setFeedback(err.response?.data?.message || "Erro ao aplicar.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await api.delete(`/api/jobs/${id}/apply`);
      setJob(prev => ({ ...prev, hasApplied: false }));
      setIsCanceling(false);
    } catch (err) {
      setFeedback(err.response?.data?.message || "Erro ao cancelar.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen pt-24 flex justify-center items-start bg-gray-50 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mt-20"></div>
        </div>
    );
  }

  if (me?.role === 'COMPANY_ADMIN') return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;

  if (error || !job) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto mt-20">
            <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Vaga não encontrada</h2>
            <button onClick={() => navigate('/jobs')} className="text-sky-600 hover:underline font-medium">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-500 hover:text-sky-600 mb-6 transition-colors group">
          <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA PRINCIPAL */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cabeçalho */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-start gap-5">
                 <img 
                    src={job.company?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company?.name || 'C')}`} 
                    alt={job.company?.name} 
                    className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-gray-700 bg-white"
                  />
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-sky-600 dark:text-sky-400">{job.company?.name}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1"><FiMapPin className="shrink-0" /> {job.locationCity || job.locationType}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1"><FiClock className="shrink-0" /> {new Date(job.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
              </div>
            </div>

            {/* Ficha Técnica */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                   <FiBriefcase className="text-sky-500" /> Detalhes da Posição
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                 <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                       <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Modelo</p>
                       <p className="text-gray-900 dark:text-gray-200 font-medium">{job.locationType}</p>
                    </div>
                    <div className="p-5 md:border-l border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                       <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Regime</p>
                       <p className="text-gray-900 dark:text-gray-200 font-medium">{job.employmentType}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                       <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Senioridade</p>
                       <p className="text-gray-900 dark:text-gray-200 font-medium capitalize">{job.seniority?.replace('_', ' ').toLowerCase()}</p>
                    </div>
                    <div className="p-5 md:border-l border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                       <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Salário</p>
                       <p className="text-gray-900 dark:text-gray-200 font-medium">
                          {job.salaryMin ? `R$ ${job.salaryMin} - ${job.salaryMax}` : 'A combinar'}
                       </p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sobre a vaga</h3>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-line">
                   {job.description}
                </div>
            </div>
          </div>

          {/* COLUNA DIREITA */}
          <div className="space-y-6">
             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm sticky top-24">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Interessado?</h3>
                
                {job.hasApplied ? (
                  <div className="space-y-4">
                     <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400 text-sm">
                        <FiCheckCircle size={20} className="shrink-0" />
                        <span>Candidatura enviada.</span>
                     </div>
                     
                     {!isCanceling ? (
                        <div className="text-center">
                            <button 
                                onClick={() => { setFeedback(''); setIsCanceling(true); }}
                                disabled={actionLoading}
                                className="text-xs text-red-500 hover:text-red-600 hover:underline disabled:opacity-50"
                            >
                                Cancelar candidatura
                            </button>
                        </div>
                     ) : (
                        <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 animate-in fade-in">
                             <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 text-center">Tem certeza?</p>
                             <div className="flex gap-2">
                                 <button onClick={() => setIsCanceling(false)} className="flex-1 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs rounded hover:bg-gray-50">Não</button>
                                 <button onClick={handleCancel} disabled={actionLoading} className="flex-1 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700">{actionLoading ? '...' : 'Sim'}</button>
                             </div>
                        </div>
                     )}
                  </div>
                ) : (
                  <div className="space-y-4">
                     <p className="text-sm text-gray-500 dark:text-gray-400">Leia os requisitos antes de aplicar.</p>
                     <button 
                        onClick={handleApply}
                        disabled={actionLoading}
                        className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-lg shadow-sky-200 dark:shadow-none transition-all transform active:scale-[0.98] disabled:opacity-50"
                     >
                        {actionLoading ? 'Enviando...' : 'Candidatar-se Agora'}
                     </button>
                  </div>
                )}

                {feedback && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                        <FiAlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">{feedback}</span>
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}