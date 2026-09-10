import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { ProtectedRoute, GuestRoute } from '@/components/layout/RouteGuards';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/pages/auth/LoginPage';
import { OtpPage } from '@/pages/auth/OtpPage';
import { HomePage } from '@/pages/HomePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { CenterDetailsPage } from '@/pages/CenterDetailsPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { BookingPage } from '@/pages/BookingPage';
import { BookingConfirmationPage } from '@/pages/BookingConfirmationPage';
import { LiveQueuePage } from '@/pages/LiveQueuePage';
import { BookingHistoryPage } from '@/pages/BookingHistoryPage';
import { NotificationsPage } from '@/pages/NotificationsPage';

const AppBootstrap: React.FC = () => {
  const { loadUser } = useAuth();

  React.useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OtpPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/centers/:centerId" element={<CenterDetailsPage />} />
          <Route path="/centers/:centerId/schedule" element={<SchedulePage />} />
          <Route path="/centers/:centerId/book" element={<BookingPage />} />
          <Route
            path="/centers/:centerId/book/confirmation"
            element={<BookingConfirmationPage />}
          />
          <Route path="/bookings" element={<BookingHistoryPage />} />
          <Route path="/queue" element={<LiveQueuePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <QueryProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppBootstrap />
      </BrowserRouter>
    </QueryProvider>
  );
};