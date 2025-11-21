import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SidebarUser from '../components/SidebarUser';
import { api } from '../lib/api';
import { FiBriefcase, FiMapPin, FiClock, FiCheckCircle, FiAlertCircle, FiXCircle, FiStar, FiFilter, FiX } from 'react-icons/fi';

export default function JobsView() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para controlar loading de ações (apply/cancel)
  const [actionLoading, setActionLoading] = useState(null);

  // Feedback visual (mensagens de erro/sucesso)
  const [feedback, setFeedback] = useState({});

  // Estado para controlar qual vaga está pedindo confirmação de cancelamento
  const [confirmingCancelId, setConfirmingCancelId] = useState(null);

  // Estados de filtro
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    locationType: '',
    employmentType: '',
    seniority: '',
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Identificar usuário
        let userData = null;
        try {
          const userRes = await api.get('/api/auth/me');
          userData = userRes.user;
        } catch (e) {
          // Visitante
        }

        if (!mounted) return;
        setMe(userData);

        // 2. Buscar vagas (o backend já traz hasApplied e applicationStatus)
        const jobsRes = await api.get('/api/jobs');
        const jobsList = Array.isArray(jobsRes) ? jobsRes : jobsRes.jobs || [];

        if (!mounted) return;
        setJobs(jobsList);
        setFilteredJobs(jobsList);
      } catch (err) {
        if (!mounted) return;
        console.error(err);
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

  // Aplicar filtros sempre que mudam
  useEffect(() => {
    let result = [...jobs];

    if (filters.locationType) {
      result = result.filter((job) => job.locationType === filters.locationType);
    }

    if (filters.employmentType) {
      result = result.filter((job) => job.employmentType === filters.employmentType);
    }

    if (filters.seniority) {
      result = result.filter((job) => job.seniority === filters.seniority);
    }

    setFilteredJobs(result);
  }, [filters, jobs]);

  // Função para alterar filtros
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: prev[filterName] === value ? '' : value,
    }));
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setFilters({
      locationType: '',
      employmentType: '',
      seniority: '',
    });
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = filters.locationType || filters.employmentType || filters.seniority;

  // Helper para mensagens
  const setJobMessage = (jobId, message) => {
    setFeedback((prev) => ({ ...prev, [jobId]: message }));
  };

  // Ação: Candidatar
  const handleApply = async (jobId) => {
    setJobMessage(jobId, '');
    setConfirmingCancelId(null);

    if (!me) return setJobMessage(jobId, 'Você precisa estar logado.');
    if (me.role !== 'USER') return setJobMessage(jobId, 'Apenas candidatos podem aplicar.');

    try {
      setActionLoading(jobId);
      await api.post(`/api/jobs/${jobId}/apply`);

      // Atualiza localmente para status APLICADO
      setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, hasApplied: true, applicationStatus: 'APPLIED' } : job)));
    } catch (err) {
      setJobMessage(jobId, err.response?.data?.message || 'Erro ao aplicar.');
    } finally {
      setActionLoading(null);
    }
  };

  // Ação: Confirmar Cancelamento
  const handleConfirmCancel = async (jobId) => {
    try {
      setActionLoading(jobId);
      await api.delete(`/api/jobs/${jobId}/apply`);

      // Atualiza localmente removendo status
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
        {/* Header com Filtros */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mural de Vagas</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <FiFilter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full text-xs">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Painel de Filtros */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
              {/* Modelo de Trabalho */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modelo de Trabalho</label>
                <div className="flex flex-wrap gap-2">
                  {['REMOTE', 'HYBRID', 'ONSITE'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleFilterChange('locationType', type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.locationType === type
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type === 'REMOTE' ? 'Remoto' : type === 'HYBRID' ? 'Híbrido' : 'Presencial'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Contrato</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'CLT', label: 'CLT' },
                    { value: 'PJ', label: 'PJ' },
                    { value: 'FREELANCE', label: 'Freelance' },
                    { value: 'INTERNSHIP', label: 'Estágio' },
                    { value: 'OTHER', label: 'Outro' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleFilterChange('employmentType', type.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.employmentType === type.value
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Senioridade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nível de Senioridade</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'JUNIOR', label: 'Júnior' },
                    { value: 'PLENO', label: 'Pleno' },
                    { value: 'SENIOR', label: 'Sênior' },
                    { value: 'LEAD', label: 'Lead' },
                    { value: 'ANY', label: 'Qualquer' },
                  ].map((level) => (
                    <button
                      key={level.value}
                      onClick={() => handleFilterChange('seniority', level.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.seniority === level.value
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão Limpar Filtros */}
              {hasActiveFilters && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contador de Resultados */}
          {!loading && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
              {hasActiveFilters && ` (filtrado de ${jobs.length})`}
            </div>
          )}
        </div>

        {loading && <div className="py-12 text-center text-gray-500 text-sm">Carregando...</div>}
        {!loading && error && <div className="text-red-500 text-center text-sm">{error}</div>}
        {!loading && !error && filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm mb-2">{hasActiveFilters ? 'Nenhuma vaga encontrada com esses filtros.' : 'Nenhuma vaga encontrada.'}</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sky-600 hover:text-sky-700 text-sm font-medium hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {!loading &&
          filteredJobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              {/* ...existing code... */}
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
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs uppercase tracking-wide">{job.employmentType}</span>
                    </p>
                  </div>
                  {job.company?.logoUrl && <img src={job.company.logoUrl} alt="" className="w-10 h-10 rounded object-cover border border-gray-100 dark:border-gray-700" />}
                </div>
              </div>

              <div className="p-5">
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">{job.description}</p>
                <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
                  <FiClock className="w-3 h-3" /> {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                </div>

                <div className="mt-5 flex flex-col items-start gap-2">
                  <div className="w-full sm:w-auto flex flex-wrap items-center gap-3">
                    {/* --- LÓGICA DE STATUS --- */}

                    {/* 1. REJEITADO */}
                    {job.applicationStatus === 'REJECTED' ? (
                      <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium flex items-center gap-2">
                        <FiXCircle className="w-4 h-4" /> Recusado
                      </div>
                    ) : /* 2. APROVADO (Novo) */
                    job.applicationStatus === 'APPROVED' ? (
                      <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium flex items-center gap-2 animate-in zoom-in">
                        <FiStar className="w-4 h-4 fill-current" /> Aprovado
                      </div>
                    ) : /* 3. APLICADO (Pode cancelar) */
                    job.hasApplied ? (
                      confirmingCancelId === job.id ? (
                        <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 flex gap-2 items-center animate-in fade-in">
                          <span className="text-xs text-red-700 dark:text-red-400">Cancelar?</span>
                          <button
                            onClick={() => setConfirmingCancelId(null)}
                            className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border rounded hover:bg-gray-50 transition-colors"
                          >
                            Não
                          </button>
                          <button
                            onClick={() => handleConfirmCancel(job.id)}
                            disabled={actionLoading === job.id}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Sim
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1 font-medium bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-800">
                            <FiCheckCircle /> Enviada
                          </span>
                          <button
                            onClick={() => {
                              setFeedback('');
                              setConfirmingCancelId(job.id);
                            }}
                            disabled={actionLoading === job.id}
                            className="text-red-500 hover:text-red-600 text-xs hover:underline disabled:opacity-50 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      )
                    ) : (
                      /* 4. NÃO APLICADO (Botão Candidatar) */
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={actionLoading === job.id}
                        className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto shadow-sm"
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

                  {/* Mensagem de Erro/Aviso */}
                  {feedback[job.id] && <div className="text-xs text-amber-600 mt-1 animate-pulse">{feedback[job.id]}</div>}
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
