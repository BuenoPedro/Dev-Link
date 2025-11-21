import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SidebarUser from '../components/SidebarUser';
import { api } from '../lib/api';
import { FiBriefcase, FiMapPin, FiClock, FiCheckCircle, FiUsers, FiXCircle, FiStar } from 'react-icons/fi';

export default function jobsOnDemand() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const [feedback, setFeedback] = useState({});
  const [confirmingCancelId, setConfirmingCancelId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        let currentUser = null;
        try {
          const authRes = await api.get('/api/auth/me');
          currentUser = authRes.user;
        } catch (err) {}

        if (!mounted) return;
        setMe(currentUser);

        const jobsRes = await api.get('/api/jobs');
        const jobsList = Array.isArray(jobsRes) ? jobsRes : jobsRes.jobs || [];

        if (!mounted) return;
        setJobs(jobsList);
      } catch (err) {
        if (!mounted) return;
        setError('Não foi possível carregar as vagas.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const setJobMessage = (jobId, message) => {
    setFeedback((prev) => ({ ...prev, [jobId]: message }));
  };

  const handleApply = async (jobId) => {
    setJobMessage(jobId, '');
    setConfirmingCancelId(null);

    if (!me) return setJobMessage(jobId, 'Você precisa estar logado.');
    if (me.role !== 'USER') return setJobMessage(jobId, 'Apenas candidatos.');

    try {
      setActionLoading(jobId);
      await api.post(`/api/jobs/${jobId}/apply`);
      setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, hasApplied: true, applicationStatus: 'APPLIED' } : job)));
    } catch (err) {
      setJobMessage(jobId, err.response?.data?.message || 'Erro ao aplicar.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelClick = (jobId) => {
    setJobMessage(jobId, '');
    setConfirmingCancelId(jobId);
  };

  const handleConfirmCancel = async (jobId) => {
    try {
      setActionLoading(jobId);
      await api.delete(`/api/jobs/${jobId}/apply`);
      setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, hasApplied: false, applicationStatus: null } : job)));
      setConfirmingCancelId(null);
    } catch (err) {
      setJobMessage(jobId, err.response?.data?.message || 'Erro ao cancelar.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vagas em alta</h1>
        </div>

        {loading && <div className="py-12 text-center text-gray-500 text-sm">Carregando...</div>}
        {!loading && error && <div className="text-red-500 text-center text-sm">{error}</div>}
        {!loading && !error && jobs.length === 0 && <div className="text-gray-500 text-center text-sm">Nenhuma vaga.</div>}

        {!loading &&
          jobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-sky-600 transition-colors cursor-pointer">{job.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{job.company?.name || 'Confidencial'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {job.locationCity ? (
                          <>
                            <FiMapPin className="w-3 h-3" /> {job.locationCity}
                          </>
                        ) : job.locationType === 'REMOTE' ? (
                          'Remoto'
                        ) : (
                          job.locationType
                        )}
                      </span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs uppercase">{job.employmentType}</span>
                    </p>
                  </div>
                  {job.company?.logoUrl && <img src={job.company.logoUrl} alt="" className="w-10 h-10 rounded object-cover border border-gray-100 dark:border-gray-700" />}
                </div>
              </div>

              <div className="p-5">
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">{job.description}</p>

                <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3 h-3" /> {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                  </span>

                  {/* --- CONTADOR DE CANDIDATURAS (FIXO) --- */}
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-300">
                    <FiUsers className="w-3 h-3" /> 12 candidaturas
                  </span>
                </div>

                <div className="mt-5 flex flex-col items-start gap-2">
                  <div className="w-full sm:w-auto flex flex-wrap items-center gap-3">
                    {/* LÓGICA DE STATUS */}

                    {job.applicationStatus === 'REJECTED' ? (
                      <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium flex items-center gap-2">
                        <FiXCircle className="w-4 h-4" /> Recusado
                      </div>
                    ) : job.applicationStatus === 'APPROVED' ? (
                      <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium flex items-center gap-2 animate-in zoom-in">
                        <FiStar className="w-4 h-4 fill-current" /> Aprovado
                      </div>
                    ) : job.hasApplied ? (
                      confirmingCancelId === job.id ? (
                        <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 flex gap-2 items-center animate-in fade-in">
                          <span className="text-xs text-red-700">Cancelar?</span>
                          <button onClick={() => setConfirmingCancelId(null)} className="text-xs px-2 py-1 bg-white border rounded">
                            Não
                          </button>
                          <button onClick={() => handleConfirmCancel(job.id)} disabled={actionLoading === job.id} className="text-xs px-2 py-1 bg-red-600 text-white rounded">
                            Sim
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1 font-medium bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-800">
                            <FiCheckCircle /> Enviada
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
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={actionLoading === job.id}
                        className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto"
                      >
                        {actionLoading === job.id ? '...' : 'Candidatar-se'}
                      </button>
                    )}

                    <Link
                      to={`/jobs/${job.id}`}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                  {feedback[job.id] && <div className="text-xs text-amber-600 mt-1">{feedback[job.id]}</div>}
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
