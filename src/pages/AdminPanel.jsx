import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');

  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', displayName: '' });
  const [delUserId, setDelUserId] = useState('');
  const [delCompanyId, setDelCompanyId] = useState('');
  const [delPostId, setDelPostId] = useState('');

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

  return (
    <div className="py-6 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Painel do Admin</h1>

      {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

      <section className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">Criar novo ADMIN</h2>
        <form onSubmit={handleCreateAdmin} className="grid gap-3 sm:grid-cols-3">
          <input
            type="email"
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
            placeholder="email do admin"
            value={newAdmin.email}
            onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))}
            required
          />
          <input
            type="password"
            minLength={6}
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
            placeholder="senha"
            value={newAdmin.password}
            onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))}
            required
          />
          <input
            type="text"
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
            placeholder="nome público (opcional)"
            value={newAdmin.displayName}
            onChange={(e) => setNewAdmin((s) => ({ ...s, displayName: e.target.value }))}
          />
          <div className="sm:col-span-3">
            <button className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700">Criar ADMIN</button>
          </div>
        </form>
      </section>

      <section className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 grid gap-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Remoções</h2>

        <div className="grid gap-2 sm:grid-cols-3 items-center">
          <input
            type="text"
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
            placeholder="ID do usuário"
            value={delUserId}
            onChange={(e) => setDelUserId(e.target.value)}
          />
          <button onClick={handleDeleteUser} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 sm:col-span-2">
            Remover usuário
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 items-center">
          <input
            type="text"
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
            placeholder="ID da empresa"
            value={delCompanyId}
            onChange={(e) => setDelCompanyId(e.target.value)}
          />
          <button onClick={handleDeleteCompany} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 sm:col-span-2">
            Remover empresa
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 items-center">
          <input
            type="text"
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
            placeholder="ID do post"
            value={delPostId}
            onChange={(e) => setDelPostId(e.target.value)}
          />
          <button onClick={handleDeletePost} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 sm:col-span-2">
            Remover post
          </button>
        </div>
      </section>
    </div>
  );
}
