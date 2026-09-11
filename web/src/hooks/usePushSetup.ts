import { useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { subscribeCurrentUser, unsubscribeCurrentUser, isPushSupported, toSubscriptionJson } from '@/lib/push';
import { pushApi } from '@/lib/api/pushApi';

export function usePushSetup(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !isPushSupported()) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return;

    let cancelled = false;

    const setup = async (): Promise<void> => {
      try {
        const { data } = await apiClient.get<{ data: { vapidPublicKey: string } }>('/push/vapid-key');
        const vapidKey = data.data.vapidPublicKey;
        if (!vapidKey || cancelled) return;

        (window as unknown as { __VAPID_PUBLIC_KEY__?: string }).__VAPID_PUBLIC_KEY__ = vapidKey;

        const existing = await navigator.serviceWorker
          .getRegistration('/sw.js')
          .then((r) => r?.pushManager.getSubscription())
          .catch(() => null);

        const subscription = existing ? toSubscriptionJson(existing) : await subscribeCurrentUser();
        if (!subscription || cancelled) return;

        await pushApi.subscribe(subscription);
      } catch {
        // Push setup is best-effort; never break the app for it.
      }
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}

export function useDisablePush(): () => void {
  return () => {
    void unsubscribeCurrentUser();
  };
}