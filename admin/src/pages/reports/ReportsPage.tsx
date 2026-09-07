import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '../../components/StatCard';
import { adminService } from '../../services/adminService';

const commodityData = [
  { name: 'Wheat', value: 350 },
  { name: 'Rice', value: 280 },
  { name: 'Maize', value: 150 },
  { name: 'Soybean', value: 120 },
  { name: 'Cotton', value: 90 },
];

const qualityData = [
  { name: 'Grade A', value: 45 },
  { name: 'Grade B', value: 35 },
  { name: 'Grade C', value: 20 },
];

const COLORS = ['#16a34a', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];

export const ReportsPage: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  const stats = data?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Statistics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Key operational metrics and analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Avg Waiting Time"
          value={`${stats.avgWaitTime ?? 28} min`}
          icon={Clock}
          color="bg-yellow-100 text-yellow-700"
        />
        <StatCard
          title="Avg Processing Time"
          value={`${stats.avgProcessingTime ?? 12} min`}
          icon={TrendingUp}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          title="Slot Utilization"
          value={`${stats.slotUtilization ?? 78}%`}
          icon={Users}
          color="bg-green-100 text-green-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Commodity Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={commodityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {commodityData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Quality Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={qualityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  label
                >
                  {qualityData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Monthly Procurements</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { month: 'Jan', amount: 420 },
                { month: 'Feb', amount: 380 },
                { month: 'Mar', amount: 450 },
                { month: 'Apr', amount: 520 },
                { month: 'May', amount: 610 },
                { month: 'Jun', amount: 580 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
          <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <p className="text-sm text-green-700">Completed Procurements</p>
            <p className="text-xl font-bold text-green-800">
              {stats.completedProcurements ?? 1250}
            </p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
          <XCircle className="h-8 w-8 text-red-600 mr-3" />
          <div>
            <p className="text-sm text-red-700">Rejected/Cancelled</p>
            <p className="text-xl font-bold text-red-800">
              {stats.rejectedProcurements ?? 56}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
