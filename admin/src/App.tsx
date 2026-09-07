import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CentersPage } from './pages/centers/CentersPage';
import { SchedulesPage } from './pages/schedules/SchedulesPage';
import { FarmersPage } from './pages/farmers/FarmersPage';
import { TokensPage } from './pages/tokens/TokensPage';
import { ProcurementsPage } from './pages/procurements/ProcurementsPage';
import { ReportsPage } from './pages/reports/ReportsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="centers" element={<CentersPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="farmers" element={<FarmersPage />} />
        <Route path="tokens" element={<TokensPage />} />
        <Route path="procurements" element={<ProcurementsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
