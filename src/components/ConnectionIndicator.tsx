import React from 'react';

export const ConnectionIndicator: React.FC<{ status: 'connected' | 'connecting' | 'disconnected' }> = ({ status }) => {
  const color =
    status === 'connected' ? 'bg-green-500' :
    status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
    'bg-red-500 animate-pulse';
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color} shadow`} />
      <span className="text-xs text-muted-foreground">
        {status === 'connected' && 'Подключено'}
        {status === 'connecting' && 'Подключение...'}
        {status === 'disconnected' && 'Отключено'}
      </span>
    </div>
  );
};

export default ConnectionIndicator;
