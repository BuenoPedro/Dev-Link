import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiUser, FiArrowLeft, FiBriefcase, FiCalendar, FiFileText } from 'react-icons/fi';
import { api } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [accountType, setAccountType] = useState('USER'); // USER ou COMPANY_ADMIN
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User form
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    cpf: '',
    birthDate: '',
  });

  // Company form
  const [companyForm, setCompanyForm] = useState({
    name: '',
    foundedAt: '',
    cnpj: '',
    email: '',
    description: '',
    password: '',
    confirmPassword: '',
  });

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (userForm.password !== userForm.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: userForm.email,
        password: userForm.password,
        confirmPassword: userForm.confirmPassword,
        displayName: userForm.displayName,
        cpf: userForm.cpf,
        birthDate: userForm.birthDate || undefined,
      };

      const response = await api.post('/api/auth/register', payload);

      if (response?.token) {
        localStorage.setItem('token', response.token);
      }

      navigate('/feed');
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (companyForm.password !== companyForm.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: companyForm.name,
        foundedAt: companyForm.foundedAt || undefined,
        cnpj: companyForm.cnpj,
        email: companyForm.email,
        description: companyForm.description,
        password: companyForm.password,
        confirmPassword: companyForm.confirmPassword,
      };

      const response = await api.post('/api/companies/register', payload);

      if (response?.token) {
        localStorage.setItem('token', response.token);
      }

      navigate('/company/profile');
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Erro ao criar conta da empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleCompanyChange = (e) => {
    setCompanyForm({
      ...companyForm,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 mb-8 transition-colors">
          <FiArrowLeft /> Voltar para início
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">D</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Criar Conta</h1>
            <p className="text-gray-600 dark:text-gray-400">Junte-se à maior rede de devs</p>
          </div>

          {/* Tipo de Conta */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tipo de Conta</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('USER')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  accountType === 'USER' ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-sky-300'
                }`}
              >
                <FiUser className="w-6 h-6 mx-auto mb-2 text-sky-600" />
                <p className="font-medium text-gray-900 dark:text-white text-sm">Desenvolvedor</p>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('COMPANY_ADMIN')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  accountType === 'COMPANY_ADMIN' ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-sky-300'
                }`}
              >
                <FiBriefcase className="w-6 h-6 mx-auto mb-2 text-sky-600" />
                <p className="font-medium text-gray-900 dark:text-white text-sm">Empresa</p>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Formulário USER */}
          {accountType === 'USER' && (
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome Completo</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="displayName"
                    value={userForm.displayName}
                    onChange={handleUserChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CPF</label>
                  <div className="relative">
                    <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="cpf"
                      value={userForm.cpf}
                      onChange={handleUserChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nascimento</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="birthDate"
                      value={userForm.birthDate}
                      onChange={handleUserChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={userForm.email}
                    onChange={handleUserChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senha</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={userForm.password}
                    onChange={handleUserChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar Senha</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={userForm.confirmPassword}
                    onChange={handleUserChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mínimo de 6 caracteres</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>
            </form>
          )}

          {/* Formulário EMPRESA */}
          {accountType === 'COMPANY_ADMIN' && (
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Empresa</label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={companyForm.name}
                    onChange={handleCompanyChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Minha Empresa LTDA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CNPJ</label>
                  <div className="relative">
                    <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="cnpj"
                      value={companyForm.cnpj}
                      onChange={handleCompanyChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fundação</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="foundedAt"
                      value={companyForm.foundedAt}
                      onChange={handleCompanyChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email da Empresa</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={companyForm.email}
                    onChange={handleCompanyChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senha</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={companyForm.password}
                    onChange={handleCompanyChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar Senha</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={companyForm.confirmPassword}
                    onChange={handleCompanyChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mínimo de 6 caracteres</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando conta...' : 'Cadastrar Empresa'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-sky-600 hover:text-sky-700 font-medium">
                Entrar
              </Link>
            </p>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.</p>
        </div>
      </div>
    </div>
  );
}
