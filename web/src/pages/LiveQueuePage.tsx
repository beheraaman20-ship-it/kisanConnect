import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QueueStatusCard } from '@/components/ui/QueueStatusCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { bookingApi } from '@/lib/api/bookingApi';
import { useLiveQueue } from '@/hooks/useLiveQueue';
import { TokenStatus } from '@/lib/types';

const ProgressStep: React.FC<{ number: string; label: string }> = ({
  number,
  label,
}) => (
  <div className="flex flex-col items-center opacity-50">
    <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-base font-bold text-white">
      {number}
    </span>
    <span className="text-xs text-neutral-500">{label}</span>
  </div>
);

export const LiveQueuePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const centerId = searchParams.get('centerId') ?? undefined;
  const tokenId = searchParams.get('tokenId') ?? '';
  const tokenNumber = searchParams.get('tokenNumber') ?? '';

  const { data: tokenData, isLoading, isError, refetch } = useQuery({
    queryKey: ['token', tokenId],
    queryFn: () => bookingApi.getToken(tokenId),
    enabled: !!tokenId,
    refetchInterval: 15000,
  });

  const { queueData, isConnected, isReconnecting } = useLiveQueue(centerId);

  const displayQueue = queueData ?? {
    currentToken: tokenData?.data?.currentToken ?? null,
    position: tokenData?.data?.queuePosition,
    estimatedWaitMinutes: tokenData?.data?.estimatedWaitTime,
  };

  const token = tokenData?.data;

  if (isLoading) {
    return <LoadingState message="Loading queue information..." />;
  }

  if (isError || !token) {
    return (
      <ErrorState message="Could not load your queue status" onRetry={refetch} />
    );
  }

  return (
    <div>
      <OfflineBanner visible={!isConnected} reconnecting={isReconnecting} />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">Live Queue</h2>
        <StatusBadge status={token.status} />
      </div>

      {token.status === TokenStatus.COMPLETED ? (
        <Card className="border-success bg-green-50 p-6 text-center">
          <span className="mb-3 block text-5xl">🎉</span>
          <h3 className="mb-2 text-xl font-semibold text-neutral-900">
            Procurement Completed!
          </h3>
          <p className="text-sm leading-6 text-neutral-500">
            Your produce has been procured successfully. Thank you for using
            KisanConnect.
          </p>
        </Card>
      ) : token.status === TokenStatus.REJECTED ? (
        <Card className="border-error bg-red-50 p-6 text-center">
          <span className="mb-3 block text-5xl">❌</span>
          <h3 className="mb-2 text-xl font-semibold text-neutral-900">
            Procurement Rejected
          </h3>
          <p className="text-sm leading-6 text-neutral-500">
            Your procurement was rejected. Please contact the center for more
            information.
          </p>
        </Card>
      ) : (
        <QueueStatusCard
          queue={displayQueue}
          token={token.tokenNumber || tokenNumber}
        />
      )}

      {token.status === TokenStatus.WAITING && (
        <Card className="mt-5">
          <p className="mb-3 text-xs font-medium uppercase text-neutral-500">
            What happens next?
          </p>
          <div className="mb-3 flex justify-around">
            <ProgressStep number="1" label="Verification" />
            <ProgressStep number="2" label="Inspection" />
            <ProgressStep number="3" label="Procurement" />
          </div>
          <p className="text-center text-xs text-neutral-500">
            Stay near the center. We'll notify you when your turn approaches.
          </p>
        </Card>
      )}

      {token.status === TokenStatus.VERIFICATION && (
        <Card className="mt-5 border-secondary-300 bg-secondary-50">
          <p className="mb-1 text-base font-semibold text-secondary-900">
            🔍 Verification in progress
          </p>
          <p className="text-xs text-neutral-500">
            Please present your token to the center staff for verification.
          </p>
        </Card>
      )}

      {token.status === TokenStatus.INSPECTION && (
        <Card className="mt-5 border-secondary-300 bg-secondary-50">
          <p className="mb-1 text-base font-semibold text-secondary-900">
            🔎 Produce inspection in progress
          </p>
          <p className="text-xs text-neutral-500">
            Your produce is being inspected by center staff.
          </p>
        </Card>
      )}

      {token.status === TokenStatus.PROCUREMENT && (
        <Card className="mt-5 border-secondary-300 bg-secondary-50">
          <p className="mb-1 text-base font-semibold text-secondary-900">
            ⚖️ Procurement in progress
          </p>
          <p className="text-xs text-neutral-500">
            Your produce is being weighed and recorded. Almost done!
          </p>
        </Card>
      )}
    </div>
  );
};