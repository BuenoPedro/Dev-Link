import React, { useState } from 'react';
import { FiUserPlus, FiUserCheck, FiClock, FiUserX } from 'react-icons/fi';
import { useConnections } from '../hooks/useConnections';

export default function ConnectionButton({ userId, className = '' }) {
  const { sendConnectionRequest, getConnectionStatus } = useConnections();
  const [isLoading, setIsLoading] = useState(false);
  const status = getConnectionStatus(userId);

  const handleConnectionRequest = async () => {
    setIsLoading(true);
    const result = await sendConnectionRequest(userId);
    if (!result.success) {
      alert(result.message || 'Erro ao enviar solicitação');
    }
    setIsLoading(false);
  };

  const getButtonConfig = () => {
    switch (status) {
      case 'CONNECTED':
        return {
          icon: <FiUserCheck />,
          text: 'Conectado',
          className: 'bg-green-600 text-white cursor-default',
          disabled: true,
        };
      case 'PENDING':
        return {
          icon: <FiClock />,
          text: 'Pendente',
          className: 'bg-yellow-600 text-white cursor-default',
          disabled: true,
        };
      case 'BLOCKED':
        return {
          icon: <FiUserX />,
          text: 'Bloqueado',
          className: 'bg-red-600 text-white cursor-default',
          disabled: true,
        };
      default:
        return {
          icon: <FiUserPlus />,
          text: 'Conectar',
          className: 'bg-sky-600 hover:bg-sky-700 text-white',
          disabled: false,
        };
    }
  };

  const config = getButtonConfig();

  return (
    <button
      onClick={config.disabled ? undefined : handleConnectionRequest}
      disabled={config.disabled || isLoading}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${config.className} ${className}`}
    >
      {config.icon}
      {isLoading ? 'Enviando...' : config.text}
    </button>
  );
}
