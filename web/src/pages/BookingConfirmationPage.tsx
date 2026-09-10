import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { bookingApi } from '@/lib/api/bookingApi';
import { formatDateTime } from '@/lib/format';

export const BookingConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const { centerId } = useParams<{ centerId: string }>();
  const [searchParams] = useSearchParams();
  const tokenId = searchParams.get('tokenId');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['token', tokenId],
    queryFn: () => bookingApi.getToken(tokenId ?? ''),
    enabled: !!tokenId,
  });

  if (isLoading) {
    return <LoadingState message="Loading your booking..." />;
  }

  if (isError || !data?.data || !centerId || !tokenId) {
    return <ErrorState message="Could not load booking details" onRetry={refetch} />;
  }

  const token = data.data;

  return (
    <div className="flex flex-col items-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success">
        <span className="text-4xl font-bold text-white">✓</span>
      </div>

      <h2 className="mb-1 text-2xl font-semibold text-neutral-900">
        Booking Confirmed!
      </h2>
      <p className="mb-6 text-sm text-neutral-500">
        Your procurement slot has been booked successfully
      </p>

      <div className="mb-6 w-full rounded-2xl border-2 border-dashed border-primary-600 bg-primary-50 p-6">
        <p className="mb-2 text-center text-xs font-medium text-primary-700">
          Your Digital Token
        </p>
        <p className="mb-4 text-center text-5xl font-bold text-primary-700">
          {token.tokenNumber}
        </p>

        <div className="mb-4 h-px bg-primary-200" />

        <div className="divide-y divide-primary-100">
          <div className="flex justify-between py-1.5">
            <span className="text-sm text-neutral-500">Status</span>
            <span className="text-sm font-semibold text-warning">WAITING</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-sm text-neutral-500">Queue Position</span>
            <span className="text-sm font-semibold text-warning">
              {token.queuePosition}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-sm text-neutral-500">Est. Wait</span>
            <span className="text-sm font-semibold text-info">
              {token.estimatedWaitTime} min
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-sm text-neutral-500">Booked At</span>
            <span className="text-sm font-semibold text-neutral-900">
              {formatDateTime(token.bookedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full">
        <Button
          onClick={() =>
            navigate(
              `/queue?centerId=${centerId}&tokenId=${token.id}&tokenNumber=${token.tokenNumber}`
            )
          }
        >
          Track My Queue Live
        </Button>
        <div className="h-3" />
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};