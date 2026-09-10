import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { farmerApi } from '@/lib/api/farmerApi';
import { formatShortDate } from '@/lib/format';

export const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: farmerApi.getBookings,
  });

  const bookings = data?.data || [];

  const trackBooking = (booking: {
    centerId: string;
    id: string;
    tokenNumber: string;
  }) => {
    navigate(
      `/queue?centerId=${booking.centerId}&tokenId=${booking.id}&tokenNumber=${booking.tokenNumber}`
    );
  };

  return (
    <div>
      <h2 className="mb-5 text-xl font-semibold text-neutral-900">
        Booking History
      </h2>

      {isLoading ? (
        <LoadingState message="Loading your bookings..." />
      ) : isError ? (
        <ErrorState message="Could not load bookings" onRetry={refetch} />
      ) : !bookings.length ? (
        <EmptyState
          title="No bookings yet"
          message="Book your first procurement slot to see your history here."
          icon="🗂️"
        />
      ) : (
        bookings.map((booking) => {
          const trackable =
            booking.centerId &&
            booking.status !== 'COMPLETED' &&
            booking.status !== 'CANCELLED' &&
            booking.status !== 'REJECTED';

          return (
            <Card
              key={booking.id}
              className="mb-4"
              onClick={
                trackable
                  ? () => trackBooking(booking)
                  : undefined
              }
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary-700">
                    {booking.tokenNumber}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {booking.centerName || 'Procurement Center'}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div className="flex justify-between">
                <p className="text-xs text-neutral-500">
                  📅 {formatShortDate(booking.date || booking.bookedAt || '')}
                </p>
                <p className="text-xs text-neutral-500">
                  ⏱{' '}
                  {booking.startTime
                    ? `${booking.startTime} - ${booking.endTime}`
                    : ''}
                </p>
              </div>

              {trackable ? (
                <div className="mt-3 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackBooking(booking);
                    }}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Track →
                  </button>
                </div>
              ) : null}
            </Card>
          );
        })
      )}
    </div>
  );
};