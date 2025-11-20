import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { FiMapPin, FiBriefcase, FiUser } from 'react-icons/fi';

export default function SidebarUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.get('/api/auth/me');
        if (userData.user.role === 'COMPANY_ADMIN') {
          const companyData = await api.get('/api/auth/cme');
          setUser(companyData.user);
        } else setUser(userData.user);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden sticky top-20">
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Acessar profile corretamente (igual UserProfile.jsx)
  const profile = user.profile || {};
  
  // Pegar a experiência mais recente
  const latestExperience = user.experiences?.[0];

  return (
    <div className="sticky top-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Foto de perfil */}
      <div className="px-6 pt-6 pb-6">
        <div className="flex flex-col items-center">
          <Link to="/user" className="group">
            <img
              src={
                profile.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || user.email)}&size=128&background=0ea5e9&color=fff`
              }
              alt={profile.displayName || user.email}
              className="w-24 h-24 rounded-full object-cover group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Nome */}
          <Link to="/user" className="mt-4 hover:underline">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
              {profile.displayName || user.name}
            </h2>
          </Link>

          {/* Headline/Cargo */}
          {profile.headline && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-center">
              {profile.headline}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-800 my-4"></div>

        {/* Sobre */}
        {profile.bio && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FiUser className="text-gray-400 text-sm" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sobre</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Localização */}
        {profile.location && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FiMapPin className="text-gray-400" />
              <span>{profile.location}</span>
            </div>
          </div>
        )}

        {/* Experiência atual */}
        {latestExperience && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FiBriefcase className="text-gray-400 text-sm" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Experiência atual
              </h3>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {latestExperience.title}
              </p>
              <p className="text-gray-600 dark:text-gray-400">{latestExperience.company}</p>
              {latestExperience.startDate && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Desde {new Date(latestExperience.startDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-800 my-4"></div>

        {/* Estatísticas */}
        {user._count?.experiences > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm p-2">
              <span className="text-gray-600 dark:text-gray-400">Experiências</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {user._count.experiences}
              </span>
            </div>
          </div>
        )}

        {/* Botão ver perfil */}
        <Link
          to="/user"
          className="mt-4 w-full block text-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Ver perfil completo
        </Link>
      </div>
    </div>
  );
}