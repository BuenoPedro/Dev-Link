import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { FiShield, FiUserPlus, FiTrash2, FiUserX, FiUserCheck } from 'react-icons/fi';

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');

  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', displayName: '' });
  const [delUserId, setDelUserId] = useState('');
  const [delCompanyId, setDelCompanyId] = useState('');
  const [delPostId, setDelPostId] = useState('');
  const [roleUserId, setRoleUserId] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await api.get('/api/auth/me', { skipCache: true });
        if (mounted) setAllowed(r?.user?.role === 'ADMIN');
      } catch (e) {
        console.error(e);
        if (mounted) setAllowed(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  if (loading) return <div className="p-6 text-gray-700 dark:text-gray-200">Carregando…</div>;
  if (!allowed) return <div className="p-6 text-red-600">Acesso restrito ao ADMIN.</div>;

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/admin/users', newAdmin);
      alert('Admin criado com sucesso');
      setNewAdmin({ email: '', password: '', displayName: '' });
    } catch (e) {
      setError(e.message || 'Falha ao criar admin');
    }
  };

  const handleDeleteUser = async () => {
    setError('');
    try {
      await api.delete(`/api/admin/users/${delUserId}`);
      alert('Usuário removido');
      setDelUserId('');
    } catch (e) {
      setError(e.message || 'Falha ao remover usuário');
    }
  };

  const handleDeleteCompany = async () => {
    setError('');
    try {
      await api.delete(`/api/companies/${delCompanyId}`);
      alert('Empresa removida');
      setDelCompanyId('');
    } catch (e) {
      setError(e.message || 'Falha ao remover empresa');
    }
  };

  const handleDeletePost = async () => {
    setError('');
    try {
      await api.delete(`/api/posts/${delPostId}`);
      alert('Post removido');
      setDelPostId('');
    } catch (e) {
      setError(e.message || 'Falha ao remover post');
    }
  };

  const setUserRole = async (role) => {
    setError('');
    try {
      if (!roleUserId) return alert('Informe o ID do usuário');
      const r = await api.put(`/api/admin/users/${roleUserId}/role`, { role });
      alert(`Papel atualizado: ${r.user.email} → ${r.user.role}`);
    } catch (e) {
      setError(e.message || 'Falha ao atualizar papel do usuário');
    }
  };

  return (
    <div className="py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
          <FiShield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Painel do Admin</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gerencie administradores, usuários, empresas e conteúdo.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criar Admin */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FiUserPlus /> Criar novo ADMIN
            </h2>
          </div>
          <form onSubmit={handleCreateAdmin} className="grid gap-3 sm:grid-cols-3">
            <input
              type="email"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="email do admin"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))}
              required
            />
            <input
              type="password"
              minLength={6}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="senha"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))}
              required
            />
            <input
              type="text"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="nome público (opcional)"
              value={newAdmin.displayName}
              onChange={(e) => setNewAdmin((s) => ({ ...s, displayName: e.target.value }))}
            />
            <div className="sm:col-span-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700">
                <FiUserPlus /> Criar ADMIN
              </button>
            </div>
          </form>
        </section>

        {/* Gerenciar papel */}
        <section className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm grid gap-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Gerenciar papel do usuário</h2>
          <div className="grid gap-3 sm:grid-cols-3 items-center">
            <input
              type="text"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="ID do usuário"
              value={roleUserId}
              onChange={(e) => setRoleUserId(e.target.value)}
            />
            <div className="flex gap-2 sm:col-span-2">
              <button onClick={() => setUserRole('ADMIN')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                <FiUserCheck /> Tornar ADMIN
              </button>
              <button onClick={() => setUserRole('USER')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700">
                <FiUserX /> Remover ADMIN
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Use o ID do usuário. Também é possível definir <code className="px-1 rounded bg-gray-100 dark:bg-gray-900">COMPANY_ADMIN</code> via API.</p>
        </section>

        {/* Remoções */}
        <section className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm grid gap-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Remoções</h2>

          <div className="grid gap-3 sm:grid-cols-4 items-center">
            <input
              type="text"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/50 sm:col-span-3"
              placeholder="ID do usuário"
              value={delUserId}
              onChange={(e) => setDelUserId(e.target.value)}
            />
            <button onClick={handleDeleteUser} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 whitespace-nowrap">
              <FiTrash2 /> Remover
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 items-center">
            <input
              type="text"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/50 sm:col-span-3"
              placeholder="ID da empresa"
              value={delCompanyId}
              onChange={(e) => setDelCompanyId(e.target.value)}
            />
            <button onClick={handleDeleteCompany} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 whitespace-nowrap">
              <FiTrash2 /> Remover
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 items-center">
            <input
              type="text"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/50 sm:col-span-3"
              placeholder="ID do post"
              value={delPostId}
              onChange={(e) => setDelPostId(e.target.value)}
            />
            <button onClick={handleDeletePost} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 whitespace-nowrap">
              <FiTrash2 /> Remover
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}