import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      {message ? (
        <p className="mt-4 text-sm text-neutral-500">{message}</p>
      ) : null}
    </div>
  );
};