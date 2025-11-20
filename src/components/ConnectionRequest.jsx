import React, { useState } from 'react';
import { FiCheck, FiX, FiShield } from 'react-icons/fi';
import { useConnections } from '../hooks/useConnections';

export default function ConnectionRequests() {
  const { requests, respondToRequest, loading } = useConnections();
  const [processingIds, setProcessingIds] = useState(new Set());

  const handleResponse = async (connectionId, action) => {
    setProcessingIds((prev) => new Set(prev).add(connectionId));

    const result = await respondToRequest(connectionId, action);
    if (!result.success) {
      alert(result.message || 'Erro ao processar solicitação');
    }

    setProcessingIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(connectionId);
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
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

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Solicitações de Conexão</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhuma solicitação pendente</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Solicitações de Conexão ({requests.length})</h3>

      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <img
              src={
                request.requester?.profile?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(request.requester?.profile?.displayName || request.requester?.email || 'User')}`
              }
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />

            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{request.requester?.profile?.displayName || request.requester?.email}</h4>
              {request.requester?.profile?.headline && <p className="text-sm text-gray-600 dark:text-gray-400">{request.requester.profile.headline}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(request.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleResponse(request.id, 'ACCEPTED')}
                disabled={processingIds.has(request.id)}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
              >
                <FiCheck size={16} />
                Aceitar
              </button>

              <button
                onClick={() => handleResponse(request.id, 'REJECTED')}
                disabled={processingIds.has(request.id)}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <FiX size={16} />
                Rejeitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
