import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const statusClasses: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REJECTED: 'bg-red-100 text-red-700',
  RESCHEDULED: 'bg-gray-100 text-gray-600',
  BOOKED: 'bg-blue-100 text-blue-700',
  WAITING: 'bg-yellow-100 text-yellow-700',
  VERIFICATION: 'bg-orange-100 text-orange-700',
  INSPECTION: 'bg-purple-100 text-purple-700',
  PROCUREMENT: 'bg-green-100 text-green-700',
  OPEN: 'bg-green-100 text-green-700',
  CLOSED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const classes = statusClasses[status] || 'bg-gray-100 text-gray-600';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}
    >
      {status}
    </span>
  );
};
