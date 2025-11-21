import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SidebarUser from '../components/SidebarUser';
import { FiStar, FiCheck, FiZap, FiTrendingUp, FiAward, FiUsers, FiBell, FiHeadphones, FiCreditCard } from 'react-icons/fi';

export default function Premium() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = () => {
    setLoading(true);
    // Aqui você implementaria a lógica de pagamento
    // Por enquanto, apenas simula um delay
    setTimeout(() => {
      setLoading(false);
      alert('Funcionalidade de pagamento em desenvolvimento!');
    }, 1500);
  };

  const features = [
    {
      icon: FiTrendingUp,
      title: 'Prioridade Total',
      description: 'Seu perfil é exibido no topo das listas de candidatos, garantindo que recrutadores vejam você primeiro.',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      icon: FiZap,
      title: 'Destaque Visual Premium',
      description: 'Badge dourado exclusivo no seu perfil e nas listagens, mostrando seu diferencial profissional.',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/20',
    },
    {
      icon: FiAward,
      title: 'Visibilidade Multiplicada',
      description: 'Algoritmo otimizado que aumenta em até 3x suas chances de ser visualizado por recrutadores.',
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-100 dark:bg-sky-900/20',
    },
    {
      icon: FiUsers,
      title: 'Análise de Concorrência',
      description: 'Veja quantos candidatos aplicaram para a mesma vaga e compare seu perfil.',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      icon: FiBell,
      title: 'Notificações Prioritárias',
      description: 'Seja o primeiro a saber sobre novas vagas compatíveis com seu perfil.',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/20',
    },
    {
      icon: FiHeadphones,
      title: 'Suporte Exclusivo',
      description: 'Atendimento prioritário e consultoria de carreira com especialistas.',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-100 dark:bg-indigo-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6 px-4">
      {/* Sidebar Esquerda - Apenas Perfil do Usuário */}
      <aside className="hidden lg:block lg:col-span-1">
        <SidebarUser />
      </aside>

      <div className="col-span-1 lg:col-span-2 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <FiStar className="w-8 h-8 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Dev-Link Premium</h1>
              <p className="text-white/90 text-sm">Acelere sua carreira com vantagens exclusivas</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Investimento Mensal</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-white/90 text-lg">R$</span>
                  <span className="text-5xl font-black">24</span>
                  <span className="text-2xl font-bold">,90</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs mb-2">Economia anual</p>
                <p className="text-2xl font-bold">R$ 298,80</p>
                <p className="text-white/70 text-xs">vs pagar por vaga</p>
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 bg-white hover:bg-gray-50 text-amber-600 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></span>
                  Processando...
                </>
              ) : (
                <>
                  <FiCreditCard className="w-5 h-5" />
                  Assinar Agora
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-black">3x</p>
              <p className="text-white/80 text-xs">Mais visibilidade</p>
            </div>
            <div>
              <p className="text-3xl font-black">1º</p>
              <p className="text-white/80 text-xs">Nas listas</p>
            </div>
            <div>
              <p className="text-3xl font-black">24/7</p>
              <p className="text-white/80 text-xs">Suporte</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">O que você ganha com o Premium</h2>

          <div className="grid gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${feature.bg} rounded-xl shrink-0`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">Resultados Reais</h3>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <img src="https://ui-avatars.com/api/?name=Marina+Silva&size=40&background=0ea5e9&color=fff" alt="Marina" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Marina Silva</p>
                  <p className="text-xs text-gray-500">Desenvolvedora Front-end</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">"Recebi 5 propostas em 2 semanas após assinar o Premium. Totalmente vale a pena!"</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <img src="https://ui-avatars.com/api/?name=Carlos+Santos&size=40&background=f59e0b&color=fff" alt="Carlos" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Carlos Santos</p>
                  <p className="text-xs text-gray-500">Full Stack Developer</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">"O destaque visual fez total diferença. Consegui minha vaga dos sonhos!"</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Perguntas Frequentes</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Posso cancelar a qualquer momento?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sim! Sem fidelidade. Cancele quando quiser e continue aproveitando até o fim do período pago.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Como funciona a prioridade nas candidaturas?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Seu perfil aparece sempre no topo das listas de candidatos que os recrutadores visualizam.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Há garantia de contratação?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O Premium aumenta significativamente sua visibilidade, mas a contratação depende do seu perfil e das empresas.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-center text-white shadow-xl">
          <FiStar className="w-16 h-16 mx-auto mb-4 fill-white" />
          <h3 className="text-2xl font-bold mb-2">Pronto para Decolar?</h3>
          <p className="text-white/90 mb-6">Junte-se a centenas de profissionais que já turbinaram suas carreiras</p>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="px-8 py-4 bg-white hover:bg-gray-50 text-purple-600 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50"
          >
            Começar Agora por R$ 24,90/mês
          </button>
        </div>
      </div>

      {/* Sidebar Direita */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
