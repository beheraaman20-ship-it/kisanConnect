import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket } from 'lucide-react';
import { Table, Column } from '../../components/Table';
import { StatusBadge } from '../../components/StatusBadge';
import { adminService } from '../../services/adminService';

interface Token {
  id: string;
  tokenNumber: string;
  farmerName?: string;
  farmerMobile?: string;
  centerName?: string;
  status: string;
  queuePosition: number;
  estimatedWaitTime: number;
  bookedAt: string;
}

export const TokensPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tokens'],
    queryFn: adminService.getTokens,
  });

  const tokens = data?.data || [];

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns: Column<Token>[] = [
    {
      key: 'tokenNumber',
      header: 'Token',
      render: (row) => (
        <div className="flex items-center">
          <Ticket className="h-4 w-4 text-green-600 mr-2" />
          <span className="font-semibold text-green-700">
            {row.tokenNumber}
          </span>
        </div>
      ),
    },
    {
      key: 'farmer',
      header: 'Farmer',
      render: (row) => (
        <div>
          <div className="font-medium">{row.farmerName}</div>
          <div className="text-xs text-gray-400">{row.farmerMobile}</div>
        </div>
      ),
    },
    { key: 'centerName', header: 'Center' },
    {
      key: 'queuePosition',
      header: 'Queue Position',
      render: (row) => (
        <span className="font-medium text-yellow-600">
          {row.queuePosition}
        </span>
      ),
    },
    {
      key: 'estimatedWaitTime',
      header: 'Est. Wait',
      render: (row) => (
        <span className="font-medium text-blue-600">
          {row.estimatedWaitTime} min
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'bookedAt',
      header: 'Booked At',
      render: (row) => formatTime(row.bookedAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tokens</h1>
        <p className="text-sm text-gray-500 mt-1">
          All active and historical tokens
        </p>
      </div>

      <Table columns={columns} data={tokens} loading={isLoading} />
    </div>
  );
};
