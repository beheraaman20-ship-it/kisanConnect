import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { centersApi } from '@/lib/api/centersApi';

export const CenterDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { centerId } = useParams<{ centerId: string }>();

  const { data: centerData, isLoading, isError, refetch } = useQuery({
    queryKey: ['center', centerId],
    queryFn: () => centersApi.getCenter(centerId ?? ''),
    enabled: !!centerId,
  });

  if (isLoading) {
    return <LoadingState message="Loading center details..." />;
  }

  if (isError || !centerData?.data || !centerId) {
    return (
      <ErrorState message="Could not load center details" onRetry={refetch} />
    );
  }

  const center = centerData.data;

  return (
    <div>
      <Card className="mb-4">
        <h2 className="mb-1 text-2xl font-semibold text-neutral-900">
          {center.name}
        </h2>
        <div className="mb-4">
          {center.status === 'OPEN' ? (
            <span className="text-sm font-bold text-success">● OPEN</span>
          ) : (
            <span className="text-sm font-bold text-error">● CLOSED</span>
          )}
        </div>

        <div className="divide-y divide-neutral-100">
          <div className="flex justify-between py-2">
            <span className="text-sm text-neutral-500">📍 Location</span>
            <span className="text-sm font-medium text-neutral-900">
              {center.location}, {center.district}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-neutral-500">🚜 Daily Capacity</span>
            <span className="text-sm font-medium text-neutral-900">
              {center.dailyCapacity} farmers
            </span>
          </div>
          {center.currentQueueLength != null && (
            <div className="flex justify-between py-2">
              <span className="text-sm text-neutral-500">👥 Current Queue</span>
              <span className="text-sm font-medium text-neutral-900">
                {center.currentQueueLength} farmers
              </span>
            </div>
          )}
          {center.estimatedWaitMinutes != null && (
            <div className="flex justify-between py-2">
              <span className="text-sm text-neutral-500">⏳ Est. Waiting</span>
              <span className="text-sm font-bold text-info">
                {center.estimatedWaitMinutes} minutes
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className="mb-4">
        <Button onClick={() => navigate(`/centers/${centerId}/schedule`)}>
          View Schedule & Book
        </Button>
      </div>

      <Card className="bg-surface">
        <h3 className="mb-2 text-lg font-semibold text-neutral-900">
          What to expect
        </h3>
        <p className="text-sm leading-7 text-neutral-500">
          1. Book a slot online to avoid waiting
          <br />
          2. Receive a digital token immediately
          <br />
          3. Track your queue position in real-time
          <br />
          4. Arrive when your turn approaches
          <br />
          5. Get your produce procured quickly
        </p>
      </Card>
    </div>
  );
};