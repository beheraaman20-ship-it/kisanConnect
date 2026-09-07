import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { Table, Column } from '../../components/Table';
import { adminService } from '../../services/adminService';

interface Farmer {
  id: string;
  name: string;
  mobile: string;
  district: string;
  village: string;
  totalBookings?: number;
  totalProcurements?: number;
  createdAt: string;
}

export const FarmersPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-farmers'],
    queryFn: adminService.getFarmers,
  });

  const farmers = (data?.data || []).filter(
    (f: Farmer) =>
      !search ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.mobile?.includes(search) ||
      f.district?.toLowerCase().includes(search.toLowerCase()) ||
      f.village?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Farmer>[] = [
    {
      key: 'name',
      header: 'Farmer',
      render: (row) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold mr-3">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    { key: 'mobile', header: 'Mobile' },
    { key: 'village', header: 'Village' },
    { key: 'district', header: 'District' },
    {
      key: 'bookings',
      header: 'Bookings',
      render: (row) => row.totalBookings ?? 0,
    },
    {
      key: 'procurements',
      header: 'Procurements',
      render: (row) => row.totalProcurements ?? 0,
    },
    {
      key: 'createdAt',
      header: 'Registered',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registered farmers in the system
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, mobile, village..."
          className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center text-sm text-gray-500 mb-2">
        <Users className="h-4 w-4 mr-2" />
        {farmers.length} farmers found
      </div>

      <Table columns={columns} data={farmers} loading={isLoading} />
    </div>
  );
};
