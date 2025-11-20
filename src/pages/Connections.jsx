import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiClock, FiCheck } from 'react-icons/fi';
import { useConnections } from '../hooks/useConnections';
import ConnectionRequests from '../components/ConnectionRequest';

export default function Connections() {
  const { connections, loading, currentUserId } = useConnections();
  const [activeTab, setActiveTab] = useState('all');

  const getFilteredConnections = () => {
    switch (activeTab) {
      case 'accepted':
        return connections.filter((conn) => conn.status === 'ACCEPTED');
      case 'pending':
        return connections.filter((conn) => conn.status === 'PENDING');
      default:
        return connections;
    }
  };

  const filteredConnections = getFilteredConnections();

  if (loading) {
    return (
      <div className="pt-24 max-w-4xl mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Minhas Conexões</h1>
        <p className="text-gray-600 dark:text-gray-400">Gerencie suas conexões profissionais</p>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'all', label: 'Todas', icon: <FiUsers /> },
          { key: 'accepted', label: 'Conectados', icon: <FiCheck /> },
          { key: 'pending', label: 'Pendentes', icon: <FiClock /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Solicitações pendentes */}
      <div className="mb-8">
        <ConnectionRequests />
      </div>

      {/* Lista de conexões */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        {filteredConnections.length === 0 ? (
          <div className="text-center py-12">
            <FiUsers size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhuma conexão encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400">Comece a se conectar com outros profissionais</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConnections.map((connection) => {
              const isRequester = connection.requesterId?.toString() === currentUserId?.toString();
              const otherUser = isRequester ? connection.addressee : connection.requester;

              return (
                <div key={connection.id} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <img
                    src={otherUser?.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.profile?.displayName || otherUser?.email || 'User')}`}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover"
                  />

                  <div className="flex-1">
                    <Link to={`/user/${otherUser?.id}`} className="block hover:text-sky-600 transition-colors">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{otherUser?.profile?.displayName || otherUser?.email}</h3>
                      {otherUser?.profile?.headline && <p className="text-sm text-gray-600 dark:text-gray-400">{otherUser.profile.headline}</p>}
                    </Link>

                    <div className="flex items-center gap-4 mt-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          connection.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : connection.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                      >
                        {connection.status === 'ACCEPTED' && <FiCheck size={12} />}
                        {connection.status === 'PENDING' && <FiClock size={12} />}
                        {connection.status === 'ACCEPTED' ? 'Conectado' : connection.status === 'PENDING' ? 'Pendente' : connection.status}
                      </span>

                      <span className="text-xs text-gray-500">{new Date(connection.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
