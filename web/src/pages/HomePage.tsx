import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { centersApi } from '@/lib/api/centersApi';
import { farmerApi } from '@/lib/api/farmerApi';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const { data: centersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['centers'],
    queryFn: centersApi.getCenters,
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: farmerApi.getBookings,
  });

  const activeBooking = bookingsData?.data?.find(
    (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
  );

  return (
    <div>
      {activeBooking && (
        <Card className="mb-5 border-primary-200 bg-primary-50">
          <p className="mb-2 text-xs font-semibold uppercase text-primary-700">
            Active Booking
          </p>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">
                {activeBooking.tokenNumber}
              </h3>
              <p className="text-xs text-neutral-500">
                {activeBooking.centerName || 'Center'}
              </p>
            </div>
            <StatusBadge status={activeBooking.status} />
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(
                `/queue?centerId=${activeBooking.centerId}&tokenId=${activeBooking.id}&tokenNumber=${activeBooking.tokenNumber}`
              )
            }
            className="w-full rounded-lg bg-primary-600 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Track My Queue →
          </button>
        </Card>
      )}

      <h2 className="mb-4 text-lg font-semibold text-neutral-900">
        Nearby Centers
      </h2>

      {isLoading ? (
        <LoadingState message="Loading centers..." />
      ) : isError ? (
        <ErrorState message="Could not load centers" onRetry={refetch} />
      ) : (
        centersData?.data?.map((center) => (
          <Card
            key={center.id}
            className="mb-4"
            onClick={() => navigate(`/centers/${center.id}`)}
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-neutral-900">
                {center.name}
              </h3>
              {center.status === 'OPEN' ? (
                <span className="text-xs font-bold text-success">OPEN</span>
              ) : (
                <span className="text-xs font-bold text-error">CLOSED</span>
              )}
            </div>
            <p className="text-sm text-neutral-500">
              {center.location}, {center.district}
            </p>
            {center.distance != null && (
              <p className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                <MapPin size={12} /> {center.distance.toFixed(1)} km away
              </p>
            )}
            {center.estimatedWaitMinutes != null && (
              <p className="mt-1 text-xs text-info">
                ⏳ Est. wait: {center.estimatedWaitMinutes} min · Queue:{' '}
                {center.currentQueueLength ?? 0}
              </p>
            )}
          </Card>
        ))
      )}

      <div className="mt-4 text-center">
        <Link
          to="/bookings"
          className="text-base font-medium text-primary-600 hover:text-primary-700"
        >
          View Booking History →
        </Link>
      </div>
    </div>
  );
};