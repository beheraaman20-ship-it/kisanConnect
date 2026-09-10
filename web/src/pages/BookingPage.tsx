import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { centersApi } from '@/lib/api/centersApi';
import { bookingApi } from '@/lib/api/bookingApi';
import { formatTime, formatLongDate } from '@/lib/format';

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { centerId } = useParams<{ centerId: string }>();
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get('slotId');
  const [bookingError, setBookingError] = useState<string | null>(null);

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['schedule', centerId],
    queryFn: () => centersApi.getSchedule(centerId ?? ''),
    enabled: !!centerId,
  });

  const slot = scheduleData?.data?.find((s) => s.id === slotId);

  const bookMutation = useMutation({
    mutationFn: () => bookingApi.bookSlot(slotId ?? ''),
    onSuccess: (response) => {
      const token = response.data;
      navigate(`/centers/${centerId}/book/confirmation?tokenId=${token.id}`);
    },
    onError: (error) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Booking failed. Please try again.';
      setBookingError(message);
    },
  });

  const handleBook = () => {
    if (!slot) return;
    setBookingError(null);
    const confirmed = window.confirm(
      `Do you want to book this slot?\n\n${formatTime(slot.startTime)} - ${formatTime(
        slot.endTime
      )}`
    );
    if (confirmed) {
      bookMutation.mutate();
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading slot details..." />;
  }

  if (!slot) {
    return (
      <ErrorState
        message="Could not find this slot. It may no longer be available."
        onRetry={() => navigate(`/centers/${centerId}/schedule`)}
      />
    );
  }

  return (
    <div>
      <h2 className="mb-5 text-xl font-semibold text-neutral-900">
        Confirm Your Booking
      </h2>

      <Card className="mb-5">
        <p className="mb-3 text-xs font-medium uppercase text-neutral-500">
          Slot Details
        </p>
        <div className="divide-y divide-neutral-100">
          <div className="flex justify-between py-2">
            <span className="text-sm text-neutral-500">📅 Date</span>
            <span className="text-sm font-medium text-neutral-900">
              {formatLongDate(slot.date)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-neutral-500">🕐 Time</span>
            <span className="text-sm font-medium text-neutral-900">
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-neutral-500">🎫 Slots Available</span>
            <span
              className={`text-sm font-medium ${
                slot.availableSlots <= 5 ? 'font-bold text-warning' : ''
              }`}
            >
              {slot.availableSlots}
            </span>
          </div>
        </div>
      </Card>

      {bookingError ? (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-error">
          {bookingError}
        </div>
      ) : null}

      <Button onClick={handleBook} loading={bookMutation.isPending}>
        {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
      </Button>

      <p className="mt-5 text-center text-xs leading-5 text-neutral-500">
        Once booked, you will receive a digital token and can track your queue
        position in real-time.
      </p>
    </div>
  );
};