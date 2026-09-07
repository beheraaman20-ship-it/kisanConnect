import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../components/common/Screen';
import { Card } from '../../../components/common/Card';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { apiClient } from '../../../core/network/apiClient';
import { colors, spacing, typography } from '../../../theme';

const getNotifications = async () => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

export const NotificationsScreen: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const notifications = data?.data || [];

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = Date.now();
    const diff = now - d.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const iconForType = (type: string) => {
    switch (type) {
      case 'BOOKING_CONFIRMED': return '📌';
      case 'TOKEN_GENERATED': return '🎟️';
      case 'QUEUE_APPROACHING': return '🔔';
      case 'VERIFICATION_STARTED': return '👤';
      case 'INSPECTION_STARTED': return '🔎';
      case 'PROCUREMENT_COMPLETED': return '✅';
      case 'CANCELLATION': return '❌';
      case 'RESCHEDULED': return '🔄';
      default: return '📢';
    }
  };

  return (
    <Screen>
      {isLoading ? (
        <LoadingState message="Loading notifications..." />
      ) : isError ? (
        <ErrorState message="Could not load notifications" onRetry={refetch} />
      ) : !notifications.length ? (
        <EmptyState
          title="No notifications"
          message="You'll see updates about your bookings here."
          icon="🔕"
        />
      ) : (
        <View style={styles.list}>
          {notifications.map((notification: any, index: number) => (
            <Card
              key={notification.id || index}
              style={{
                ...styles.notificationCard,
                ...(!notification.readAt ? styles.unread : {}),
              }}
            >
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>
                  {iconForType(notification.type)}
                </Text>
              </View>
              <View style={styles.content}>
                <Text style={[typography.body, styles.notifTitle]}>
                  {notification.title}
                </Text>
                <Text style={[typography.bodySmall, styles.notifMessage]}>
                  {notification.message}
                </Text>
                <Text style={[typography.caption, styles.time]}>
                  {formatTime(notification.createdAt)}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
  },
  unread: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  iconWrap: {
    marginRight: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  notifTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  notifMessage: {
    marginBottom: spacing.sm,
  },
  time: {
    color: colors.neutral[400],
  },
});
