import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { notificationApi } from '@/lib/api/notificationApi';
import { formatRelativeTime } from '@/lib/format';

const iconForType = (type: string): string => {
  switch (type) {
    case 'BOOKING_CONFIRMED':
      return '✅';
    case 'TOKEN_GENERATED':
      return '🎟️';
    case 'QUEUE_APPROACHING':
      return '📢';
    case 'VERIFICATION_STARTED':
      return '🔍';
    case 'INSPECTION_STARTED':
      return '🔎';
    case 'PROCUREMENT_COMPLETED':
      return '🎉';
    case 'CANCELLATION':
      return '❌';
    case 'RESCHEDULED':
      return '📅';
    default:
      return '🔔';
  }
};

const getApiError = (error: unknown) =>
  (error as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data?.error?.message;

export const NotificationsPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
  });

  const notifications = data?.data || [];

  return (
    <div>
      <h2 className="mb-5 text-xl font-semibold text-neutral-900">
        Notifications
      </h2>

      {isLoading ? (
        <LoadingState message="Loading notifications..." />
      ) : isError ? (
        <ErrorState
          message={getApiError(error) || 'Could not load notifications'}
          onRetry={refetch}
        />
      ) : !notifications.length ? (
        <EmptyState
          title="No notifications"
          message="You'll see updates about your bookings here."
          icon="🔕"
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: any, index: number) => (
            <Card
              key={notification.id || index}
              className={
                notification.readAt
                  ? 'flex items-start'
                  : 'flex items-start border-primary-300 bg-primary-50'
              }
            >
              <span className="mr-4 flex items-center justify-center text-3xl">
                {iconForType(notification.type)}
              </span>
              <div className="flex-1">
                <h3 className="mb-1 text-base font-semibold text-neutral-900">
                  {notification.title}
                </h3>
                <p className="mb-2 text-sm text-neutral-500">
                  {notification.message}
                </p>
                <p className="text-xs text-neutral-400">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};