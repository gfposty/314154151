import React from 'react';

type Status = 'sent' | 'delivered' | 'read' | 'error';

const icons: Record<Status, React.ReactNode> = {
  sent: <span title="Отправлено">✓</span>,
  delivered: <span title="Доставлено">✓✓</span>,
  read: <span title="Прочитано" style={{ color: '#2196f3' }}>✓✓</span>,
  error: <span title="Ошибка" style={{ color: 'red' }}>!</span>,
};

export const MessageStatus: React.FC<{ status: Status }> = ({ status }) => (
  <span className="ml-1 text-xs select-none">{icons[status]}</span>
);

export default MessageStatus;
