import { FiExternalLink, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import SidebarProfile from './SidebarProfile';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const Sidebar = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchJobs = async () => {
      try {
        // Adicionei um limit=5 para não carregar 100 vagas na sidebar
        const data = await api.get('/api/jobs', { params: { limit: 5 } });
        
        if (!mounted) return;
        
        // Tratamento para garantir que jobsList seja um array
        // Dependendo do interceptor, data pode ser a resposta completa ou já o payload
        const jobsData = data.jobs ? data.jobs : (Array.isArray(data) ? data : []);
        setJobs(jobsData);
        
      } catch (err) {
        if (!mounted) return;
        console.error(err);
        setError('Não foi possível carregar as vagas.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchJobs();

    return () => { mounted = false; };
  }, []);

  // Mock data para notícias
  const news = [
    { id: 1, title: 'React 19 Beta: Novidades e Breaking Changes', source: 'React Blog' },
    { id: 2, title: 'Como o TypeScript 5.3 Melhora a DX', source: 'TypeScript Weekly' },
    { id: 3, title: 'Tendências de Frontend para 2024', source: 'Dev Community' },
  ];

  return (
    <div className="space-y-6">
      {/* Pessoas que talvez conheça */}
      <SidebarProfile />

      {/* Bloco de Vagas */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Novas Vagas</h2>
            <Link to="/jobs" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 text-sm font-medium">
              Ver mais
            </Link>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
             <div className="text-center py-4 text-xs text-gray-500">Carregando vagas...</div>
          ) : error ? (
             <div className="text-center py-4 text-xs text-red-500">Erro ao carregar</div>
          ) : jobs.length === 0 ? (
             <div className="text-center py-4 text-xs text-gray-500">Nenhuma vaga recente.</div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 pb-3 last:pb-0">
                  <Link to={`/jobs/${job.id}`} className="block group">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 group-hover:text-sky-600 transition-colors line-clamp-1">
                        {job.title}
                    </h3>
                    
                    {/* CORREÇÃO AQUI: Acessar .name dentro do objeto company */}
                    <p className="text-gray-600 dark:text-gray-300 text-xs mb-1">
                        {job.company?.name || 'Empresa Confidencial'}
                    </p>
                    
                    {/* CORREÇÃO AQUI: Usar os campos corretos do banco */}
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {job.locationCity || (job.locationType === 'REMOTE' ? 'Remoto' : job.locationType)} 
                        {' • '} 
                        {job.employmentType}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <Link to="/jobs" className="w-full mt-4 text-sky-600 hover:text-sky-700 dark:text-sky-400 text-sm font-medium flex items-center justify-center space-x-1">
            <span>Ver todas as vagas</span>
            <FiExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Bloco de Notícias */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <FiTrendingUp size={18} className="text-sky-600" />
              <span>Notícias</span>
            </h2>
            <Link to="/news" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 text-sm font-medium">
              Ver mais
            </Link>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            {news.map((article) => (
              <div key={article.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 pb-3 last:pb-0">
                <a href="#" className="block group">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 leading-tight group-hover:text-sky-600 transition-colors">
                        {article.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{article.source}</p>
                </a>
              </div>
            ))}
          </div>

          <Link to="/news" className="w-full mt-4 text-sky-600 hover:text-sky-700 dark:text-sky-400 text-sm font-medium flex items-center justify-center space-x-1">
            <span>Ver mais notícias</span>
            <FiExternalLink size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;