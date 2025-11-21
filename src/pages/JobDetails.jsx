import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { FiArrowLeft, FiBriefcase, FiMapPin, FiClock, FiCheckCircle, FiAlertCircle, FiXCircle, FiX, FiCheck, FiStar } from 'react-icons/fi';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
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
        } catch (err) { }

        if (!mounted) return;
        setMe(currentUser);

        const jobRes = await api.get(`/api/jobs/${id}`);
        if (!mounted) return;
        setJob(jobRes.job);

      } catch (err) {
        if (!mounted) return;
        setError('Não foi possível carregar a vaga.');
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
      setActionLoading('apply');
      await api.post(`/api/jobs/${id}/apply`);
      setJob(prev => ({ ...prev, hasApplied: true, applicationStatus: 'APPLIED' }));
    } catch (err) {
      setFeedback(err.response?.data?.message || "Erro ao aplicar.");
      setFeedback(err.response?.data?.message || "Erro ao aplicar.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading('cancel');
      await api.delete(`/api/jobs/${id}/apply`);
      setJob(prev => ({ ...prev, hasApplied: false, applicationStatus: null }));
      setIsCanceling(false);
    } catch (err) {
      setFeedback(err.response?.data?.message || "Erro ao cancelar.");
    } finally {
      setActionLoading(null);
    }
  };

  // --- Ações de Empresa ---
  const handleRejectCandidate = async (appId) => {
    if (!confirm("Recusar candidato?")) return;
    try {
      setActionLoading(appId);
      await api.put(`/api/jobs/${id}/applications/${appId}/reject`);
      setJob(prev => ({
        ...prev,
        applications: prev.applications.map(app => app.id === appId ? { ...app, status: 'REJECTED' } : app)
      }));
    } catch (err) {
      alert("Erro ao recusar.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveCandidate = async (appId) => {
    if (!confirm("Aprovar candidato para a próxima fase?")) return;
    try {
      setActionLoading(appId);
      // Chamada ao novo endpoint de aprovação
      await api.put(`/api/jobs/${id}/applications/${appId}/approve`);
      
      setJob(prev => ({
        ...prev,
        applications: prev.applications.map(app => app.id === appId ? { ...app, status: 'APPROVED' } : app)
      }));
    } catch (err) {
      alert("Erro ao aprovar.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="min-h-screen pt-24 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div></div>;
  if (error || !job) return <div className="min-h-screen pt-24 text-center text-gray-500">Vaga não encontrada.</div>;

  const isCompanyAdmin = me?.role === 'COMPANY_ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-500 hover:text-sky-600 mb-6 transition-colors"><FiArrowLeft className="mr-2" /> Voltar</button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ESQUERDA */}
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-start gap-5">
                 <img src={job.company?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company?.name || 'C')}`} className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-gray-700" alt=""/>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-sky-600">{job.company?.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><FiMapPin /> {job.locationCity || job.locationType}</span>
                    </div>
                  </div>
              </div>
            </div>

            {/* Lista de Candidatos (Visão Empresa) */}
            {isCompanyAdmin && job.applications && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                 <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"><h2 className="font-semibold text-gray-900 dark:text-white">Candidatos ({job.applications.length})</h2></div>
                 <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {job.applications.length === 0 ? <div className="p-8 text-center text-gray-500">Nenhum candidato.</div> : 
                        job.applications.map((app) => (
                            <div key={app.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                <div className="flex items-center gap-3 flex-1">
                                    <img src={app.user.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.user.profile?.displayName || app.user.email)}`} className="w-10 h-10 rounded-full" alt=""/>
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{app.user.profile?.displayName || app.user.email}</div>
                                        <div className="text-xs text-gray-500">{app.user.profile?.headline || 'Sem título'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {app.status === 'REJECTED' ? (
                                        <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-800">Recusado</span>
                                    ) : app.status === 'APPROVED' ? (
                                        <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-800 flex items-center gap-1">
                                            <FiCheck className="w-3 h-3" /> Aprovado
                                        </span>
                                    ) : (
                                        <>
                                            <button onClick={() => handleRejectCandidate(app.id)} disabled={actionLoading === app.id} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100" title="Recusar">
                                                {actionLoading === app.id ? '...' : <FiX className="w-5 h-5" />}
                                            </button>
                                            <button onClick={() => handleApproveCandidate(app.id)} disabled={actionLoading === app.id} className="p-2 text-green-500 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-100" title="Aprovar">
                                                {actionLoading === app.id ? '...' : <FiCheck className="w-5 h-5" />}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                 </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sobre a vaga</h3>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-line">{job.description}</div>
            </div>
          </div>

          {/* DIREITA: Ação Candidato */}
          <div className="space-y-6">
             {!isCompanyAdmin && (
                 <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm sticky top-24">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Status</h3>
                    
                    {job.applicationStatus === 'REJECTED' ? (
                         <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex flex-col items-center text-center gap-2">
                            <FiXCircle size={32} className="text-red-600 dark:text-red-400" />
                            <span className="font-semibold text-red-700 dark:text-red-400">Candidatura Recusada</span>
                            <p className="text-xs text-red-600 dark:text-red-300">Processo encerrado.</p>
                         </div>
                    ) : job.applicationStatus === 'APPROVED' ? (
                         <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex flex-col items-center text-center gap-2 animate-in zoom-in duration-300">
                            <FiStar size={32} className="text-yellow-500 dark:text-yellow-400 fill-current" />
                            <span className="font-bold text-green-700 dark:text-green-400 text-lg">Parabéns!</span>
                            <p className="text-sm text-green-600 dark:text-green-300 font-medium">Sua candidatura foi aprovada.</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fique atento ao seu e-mail para os próximos passos.</p>
                         </div>
                    ) : job.hasApplied ? (
                      <div className="space-y-4">
                         <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400 text-sm">
                            <FiCheckCircle size={20} /> <span>Candidatura enviada.</span>
                         </div>
                         {!isCanceling ? (
                            <button onClick={() => { setFeedback(''); setIsCanceling(true); }} className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm transition-colors">Cancelar candidatura</button>
                         ) : (
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100">
                                 <p className="text-xs font-medium text-red-700 mb-2 text-center">Tem certeza?</p>
                                 <div className="flex gap-2">
                                     <button onClick={() => setIsCanceling(false)} className="flex-1 py-1.5 bg-white border text-xs rounded">Não</button>
                                     <button onClick={handleCancel} disabled={actionLoading === 'cancel'} className="flex-1 py-1.5 bg-red-600 text-white text-xs rounded">{actionLoading === 'cancel' ? '...' : 'Sim'}</button>
                                 </div>
                            </div>
                         )}
                      </div>
                    ) : (
                      <button onClick={handleApply} disabled={actionLoading === 'apply'} className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-all disabled:opacity-50">
                         {actionLoading === 'apply' ? 'Enviando...' : 'Candidatar-se Agora'}
                      </button>
                    )}
                    {feedback && <div className="mt-4 text-xs text-amber-600 text-center">{feedback}</div>}
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}