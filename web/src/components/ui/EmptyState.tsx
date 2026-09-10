import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing here yet',
  message = 'No data available.',
  icon = '📭',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <span className="mb-4 text-5xl">{icon}</span>
      <h3 className="mb-2 text-base font-semibold text-neutral-900">
        {title}
      </h3>
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  );
};