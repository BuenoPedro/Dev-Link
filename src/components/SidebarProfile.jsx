import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Link, useParams } from 'react-router-dom';
import ConnectionButton from './ConnectionButton';
import ConnectionRequests from './ConnectionRequest';

export default function SidebarProfile() {
  const { id: userId } = useParams(); // Pega o ID da URL se existir
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    // Verifica se está autenticado antes de fazer a requisição
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('Faça login para ver sugestões de pessoas');
      return;
    }

    (async () => {
      try {
        const data = await api.get('/api/users/me/suggestions?limit=6');
        if (!mounted) return;
        setPeople(data.users || []);
        setError(''); // limpa erro se teve sucesso
      } catch (e) {
        if (!mounted) return;

        // Se erro 401, provavelmente token expirado
        if (e.message.includes('401') || e.message.includes('Unauthorized')) {
          localStorage.removeItem('token'); // remove token inválido
          setError('Sessão expirada. Faça login novamente.');
        } else {
          setError(e?.message || 'Falha ao carregar sugestões');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => (mounted = false);
  }, []);

  return (
    <>
      {/* Solicitações de conexão - só aparece na página própria */}
      {!userId && (
        <div className="mb-6">
          <ConnectionRequests />
        </div>
      )}

      {/* Pessoas sugeridas */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pessoas que talvez conheça</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Baseado em competências semelhantes</p>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Carregando…</div>
          ) : error ? (
            <div className="text-sm text-gray-600 dark:text-gray-300 text-center py-4">{error}</div>
          ) : people.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Sem sugestões no momento.</div>
          ) : (
            <ul className="space-y-4">
              {people.map((p) => {
                const name = p?.profile?.displayName || p.email;
                const avatar = p?.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff`;

                // mostrar até 3 skills em comum (overlap vem do backend)
                const tags = (p.overlap || []).slice(0, 3);

                return (
                  <li key={p.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Link to={`/user/${p.id}`}>
                        <img
                          src={avatar}
                          alt={name}
                          className="w-12 h-12 rounded-full hover:opacity-80 transition-opacity"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff`;
                          }}
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/user/${p.id}`} className="block hover:text-sky-600 transition-colors">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</p>
                          {p.profile?.headline && <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{p.profile.headline}</p>}
                        </Link>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tags.map((tag) => (
                              <span key={tag} className="inline-block px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botão de conexão */}
                    <ConnectionButton userId={p.id} className="w-full text-sm py-1.5" />
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link to="/connections" className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium">
              Ver todas as conexões →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
