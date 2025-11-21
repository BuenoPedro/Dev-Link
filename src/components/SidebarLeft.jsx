import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { FiMapPin, FiBriefcase, FiUser, FiGlobe, FiTrendingUp, FiStar, FiZap, FiAward, FiCheckCircle } from 'react-icons/fi';

export default function SidebarLeft() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const authData = await api.get('/api/auth/me');
        const currentUser = authData.user;
        setUser(currentUser);

        if (currentUser.role === 'COMPANY_ADMIN') {
          try {
            const companyData = await api.get('/api/auth/cme');
            setCompany(companyData.user);
          } catch (err) {
            console.error('Erro ao carregar dados da empresa', err);
          }
        }
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
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // --- VISÃO EMPRESA ---
  if (user.role === 'COMPANY_ADMIN') {
    const companyName = company?.name || 'Minha Empresa';
    const companyLogo = company?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=128&background=0f172a&color=fff`;

    return (
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide space-y-4">
        {/* Perfil da Empresa */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-slate-700 to-slate-900"></div>
          <div className="px-6 pb-6 relative">
            <div className="-mt-12 mb-3 flex justify-center">
              <Link to="/company/profile" className="group relative">
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-24 h-24 rounded-xl object-cover border-4 border-white dark:border-gray-900 shadow-md group-hover:scale-105 transition-transform"
                />
              </Link>
            </div>

            <div className="text-center">
              <Link to="/company/profile" className="hover:underline">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{companyName}</h2>
              </Link>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wide mt-1">
                Conta Empresarial
              </span>

              {company?.siteUrl && (
                <a href={company.siteUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 mt-3 text-xs text-sky-600 hover:text-sky-700">
                  <FiGlobe className="w-3 h-3" /> Website
                </a>
              )}
            </div>

            <Link
              to="/company/profile"
              className="mt-4 w-full block text-center px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
            >
              Gerenciar Perfil
            </Link>
          </div>
        </div>

        {/* Botão Vagas em Alta */}
        <Link
          to="/jobsOnDemand"
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <FiTrendingUp className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">Ver Vagas em Alta</span>
          </div>
        </Link>
      </div>
    );
  }

  // --- VISÃO USUÁRIO ---
  const profile = user.profile || {};
  const latestExperience = user.experiences?.[0];

  return (
    <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide space-y-4">
      {/* Perfil do Usuário */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 pt-6 pb-6">
          <div className="flex flex-col items-center">
            <Link to="/user" className="group">
              <img
                src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || user.email)}&size=128&background=0ea5e9&color=fff`}
                alt={profile.displayName || user.email}
                className="w-24 h-24 rounded-full object-cover group-hover:opacity-90 transition-opacity border-4 border-sky-50 dark:border-sky-900/20"
              />
            </Link>

            <Link to="/user" className="mt-4 hover:underline">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">{profile.displayName || user.email}</h2>
            </Link>

            {profile.headline && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-center line-clamp-2">{profile.headline}</p>}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 my-4"></div>

          {profile.bio && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-sky-600 dark:text-sky-400">
                <FiUser className="w-3 h-3" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Sobre</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {profile.location && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FiMapPin className="text-gray-400 shrink-0" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}

          {latestExperience && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <FiBriefcase className="w-3 h-3" />
                <span className="text-xs font-medium uppercase">Atual</span>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{latestExperience.title}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">{latestExperience.company}</p>
              </div>
            </div>
          )}

          <Link
            to="/user"
            className="mt-2 w-full block text-center px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
          >
            Ver perfil completo
          </Link>
        </div>
      </div>

      {/* Botão Vagas em Alta */}
      <Link
        to="/jobsOnDemand"
        className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md hover:border-sky-200 dark:hover:border-sky-900 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-lg group-hover:scale-110 transition-transform">
            <FiTrendingUp className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 dark:text-white text-sm">Vagas em Alta</span>
            <span className="text-xs text-gray-500">Oportunidades quentes</span>
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Premium Pack - Compacto */}
      <div className="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-2xl shadow-lg overflow-hidden border-2 border-amber-300">
        <div className="p-5">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
              <FiStar className="w-3.5 h-3.5 text-white fill-white" />
              <span className="text-white font-bold text-xs uppercase tracking-wider">Premium</span>
            </div>
          </div>

          <h2 className="text-lg font-black text-white text-center mb-1">Destaque-se</h2>
          <p className="text-white/90 text-center text-xs mb-4">Seja visto primeiro</p>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/20">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-white/80 text-xs">R$</span>
                <span className="text-3xl font-black text-white">24</span>
                <span className="text-xl font-bold text-white">,90</span>
              </div>
              <p className="text-white/80 text-[10px] mt-0.5">por mês</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-white text-xs">
              <FiTrendingUp className="w-3 h-3 shrink-0" />
              <span>Prioridade nas candidaturas</span>
            </div>
            <div className="flex items-center gap-2 text-white text-xs">
              <FiZap className="w-3 h-3 shrink-0" />
              <span>Badge Premium dourado</span>
            </div>
            <div className="flex items-center gap-2 text-white text-xs">
              <FiAward className="w-3 h-3 shrink-0" />
              <span>3x mais visibilidade</span>
            </div>
          </div>

          <Link
            to="/premium"
            className="block w-full text-center px-4 py-2.5 bg-white hover:bg-gray-50 text-amber-600 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Assinar Premium
          </Link>
        </div>
      </div>
    </div>
  );
}
