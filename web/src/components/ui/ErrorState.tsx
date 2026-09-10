import React from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <span className="mb-4 text-5xl">⚠️</span>
      <h3 className="mb-2 text-lg font-semibold text-neutral-900">Error</h3>
      <p className="mb-6 text-sm text-neutral-500">{message}</p>
      {onRetry ? (
        <div className="w-full max-w-xs">
          <Button onClick={onRetry}>Retry</Button>
        </div>
      ) : null}
    </div>
  );
};