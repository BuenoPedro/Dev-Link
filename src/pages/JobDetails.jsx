import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

// --- Ícones SVG Inline ---
const FiArrowLeft = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const FiBriefcase = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const FiMapPin = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const FiClock = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const FiCheckCircle = ({ className, size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const FiAlertCircle = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Novos estados para feedback visual
  const [feedback, setFeedback] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Busca dados do usuário (Auth)
        let currentUser = null;
        try {
            const authRes = await api.get('/api/auth/me');
            currentUser = authRes.user;
        } catch (err) {
            console.log('Usuário não autenticado');
        }

        if (!mounted) return;
        setMe(currentUser);

        // Se for admin de empresa, paramos por aqui (tela branca)
        if (currentUser?.role === 'COMPANY_ADMIN') {
            setLoading(false);
            return;
        }

        // 2. Busca detalhes da vaga
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

  // Lógica de Candidatura
  const handleApply = async () => {
    setFeedback(''); // Limpa mensagens anteriores

    if (!me) {
      setFeedback("Você precisa estar logado para se candidatar.");
      // Opcional: redirecionar automaticamente após alguns segundos
      // setTimeout(() => navigate('/login'), 2000);
      return; 
    }

    if (me.role !== 'USER') {
        setFeedback("Apenas perfis de Candidato podem se aplicar.");
        return;
    }

    try {
      setActionLoading(true);
      await api.post(`/api/jobs/${id}/apply`);
      setJob(prev => ({ ...prev, hasApplied: true }));
    } catch (err) {
      setFeedback(err.response?.data?.message || "Erro ao realizar candidatura.");
    } finally {
      setActionLoading(false);
    }
  };

  // Iniciar fluxo de cancelamento (Mostra confirmação na UI)
  const initiateCancel = () => {
      setFeedback('');
      setIsCanceling(true);
  };

  // Confirmar Cancelamento
  const confirmCancel = async () => {
    try {
      setActionLoading(true);
      await api.delete(`/api/jobs/${id}/apply`);
      setJob(prev => ({ ...prev, hasApplied: false }));
      setIsCanceling(false); // Reseta estado de cancelamento
    } catch (err) {
      setFeedback(err.response?.data?.message || "Erro ao cancelar candidatura.");
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

  // TELA EM BRANCO PARA COMPANY_ADMIN
  if (me?.role === 'COMPANY_ADMIN') {
      return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  if (error || !job) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto mt-20">
            <div className="flex justify-center mb-4">
              <FiAlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Vaga não encontrada</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "Esta vaga pode ter sido removida ou não existe."}</p>
            <button onClick={() => navigate('/jobs')} className="text-sky-600 hover:underline font-medium">
                Voltar para mural de vagas
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-sm text-gray-500 hover:text-sky-600 mb-6 transition-colors group"
        >
          <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA PRINCIPAL: Detalhes */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cabeçalho da Vaga */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-start gap-5">
                 {/* Logo da Empresa */}
                 <img 
                    src={job.company?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company?.name || 'C')}`} 
                    alt={job.company?.name} 
                    className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-gray-700 bg-white"
                  />
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
                        {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
                            {job.company?.name}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                            <FiMapPin className="shrink-0" /> 
                            {job.locationCity || job.locationType}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                            <FiClock className="shrink-0" /> 
                            {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                  </div>
              </div>
            </div>

            {/* Tabela de Detalhes / Ficha Técnica */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                   <FiBriefcase className="text-sky-500" /> Detalhes da Posição
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                 {/* Linha 1 */}
                 <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                       <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Modelo de Trabalho</p>
                       <p className="text-gray-900 dark:text-gray-200 font-medium">
                          {job.locationType === 'REMOTE' ? '100% Remoto' : job.locationType === 'HYBRID' ? 'Híbrido' : 'Presencial'}
                       </p>
                    </div>
                    <div className="p-5 md:border-l border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                       <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Regime de Contratação</p>
                       <p className="text-gray-900 dark:text-gray-200 font-medium">
                          {job.employmentType}
                       </p>
                    </div>
                 </div>

                 {/* Linha 2 */}
                 <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                       <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Senioridade</p>
                       <p className="text-gray-900 dark:text-gray-200 font-medium capitalize">
                          {job.seniority?.replace('_', ' ').toLowerCase()}
                       </p>
                    </div>
                    <div className="p-5 md:border-l border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                       <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Faixa Salarial</p>
                       <p className="text-gray-900 dark:text-gray-200 font-medium">
                          {job.salaryMin ? `R$ ${job.salaryMin.toLocaleString('pt-BR')} - R$ ${job.salaryMax?.toLocaleString('pt-BR')}` : 'A combinar / Não informado'}
                       </p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Descrição da Vaga */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sobre a vaga</h3>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                   {job.description}
                </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Card de Ação */}
          <div className="space-y-6">
             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm sticky top-24">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Interessado nesta vaga?</h3>
                
                {job.hasApplied ? (
                  // ESTADO: JÁ APLICADO
                  <div className="space-y-4">
                     <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400 text-sm">
                        <FiCheckCircle size={20} className="shrink-0" />
                        <span>Sua candidatura foi enviada com sucesso.</span>
                     </div>
                     
                     {!isCanceling ? (
                         <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Deseja desistir desta vaga?</p>
                            <button 
                                onClick={initiateCancel}
                                disabled={actionLoading}
                                className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-900 font-medium transition-colors disabled:opacity-50 text-sm"
                            >
                                Cancelar candidatura
                            </button>
                         </div>
                     ) : (
                         // ESTADO DE CONFIRMAÇÃO DE CANCELAMENTO
                         <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                             <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-3 text-center">Tem certeza que deseja cancelar?</p>
                             <div className="flex gap-2">
                                 <button 
                                     onClick={() => setIsCanceling(false)}
                                     className="flex-1 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                                 >
                                     Não
                                 </button>
                                 <button 
                                     onClick={confirmCancel}
                                     disabled={actionLoading}
                                     className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70"
                                 >
                                     {actionLoading ? '...' : 'Sim'}
                                 </button>
                             </div>
                         </div>
                     )}
                  </div>
                ) : (
                  // ESTADO: PODE APLICAR
                  <div className="space-y-4">
                     <p className="text-sm text-gray-500 dark:text-gray-400">
                        Leia atentamente os requisitos e certifique-se de que seu perfil no DevLink está atualizado antes de aplicar.
                     </p>
                     
                     <button 
                        onClick={handleApply}
                        disabled={actionLoading}
                        className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-lg shadow-sky-200 dark:shadow-none transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {actionLoading ? 'Enviando...' : 'Candidatar-se Agora'}
                     </button>
                  </div>
                )}

                {/* Mensagem de Feedback na tela */}
                {feedback && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                        <FiAlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                            {feedback}
                        </span>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                   <p className="text-xs text-center text-gray-400">
                      Ao se candidatar, você concorda com os termos de uso e privacidade do DevLink.
                   </p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}