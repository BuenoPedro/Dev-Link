import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiMail, FiLock, FiUser, FiBriefcase, FiCalendar, FiFileText } from 'react-icons/fi';
import { api } from '../lib/api';

export default function LoginModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'company'
  const overlayRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // user forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // company form
  const [company, setCompany] = useState({
    name: '',
    foundedAt: '',
    cnpj: '',
    email: '',
    description: "",
    password: '',
    confirmPassword: '',
  });

  // ESC fecha
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let r
    try {
      if (tab === 'login') {
        r = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('token', r.token);
      } else if (tab === 'register') {
        r = await api.post('/api/auth/register', {
          email,
          password,
          confirmPassword,
          displayName,
          cpf,
          birthDate: birthDate || undefined,
        });
        localStorage.setItem('token', r.token);
      } else {
        // company
        const payload = {
          name: company.name,
          foundedAt: company.foundedAt || undefined,
          cnpj: company.cnpj,
          email: company.email,
          description: company.description,
          password: company.password,
          confirmPassword: company.confirmPassword,
        };
        r = await api.post('/api/companies/register', payload);
        localStorage.setItem('token', r.token);
      }
      console.log("Login bem sucedido. Role:", r.user?.role);
      onClose?.();
      if (r.user?.role === 'COMPANY_ADMIN') {
         window.location.href = '/company';
      } else if  (r.user?.role === 'ADMIN') {
         window.location.href = '/admin';
      }
      else {
         window.location.href = '/user';
      }
    } catch (err) {
      setError(err?.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-md mx-4 rounded-2xl shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="inline-flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{tab === 'login' ? 'Entrar' : tab === 'register' ? 'Criar conta' : 'Cadastrar empresa'}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300" aria-label="Fechar">
            <FiX size={18} />
          </button>
        </div>

        {/* tabs */}
        <div className="px-5 pt-4">
          <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setTab('login')}
              className={
                'px-4 py-1 rounded-full text-sm ' + (tab === 'login' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow' : 'text-gray-600 dark:text-gray-300')
              }
            >
              Login
            </button>
            <button
              onClick={() => setTab('register')}
              className={
                'px-4 py-1 rounded-full text-sm ' + (tab === 'register' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow' : 'text-gray-600 dark:text-gray-300')
              }
            >
              Registrar
            </button>
            <button
              onClick={() => setTab('company')}
              className={
                'px-4 py-1 rounded-full text-sm ' + (tab === 'company' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow' : 'text-gray-600 dark:text-gray-300')
              }
              title="Cadastrar Empresa"
            >
              <span className="inline-flex items-center gap-1">
                <FiBriefcase /> Empresa
              </span>
            </button>
          </div>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Nome público</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiUser />
                  </span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiFileText />
                    </span>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="w-full rounded-lg pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Data de nascimento</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiCalendar />
                    </span>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full rounded-lg pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {tab !== 'company' ? (
            <>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiMail />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="voce@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiLock />
                  </span>
                  <input
                    type="password"
                    value={password}
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {tab === 'register' && (
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Confirmar senha</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiLock />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      minLength={6}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="Repita a senha"
                      required
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Company form */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Nome da empresa</label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Minha Empresa LTDA"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={company.cnpj}
                    onChange={(e) => setCompany((c) => ({ ...c, cnpj: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Data de criação</label>
                  <input
                    type="date"
                    value={company.foundedAt}
                    onChange={(e) => setCompany((c) => ({ ...c, foundedAt: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">E-mail da empresa</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiMail />
                  </span>
                  <input
                    type="email"
                    value={company.email}
                    onChange={(e) => setCompany((c) => ({ ...c, email: e.target.value }))}
                    className="w-full rounded-lg pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="contato@empresa.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiLock />
                  </span>
                  <input
                    type="password"
                    value={company.password}
                    minLength={6}
                    onChange={(e) => setCompany((c) => ({ ...c, password: e.target.value }))}
                    className="w-full rounded-lg pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Confirmar senha</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiLock />
                  </span>
                  <input
                    type="password"
                    value={company.confirmPassword}
                    minLength={6}
                    onChange={(e) => setCompany((c) => ({ ...c, confirmPassword: e.target.value }))}
                    className="w-full rounded-lg pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Repita a senha"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button type="submit" disabled={loading} className="w-full mt-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-medium py-2 transition-colors">
            {loading ? 'Enviando...' : tab === 'login' ? 'Entrar' : tab === 'register' ? 'Criar conta' : 'Cadastrar empresa'}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Ao continuar você concorda com nossos termos.</p>
        </form>
      </div>
    </div>
  );
}
