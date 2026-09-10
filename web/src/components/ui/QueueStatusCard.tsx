import React from 'react';

interface QueueStatusCardProps {
  queue: {
    currentToken?: string | null;
    position?: number;
    estimatedWaitMinutes?: number;
  } | null;
  token: string;
}

export const QueueStatusCard: React.FC<QueueStatusCardProps> = ({
  queue,
  token,
}) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-md">
      <div className="grid grid-cols-2 gap-y-6">
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
            Your Token
          </span>
          <span className="text-4xl font-bold text-primary-600">{token}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
            Current Token
          </span>
          <span className="text-4xl font-bold text-neutral-600">
            {queue?.currentToken || '---'}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
            Position
          </span>
          <span className="text-4xl font-bold text-warning">
            {queue?.position ?? '---'}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
            Est. Wait
          </span>
          <span className="text-3xl font-bold text-info">
            {queue?.estimatedWaitMinutes != null
              ? `${queue.estimatedWaitMinutes} min`
              : '---'}
          </span>
        </div>
      </div>
    </div>
  );
};