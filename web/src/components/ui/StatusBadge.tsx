import React from 'react';
import { TokenStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: TokenStatus | string;
}

const getStatusClasses = (status: string): string => {
  switch (status) {
    case TokenStatus.BOOKED:
      return 'bg-blue-50 text-info';
    case TokenStatus.WAITING:
      return 'bg-amber-50 text-warning';
    case TokenStatus.VERIFICATION:
      return 'bg-amber-100 text-amber-700';
    case TokenStatus.INSPECTION:
      return 'bg-amber-100/60 text-amber-800';
    case TokenStatus.PROCUREMENT:
      return 'bg-primary-100 text-primary-800';
    case TokenStatus.COMPLETED:
      return 'bg-green-50 text-success';
    case TokenStatus.CANCELLED:
    case TokenStatus.REJECTED:
      return 'bg-red-50 text-error';
    case TokenStatus.RESCHEDULED:
      return 'bg-neutral-100 text-neutral-600';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={`inline-block self-start rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusClasses(
        status
      )}`}
    >
      {status}
    </span>
  );
};