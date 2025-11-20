import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api } from '../lib/api';

export default function JobsView() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  
  // Estado para armazenar mensagens de feedback (erros/avisos) por vaga
  const [feedback, setFeedback] = useState({});

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

  // Função auxiliar para atualizar a mensagem de uma vaga específica
  const setJobMessage = (jobId, message) => {
    setFeedback(prev => ({ ...prev, [jobId]: message }));
  };

  const handleApply = async (jobId) => {
    // Limpa mensagem anterior ao clicar
    setJobMessage(jobId, '');

    if (!me) {
      setJobMessage(jobId, "Você precisa estar logado para se candidatar.");
      return;
    }

    if (me.role !== 'USER') {
      setJobMessage(jobId, "Apenas candidatos (USER) podem se aplicar.");
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

  const handleCancelApplication = async (jobId) => {
    setJobMessage(jobId, '');

    if (!confirm("Tem certeza que deseja cancelar sua candidatura para esta vaga?")) return;

    try {
      setActionLoading(jobId);

      await api.delete(`/api/jobs/${jobId}/apply`);

      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, hasApplied: false } : job
      ));

    } catch (err) {
      setJobMessage(jobId, err.response?.data?.message || "Erro ao cancelar candidatura.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6 px-4">
      <div className="hidden lg:block lg:col-span-1"></div>

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
                    <span>{job.locationCity ? job.locationCity : job.locationType}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs uppercase tracking-wide">
                      {job.employmentType}
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

              <div className="mt-5 flex flex-col items-start gap-2">
                {/* Botão de Ação Condicional */}
                <div className="flex gap-3">
                  {job.hasApplied ? (
                      <button 
                          onClick={() => handleCancelApplication(job.id)}
                          disabled={actionLoading === job.id}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                          {actionLoading === job.id ? 'Processando...' : 'Cancelar candidatura'}
                      </button>
                  ) : (
                      <button 
                          onClick={() => handleApply(job.id)}
                          disabled={actionLoading === job.id}
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                          {actionLoading === job.id ? 'Processando...' : 'Candidatar-se'}
                      </button>
                  )}
                </div>
                
                {/* Mensagem de Feedback abaixo do botão */}
                {feedback[job.id] && (
                  <span className="text-red-500 text-xs animate-fade-in">
                    {feedback[job.id]}
                  </span>
                )}
              </div>
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