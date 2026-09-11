import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { centersApi } from '@/lib/api/centersApi';
import { formatTime, formatLongDate, formatShortDate } from '@/lib/format';
import type { Slot } from '@/lib/types';

function groupByDate(slots: Slot[]): Record<string, Slot[]> {
  const grouped: Record<string, Slot[]> = {};
  for (const slot of slots) {
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(slot);
  }
  return grouped;
}

export const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { centerId } = useParams<{ centerId: string }>();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { data: scheduleData, isLoading, isError, refetch } = useQuery({
    queryKey: ['schedule', centerId],
    queryFn: () => centersApi.getSchedule(centerId ?? ''),
    enabled: !!centerId,
    refetchInterval: 30_000,
  });

  const slots = scheduleData?.data ?? [];
  const grouped = groupByDate(slots);
  const dates = Object.keys(grouped).sort();

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-neutral-900">
        Available Slots
      </h2>
      <p className="mb-5 text-sm text-neutral-500">
        {formatLongDate(now.toISOString())} — Select a time slot to book
      </p>

      {isLoading ? (
        <LoadingState message="Loading schedule..." />
      ) : isError || !centerId ? (
        <ErrorState message="Could not load schedule" onRetry={refetch} />
      ) : !slots.length ? (
        <EmptyState
          title="No slots available"
          message="No slots are currently available for this center. Please check back later."
          icon="🗓️"
        />
      ) : (
        dates.map((date) => (
          <div key={date} className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {formatShortDate(date)}
            </h3>
            {grouped[date].map((slot) => {
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
            })}
          </div>
        ))
      )}
    </div>
  );
};