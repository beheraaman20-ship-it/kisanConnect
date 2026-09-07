import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar } from 'lucide-react';
import { Table, Column } from '../../components/Table';
import { StatusBadge } from '../../components/StatusBadge';
import { adminService } from '../../services/adminService';

interface Schedule {
  id: string;
  centerId: string;
  centerName?: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSlots: number;
  status: string;
}

interface ScheduleModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  centers: any[];
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ onClose, onSave, centers }) => {
  const [form, setForm] = useState({
    centerId: centers[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '12:00',
    capacity: 50,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Create Schedule</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Center
            </label>
            <select
              value={form.centerId}
              onChange={(e) =>
                setForm({ ...form, centerId: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            >
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  setForm({ ...form, endTime: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity
            </label>
            <input
              type="number"
              value={form.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: +e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              min={1}
            />
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SchedulesPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-schedules'],
    queryFn: adminService.getSchedules,
  });

  const { data: centersData } = useQuery({
    queryKey: ['admin-centers'],
    queryFn: adminService.getCenters,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      setShowModal(false);
    },
  });

  const schedules = data?.data || [];
  const centers = centersData?.data || [];

  const columns: Column<Schedule>[] = [
    {
      key: 'center',
      header: 'Center',
      render: (row) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium">{row.centerName || row.centerId}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) =>
        new Date(row.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
    },
    {
      key: 'time',
      header: 'Time',
      render: (row) => `${row.startTime} - ${row.endTime}`,
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (row) => (
        <div>
          <div className="text-sm">{row.capacity}</div>
          <div className="text-xs text-gray-400">
            {row.availableSlots} available
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage slot schedules for centers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
        >
          <Plus className="h-4 w-4" />
          Create Schedule
        </button>
      </div>

      <Table columns={columns} data={schedules} loading={isLoading} />

      {showModal && (
        <ScheduleModal
          onClose={() => setShowModal(false)}
          onSave={(data) => createMutation.mutate(data)}
          centers={centers}
        />
      )}
    </div>
  );
};
