import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  MapPin,
  Ticket,
  Package,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { adminService } from '../services/adminService';

const chartData = [
  { day: 'Mon', bookings: 45, completed: 38 },
  { day: 'Tue', bookings: 62, completed: 50 },
  { day: 'Wed', bookings: 58, completed: 52 },
  { day: 'Thu', bookings: 71, completed: 63 },
  { day: 'Fri', bookings: 84, completed: 72 },
  { day: 'Sat', bookings: 90, completed: 78 },
  { day: 'Sun', bookings: 66, completed: 60 },
];

export const DashboardPage: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminService.getDashboard,
  });

  const stats = data?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Procurement system overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Farmers"
          value={stats.totalFarmers ?? 1248}
          icon={Users}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          title="Active Centers"
          value={stats.activeCenters ?? 12}
          icon={MapPin}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          title="Today's Tokens"
          value={stats.tokensToday ?? 86}
          icon={Ticket}
          color="bg-yellow-100 text-yellow-700"
        />
        <StatCard
          title="Today's Procurements"
          value={stats.procurementsToday ?? 74}
          icon={Package}
          color="bg-purple-100 text-purple-700"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate ?? 86}%`}
          icon={TrendingUp}
          color="bg-green-100 text-green-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Weekly Activity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#bookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Bookings vs Completed
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#22c55e" />
                <Bar dataKey="completed" fill="#86efac" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Center Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Today's Queue
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Avg Wait
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(stats.centers || [
                { name: 'Center A', district: 'District 1', queue: 18, wait: 25, status: 'OPEN' },
                { name: 'Center B', district: 'District 2', queue: 32, wait: 45, status: 'OPEN' },
                { name: 'Center C', district: 'District 1', queue: 5, wait: 10, status: 'OPEN' },
              ]).map((center: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{center.name}</td>
                  <td className="px-6 py-4">{center.district}</td>
                  <td className="px-6 py-4">{center.queue ?? center.currentQueueLength}</td>
                  <td className="px-6 py-4">
                    {(center.wait ?? center.estimatedWaitMinutes) + ' min'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        center.status === 'OPEN'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {center.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
