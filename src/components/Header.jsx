import React, { useState, useEffect, useRef } from 'react';
import { FiHome, FiBriefcase, FiBell, FiUser, FiSearch, FiMenu, FiMapPin, FiX } from 'react-icons/fi';
import { MdOutlineLogout } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de busca "Tipo Google"
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await api.get('/api/jobs');
        const allJobs = Array.isArray(response) ? response : response.jobs || [];

        const filtered = allJobs
          .filter((job) => job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, 5);

        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Erro na busca', error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/feed');
    } else {
      navigate('/');
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    const isCompany = user.role === 'COMPANY_ADMIN';
    navigate(isCompany ? '/company' : '/user');
  };

  const handleSelectSuggestion = (jobId) => {
    navigate(`/jobs/${jobId}`);
    setSearchTerm('');
    setShowSuggestions(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-sky-500 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button onClick={handleHomeClick} className="flex-shrink-0 cursor-pointer">
              <h1 className="text-white text-xl font-bold">DevLink</h1>
            </button>
          </div>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={handleHomeClick} className="text-white hover:text-sky-200 transition-colors" title="Início">
              <FiHome size={20} />
            </button>
            <Link to="/jobs" className="text-white hover:text-sky-200 transition-colors" title="Vagas">
              <FiBriefcase size={20} />
            </Link>
            <Link to="/news" className="text-white hover:text-sky-200 transition-colors" title="Notícias">
              <FiBell size={20} />
            </Link>
            <button onClick={handleProfileClick} className="text-white hover:text-sky-200 transition-colors" title="Perfil">
              <FiUser size={20} />
            </button>
            {user && (
              <button onClick={handleLogout} className="text-white hover:text-sky-200 transition-colors" title="Logout">
                <MdOutlineLogout size={20} />
              </button>
            )}
          </nav>

          {/* Busca + Theme (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                  placeholder="Buscar vagas..."
                  className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-full py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300 w-64 transition-all"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white">
                  <FiSearch size={16} />
                </button>
              </div>

              {/* Dropdown de Sugestões */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-80 right-0 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                  <ul>
                    {suggestions.map((job) => (
                      <li key={job.id}>
                        <button
                          onClick={() => handleSelectSuggestion(job.id)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex flex-col gap-1 border-b border-gray-100 dark:border-gray-800 last:border-0"
                        >
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{job.title}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{job.company?.name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <FiMapPin size={10} /> {job.locationCity || job.locationType}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <ThemeToggle />
          </div>

          {/* Botão menu mobile */}
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:text-sky-200 transition-colors">
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-sky-600 border-t border-sky-400 pb-4">
            <div className="px-4 pt-4 space-y-3">
              {/* Busca mobile */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar vagas..."
                  className="w-full bg-white rounded-full py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />

                {/* Sugestões Mobile */}
                {suggestions.length > 0 && searchTerm.length >= 2 && (
                  <div className="mt-2 bg-white rounded-lg shadow-lg overflow-hidden relative z-50">
                    {suggestions.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => handleSelectSuggestion(job.id)}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 border-b last:border-0 hover:bg-gray-50"
                      >
                        <div className="font-bold">{job.title}</div>
                        <div className="text-xs text-gray-500">{job.company?.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleHomeClick} className="flex w-full items-center px-3 py-2 text-white hover:bg-sky-700 rounded-md">
                <FiHome size={20} className="mr-3" /> Home
              </button>
              <Link to="/jobs" className="flex items-center px-3 py-2 text-white hover:bg-sky-700 rounded-md">
                <FiBriefcase size={20} className="mr-3" /> Vagas
              </Link>
              <Link to="/news" className="flex items-center px-3 py-2 text-white hover:bg-sky-700 rounded-md">
                <FiBell size={20} className="mr-3" /> Notícias
              </Link>
              <button onClick={handleProfileClick} className="flex w-full items-center px-3 py-2 text-white hover:bg-sky-700 rounded-md">
                <FiUser size={20} className="mr-3" /> Perfil
              </button>
              {user && (
                <button onClick={handleLogout} className="flex w-full items-center px-3 py-2 text-white hover:bg-sky-700 rounded-md">
                  <MdOutlineLogout size={20} className="mr-3" /> Sair
                </button>
              )}
              <div className="px-3">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
