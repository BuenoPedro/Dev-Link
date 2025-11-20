import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useConnections() {
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const loadConnections = async () => {
    try {
      // Primeiro pega o usuário atual
      const userData = await api.get('/api/auth/me');
      setCurrentUserId(userData.user?.id);

      const [connectionsRes, requestsRes] = await Promise.all([api.get('/api/connections/my'), api.get('/api/connections/requests')]);

      setConnections(connectionsRes || []);
      setRequests(requestsRes || []);
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
      // Se não conseguir carregar, define como arrays vazios para não quebrar a UI
      setConnections([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (addresseeId) => {
    try {
      await api.post('/api/connections/request', { addresseeId });
      await loadConnections();
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      return { success: false, message: error.message };
    }
  };

  const respondToRequest = async (connectionId, action) => {
    try {
      await api.post('/api/connections/respond', { connectionId, action });
      await loadConnections();
      return { success: true };
    } catch (error) {
      console.error('Erro ao responder solicitação:', error);
      return { success: false, message: error.message };
    }
  };

  const getConnectionStatus = (userId) => {
    if (!userId || !currentUserId) return 'NONE';

    // Verifica se há uma conexão aceita
    const accepted = connections.find(
      (conn) =>
        ((conn.requesterId?.toString() === userId.toString() && conn.addresseeId?.toString() === currentUserId.toString()) ||
          (conn.addresseeId?.toString() === userId.toString() && conn.requesterId?.toString() === currentUserId.toString())) &&
        conn.status === 'ACCEPTED'
    );
    if (accepted) return 'CONNECTED';

    // Verifica se há uma solicitação pendente
    const pending = connections.find(
      (conn) =>
        ((conn.requesterId?.toString() === userId.toString() && conn.addresseeId?.toString() === currentUserId.toString()) ||
          (conn.addresseeId?.toString() === userId.toString() && conn.requesterId?.toString() === currentUserId.toString())) &&
        conn.status === 'PENDING'
    );
    if (pending) return 'PENDING';

    return 'NONE';
  };

  useEffect(() => {
    loadConnections();
  }, []);

  return {
    connections,
    requests,
    loading,
    currentUserId,
    sendConnectionRequest,
    respondToRequest,
    getConnectionStatus,
    refreshConnections: loadConnections,
  };
}
