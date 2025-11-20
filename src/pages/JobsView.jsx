import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import Sidebar from '../components/Sidebar';
import SidebarUser from '../components/SidebarUser';
// --- INÍCIO: MOCKS E ÍCONES (Para funcionar no preview sem dependências) ---
const FiBriefcase = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const FiMapPin = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const FiClock = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const FiCheckCircle = ({ className, size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const FiAlertCircle = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;



export default function JobsView() {
  const [jobs, setJobs] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  
  // Estado para feedback visual (mensagens)
  const [feedback, setFeedback] = useState({});
  // Estado para confirmação de cancelamento
  const [confirmingCancelId, setConfirmingCancelId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        let userData = null;
        try {
          const userRes = await api.get('/api/auth/me');
          userData = userRes.user;
        } catch (e) {
          console.log('Visitante não autenticado');
        }

        if (!mounted) return;
        setMe(userData);

        const jobsRes = await api.get('/api/jobs');
        const jobsList = Array.isArray(jobsRes) ? jobsRes : (jobsRes.jobs || []);
        
        if (!mounted) return;
        setJobs(jobsList);

      } catch (err) {
        if (!mounted) return;
        console.error(err);
        setError('Não foi possível carregar as vagas no momento.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => { mounted = false; };
  }, []);

  // Auxiliar para setar mensagem de erro/sucesso
  const setJobMessage = (jobId, message) => {
    setFeedback(prev => ({ ...prev, [jobId]: message }));
  };

  const handleApply = async (jobId) => {
    setJobMessage(jobId, '');
    setConfirmingCancelId(null);

    if (!me) {
      setJobMessage(jobId, "Você precisa estar logado para se candidatar.");
      return;
    }

    if (me.role !== 'USER') {
      setJobMessage(jobId, "Apenas usuários registrados como candidatos podem se aplicar para vagas.");
      return;
    }

    try {
      setActionLoading(jobId);
      await api.post(`/api/jobs/${jobId}/apply`);
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, hasApplied: true } : job
      ));
    } catch (err) {
      setJobMessage(jobId, err.response?.data?.message || "Erro ao se candidatar.");
    } finally {
      setActionLoading(null);
    }
  };

  // Inicia fluxo de cancelamento (mostra confirmação na tela)
  const handleCancelClick = (jobId) => {
      setJobMessage(jobId, '');
      setConfirmingCancelId(jobId);
  };

  const handleAbortCancel = () => {
      setConfirmingCancelId(null);
  };

  const handleConfirmCancel = async (jobId) => {
    try {
      setActionLoading(jobId);
      await api.delete(`/api/jobs/${jobId}/apply`);
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, hasApplied: false } : job
      ));
      setConfirmingCancelId(null);
    } catch (err) {
      setJobMessage(jobId, err.response?.data?.message || "Erro ao cancelar candidatura.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6 px-4">
      <aside className="hidden lg:block lg:col-span-1">
         <div className="sticky top-24">
            <SidebarUser />
         </div>
      </aside>

      <div className="col-span-1 lg:col-span-2 space-y-6">
        
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mural de Vagas</h1>
        </div>

        {loading && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Buscando oportunidades...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-center text-sm">
            {error}
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
           <div className="py-12 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
             <p className="text-gray-500">Nenhuma vaga encontrada.</p>
           </div>
        )}

        {!loading && jobs.map((job) => (
          <div key={job.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-sky-600 transition-colors cursor-pointer">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {job.company?.name || 'Empresa Confidencial'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        {job.locationCity ? <><FiMapPin className="w-3 h-3"/> {job.locationCity}</> : (job.locationType === 'REMOTE' ? 'Remoto' : job.locationType)}
                    </span>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs uppercase tracking-wide flex items-center gap-1">
                      <FiBriefcase className="w-3 h-3"/> {job.employmentType}
                    </span>
                  </p>
                </div>
                
                {job.company?.logoUrl && (
                  <img 
                    src={job.company.logoUrl} 
                    alt={job.company.name} 
                    className="w-10 h-10 rounded object-cover border border-gray-100 dark:border-gray-700"
                  />
                )}
              </div>
            </div>

            <div className="p-5">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 text-sm">
                {job.description}
              </p>
              
              <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
                 <FiClock className="w-3 h-3"/> Publicada em {new Date(job.createdAt).toLocaleDateString('pt-BR')}
              </div>
              {me.role==='COMPANY_ADMIN' ? (
                    <div className='mt-6'>
                    <Link 
                      to={`/jobs/${job.id}`}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Ver Detalhes
                    </Link>
                    </div>
              ) : (
              <div className="mt-5 flex flex-col items-start gap-2">
                {/* Área de Ação */}
                <div className="w-full sm:w-auto flex flex-wrap items-center gap-3">
                    {me.role==='COMPANY_ADMIN' || job.hasApplied ? (
                        // Se já aplicou
                        confirmingCancelId === job.id ? (
                            // Modo de Confirmação
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in duration-200">
                                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 text-center">Tem certeza?</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleAbortCancel}
                                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded hover:bg-gray-50 transition-colors"
                                    >
                                        Não
                                    </button>
                                    <button 
                                        onClick={() => handleConfirmCancel(job.id)}
                                        disabled={actionLoading === job.id}
                                        className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-70"
                                    >
                                        {actionLoading === job.id ? '...' : 'Sim'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Botão de Status / Iniciar Cancelamento
                            <div className="flex items-center gap-3">
                                <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1 font-medium bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-800">
                                    <FiCheckCircle /> Candidatura enviada
                                </span>
                                <button 
                                    onClick={() => handleCancelClick(job.id)}
                                    disabled={actionLoading === job.id}
                                    className="text-red-500 hover:text-red-600 text-xs hover:underline disabled:opacity-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )
                    ) : (
                        // Se não aplicou
                        <button 
                            onClick={() => handleApply(job.id)}
                            disabled={actionLoading === job.id}
                            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto"
                        >
                            {actionLoading === job.id ? 'Processando...' : 'Candidatar-se'}
                        </button>
                    )}

                    {/* Botão Ver Detalhes */}
                    <Link 
                      to={`/jobs/${job.id}`}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Ver Detalhes
                    </Link>
                </div>

                {/* Mensagem de Feedback (Erro ou Aviso) */}
                {feedback[job.id] && (
                  <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                    <FiAlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-amber-700 dark:text-amber-300">
                        {feedback[job.id]}
                    </span>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block lg:col-span-1">
        <Sidebar />
      </div>
    </div>
  );
}