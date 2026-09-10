import React from 'react';

interface OfflineBannerProps {
  visible: boolean;
  reconnecting?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  visible,
  reconnecting = false,
}) => {
  if (!visible) return null;

  return (
    <div className="mb-4 rounded-lg bg-warning px-4 py-2 text-center">
      <p className="text-xs font-semibold text-white">
        {reconnecting
          ? 'Reconnecting...'
          : 'You are offline. Data may be outdated.'}
      </p>
    </div>
  );
};