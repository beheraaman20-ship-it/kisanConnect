import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Table, Column } from '../../components/Table';
import { StatusBadge } from '../../components/StatusBadge';
import { adminService } from '../../services/adminService';

interface Procurement {
  id: string;
  tokenNumber?: string;
  farmerName?: string;
  centerName?: string;
  commodity: string;
  quantity: number;
  qualityStatus: string;
  procurementStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export const ProcurementsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-procurements'],
    queryFn: adminService.getProcurements,
  });

  const procurements = data?.data || [];

  const columns: Column<Procurement>[] = [
    {
      key: 'token',
      header: 'Token',
      render: (row) => (
        <span className="font-semibold text-green-700">
          {row.tokenNumber || row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'farmer',
      header: 'Farmer',
      render: (row) => <span className="font-medium">{row.farmerName}</span>,
    },
    { key: 'centerName', header: 'Center' },
    {
      key: 'commodity',
      header: 'Commodity',
      render: (row) => (
        <div className="flex items-center">
          <Package className="h-4 w-4 text-gray-400 mr-2" />
          {row.commodity}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => `${row.quantity} kg`,
    },
    {
      key: 'qualityStatus',
      header: 'Quality',
      render: (row) => (
        <StatusBadge status={String(row.qualityStatus).toUpperCase()} />
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row) => (
        <StatusBadge status={String(row.paymentStatus).toUpperCase()} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Procurements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Completed and in-progress procurement records
        </p>
      </div>

      <Table columns={columns} data={procurements} loading={isLoading} />
    </div>
  );
};
