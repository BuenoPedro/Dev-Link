import React from 'react';
import { Link } from 'react-router-dom';
import { FiTrendingUp, FiBriefcase, FiUsers, FiZap, FiStar, FiArrowRight } from 'react-icons/fi';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Dev-Link</span>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 font-medium transition-colors">
                Entrar
              </Link>
              <Link to="/register" className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-sky-600/30">
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
            Conecte-se com as
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent"> Melhores Oportunidades</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            A plataforma que une desenvolvedores talentosos às empresas que mais contratam no mercado tech
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-sky-600/30 flex items-center gap-2"
            >
              Começar Agora <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold text-lg transition-all border border-gray-200 dark:border-gray-700"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center mb-4">
              <FiBriefcase className="w-7 h-7 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vagas Exclusivas</h3>
            <p className="text-gray-600 dark:text-gray-400">Acesso a milhares de vagas de empresas de tecnologia em todo o país</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
              <FiUsers className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Network Profissional</h3>
            <p className="text-gray-600 dark:text-gray-400">Conecte-se com outros desenvolvedores e recrutadores do mercado tech</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4">
              <FiZap className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Candidaturas Rápidas</h3>
            <p className="text-gray-600 dark:text-gray-400">Sistema inteligente que facilita o processo de candidatura em um clique</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-3xl p-12 text-white text-center mb-20">
          <h2 className="text-3xl font-black mb-8">Dev-Link em Números</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <p className="text-5xl font-black mb-2">10K+</p>
              <p className="text-sky-100">Desenvolvedores</p>
            </div>
            <div>
              <p className="text-5xl font-black mb-2">500+</p>
              <p className="text-sky-100">Empresas</p>
            </div>
            <div>
              <p className="text-5xl font-black mb-2">2K+</p>
              <p className="text-sky-100">Vagas Ativas</p>
            </div>
            <div>
              <p className="text-5xl font-black mb-2">95%</p>
              <p className="text-sky-100">Satisfação</p>
            </div>
          </div>
        </div>

        {/* Premium Teaser */}
        <div className="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-3xl p-12 text-white text-center">
          <FiStar className="w-16 h-16 mx-auto mb-4 fill-white" />
          <h2 className="text-3xl font-black mb-4">Turbine sua Carreira com Premium</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">Destaque-se da multidão com prioridade nas candidaturas, badge exclusivo e 3x mais visibilidade</p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-white hover:bg-gray-50 text-amber-600 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl"
          >
            Conhecer Premium
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">© 2025 Dev-Link. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
