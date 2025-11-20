import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
// Usando react-icons/fi conforme solicitado anteriormente
import { FiBriefcase, FiPlus, FiMapPin, FiClock, FiChevronRight } from 'react-icons/fi';

// 1. Recebemos companyId desestruturado das props
export default function SidebarCompany({ companyId }) {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Se não tiver ID ainda, não busca
    if (!companyId) return;

    let mounted = true;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        // 2. Usamos 'params' para passar a query string.
        // A rota GET /api/jobs aceita ?authorId=...
        // Removemos o 'limit' para trazer tudo (ou o padrão do backend)
        const response = await api.get('/api/jobs', { 
          params: { 
            authorId: companyId,
            // Se quiser forçar "sem limite" e o backend tiver paginação padrão, 
            // você pode mandar um número alto: limit: 1000 
          } 
        }); 
        
        if (!mounted) return;
        
        // O axios/api retorna response.data geralmente, ajuste conforme seu interceptor
        // Se sua api retorna direto o data, use 'response'. Se retorna { data: ... }, use 'response.data'
        // Baseado no seu código anterior:
        const data = response; 

        const jobsList = Array.isArray(data) ? data : (data.jobs || []);
        setJobs(jobsList); 
        setError('');
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setError('Não foi possível carregar as vagas.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchJobs();

    return () => (mounted = false);
  }, [companyId]); // 3. Adicionamos companyId na dependência para recarregar se mudar

  return (
    <div className="space-y-6">
      
      {/* Card de Ação: Publicar Nova Vaga */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg text-sky-600 dark:text-sky-400">
            <FiBriefcase size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vagas</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gerencie suas oportunidades</p>
          </div>
        </div>
        
        <Link 
          to="/jobs/new" 
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <FiPlus /> Publicar nova vaga
        </Link>
      </div>

      {/* Card de Lista: Vagas Publicadas */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Vagas publicadas</h2>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300 text-center py-2">Carregando...</div>
          ) : error ? (
            <div className="text-xs text-red-500 text-center py-2">{error}</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Nenhuma vaga ativa.</p>
              <p className="text-xs text-gray-400">Suas vagas publicadas aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {jobs.map((job) => (
                <li key={job.id} className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0">
                  <Link to={`/jobs/${job.id}`} className="group block">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-sky-600 transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {job.locationCity && (
                        <span className="flex items-center gap-1">
                          <FiMapPin className="w-3 h-3" /> {job.locationCity}
                        </span>
                      )}
                      {job.employmentType && (
                         <span className="flex items-center gap-1">
                           <FiBriefcase className="w-3 h-3" /> {job.employmentType}
                         </span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                        <FiClock className="w-3 h-3" />
                        <span>
                          {new Date(job.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Footer com Link para Ver Todas */}
          {jobs.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Link to="/my-jobs" className="flex items-center justify-between text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium">
                Ver todas as vagas
                <FiChevronRight />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}