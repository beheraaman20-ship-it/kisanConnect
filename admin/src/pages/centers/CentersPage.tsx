import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Pencil, Power } from 'lucide-react';
import { Table, Column } from '../../components/Table';
import { StatusBadge } from '../../components/StatusBadge';
import { adminService } from '../../services/adminService';

interface Center {
  id: string;
  name: string;
  location: string;
  district: string;
  dailyCapacity: number;
  status: string;
}

interface CenterModalProps {
  center?: Center | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

const CenterModal: React.FC<CenterModalProps> = ({ center, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: center?.name || '',
    location: center?.location || '',
    district: center?.district || '',
    dailyCapacity: center?.dailyCapacity || 100,
    status: center?.status || 'OPEN',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">
          {center ? 'Edit Center' : 'Add Center'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Center Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              District
            </label>
            <input
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Capacity
            </label>
            <input
              type="number"
              value={form.dailyCapacity}
              onChange={(e) =>
                setForm({ ...form, dailyCapacity: +e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {center ? 'Save Changes' : 'Add Center'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CentersPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-centers'],
    queryFn: adminService.getCenters,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createCenter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
      setShowModal(false);
      setEditingCenter(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminService.updateCenter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
      setShowModal(false);
      setEditingCenter(null);
    },
  });

  const centers = data?.data || [];

  const handleSave = (formData: any) => {
    if (editingCenter) {
      updateMutation.mutate({ id: editingCenter.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns: Column<Center>[] = [
    {
      key: 'name',
      header: 'Center',
      render: (row) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    { key: 'location', header: 'Location' },
    { key: 'district', header: 'District' },
    {
      key: 'dailyCapacity',
      header: 'Daily Capacity',
      render: (row) => (
        <span className="flex items-center">
          <Power className="h-3 w-3 mr-1 text-gray-400" />
          {row.dailyCapacity}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => {
            setEditingCenter(row);
            setShowModal(true);
          }}
          className="text-gray-400 hover:text-green-600 transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement Centers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage procurement centers across districts
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCenter(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Center
        </button>
      </div>

      <Table columns={columns} data={centers} loading={isLoading} />

      {showModal && (
        <CenterModal
          center={editingCenter}
          onClose={() => {
            setShowModal(false);
            setEditingCenter(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
