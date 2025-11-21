import React from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiTrendingUp, FiZap, FiAward, FiCheckCircle } from 'react-icons/fi';

export default function PremiumPacks() {
  return (
    <div className="sticky top-24 space-y-4">
      {/* Card Premium Principal */}
      <div className="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-2xl shadow-lg overflow-hidden border-2 border-amber-300">
        <div className="p-6">
          {/* Badge Premium */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <FiStar className="w-4 h-4 text-white fill-white" />
              <span className="text-white font-bold text-sm uppercase tracking-wider">Premium</span>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-black text-white text-center mb-2">Destaque-se na Multidão</h2>
          <p className="text-white/90 text-center text-sm mb-6">Seja notado pelas melhores empresas</p>

          {/* Preço */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-white/80 text-sm">R$</span>
                <span className="text-5xl font-black text-white">24</span>
                <span className="text-2xl font-bold text-white">,90</span>
              </div>
              <p className="text-white/80 text-xs mt-1">por mês</p>
            </div>
          </div>

          {/* Vantagens */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1 bg-white/20 rounded-full">
                <FiTrendingUp className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Prioridade nas Candidaturas</p>
                <p className="text-white/80 text-xs">Seu perfil aparece no topo da lista</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1 bg-white/20 rounded-full">
                <FiZap className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Destaque Visual</p>
                <p className="text-white/80 text-xs">Selo Premium no seu perfil</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1 bg-white/20 rounded-full">
                <FiAward className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Visibilidade Aumentada</p>
                <p className="text-white/80 text-xs">3x mais chances de ser visto</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            to="/premium"
            className="block w-full text-center px-6 py-3 bg-white hover:bg-gray-50 text-amber-600 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Assinar Premium
          </Link>
        </div>
      </div>

      {/* Card Benefícios Adicionais */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FiCheckCircle className="w-5 h-5 text-green-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">Por que Premium?</h3>
        </div>

        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Recrutadores veem você primeiro</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Badge dourado de destaque</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Notificações prioritárias</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Suporte exclusivo</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
