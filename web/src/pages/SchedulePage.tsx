import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { centersApi } from '@/lib/api/centersApi';
import { formatTime, formatLongDate } from '@/lib/format';

export const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { centerId } = useParams<{ centerId: string }>();

  const { data: scheduleData, isLoading, isError, refetch } = useQuery({
    queryKey: ['schedule', centerId],
    queryFn: () => centersApi.getSchedule(centerId ?? ''),
    enabled: !!centerId,
  });

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-neutral-900">
        Available Slots
      </h2>
      <p className="mb-5 text-sm text-neutral-500">
        {formatLongDate(new Date().toISOString())} — Select a time slot to book
      </p>

      {isLoading ? (
        <LoadingState message="Loading schedule..." />
      ) : isError || !centerId ? (
        <ErrorState message="Could not load schedule" onRetry={refetch} />
      ) : !scheduleData?.data?.length ? (
        <EmptyState
          title="No slots available"
          message="No slots are currently available for this center. Please check back later."
          icon="🗓️"
        />
      ) : (
        scheduleData.data.map((slot) => {
          const full = slot.availableSlots <= 0;

          return (
            <Card key={slot.id} className="mb-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-primary-700">
                    {formatTime(slot.startTime)}
                  </p>
                  <p className="text-sm text-neutral-500">
                    to {formatTime(slot.endTime)}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    full ? 'text-error' : 'text-success'
                  }`}
                >
                  {full ? 'Full' : `${slot.availableSlots} slots left`}
                </span>
              </div>
              <button
                type="button"
                disabled={full || slot.status !== 'OPEN'}
                onClick={() =>
                  navigate(
                    `/centers/${centerId}/book?slotId=${slot.id}`
                  )
                }
                className={[
                  'w-full rounded-lg py-3 text-center text-base font-semibold transition-colors',
                  full || slot.status !== 'OPEN'
                    ? 'cursor-not-allowed bg-neutral-200 text-neutral-400'
                    : 'bg-primary-600 text-white hover:bg-primary-700',
                ].join(' ')}
              >
                {full ? 'Slot Full' : 'Book This Slot'}
              </button>
            </Card>
          );
        })
      )}
    </div>
  );
};