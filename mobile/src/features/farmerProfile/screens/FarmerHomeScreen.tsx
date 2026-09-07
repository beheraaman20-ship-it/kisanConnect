import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../components/common/Screen';
import { Card } from '../../../components/common/Card';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { StatusBadge } from '../../../components/status/StatusBadge';
import { centersApi } from '../../centers/api/centersApi';
import { farmerApi } from '../api/farmerApi';
import { useAuth } from '../../auth/hooks/useAuth';
import { colors, spacing, typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FarmerStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'Home'>;

export const FarmerHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const { data: centersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['centers'],
    queryFn: centersApi.getCenters,
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: farmerApi.getBookings,
  });

  const activeBooking = bookingsData?.data?.find(
    (b: any) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
  );

  const firstName = user?.name?.split(' ')[0] || 'Farmer';

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <View>
          <Text style={[typography.h1, styles.greeting]}>
            Namaste, {firstName} 🙏
          </Text>
          <Text style={[typography.bodySmall, styles.subGreeting]}>
            Manage your procurement easily
          </Text>
        </View>
        <Pressable onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {activeBooking && (
        <Card style={styles.activeBooking}>
          <Text style={[typography.caption, styles.sectionLabel]}>
            Active Booking
          </Text>
          <View style={styles.bookingRow}>
            <View>
              <Text style={[typography.h3]}>{activeBooking.tokenNumber}</Text>
              <Text style={[typography.caption]}>
                {activeBooking.centerName || 'Center'}
              </Text>
            </View>
            <StatusBadge status={activeBooking.status} />
          </View>
          <Pressable
            onPress={() =>
              navigation.navigate('LiveQueue', {
                centerId: activeBooking.centerId,
                tokenId: activeBooking.id,
                tokenNumber: activeBooking.tokenNumber,
              })
            }
            style={styles.trackBtn}
          >
            <Text style={styles.trackBtnText}>Track My Queue →</Text>
          </Pressable>
        </Card>
      )}

      <Text style={[typography.h4, styles.sectionTitle]}>Nearby Centers</Text>

      {isLoading ? (
        <LoadingState message="Loading centers..." />
      ) : isError ? (
        <ErrorState message="Could not load centers" onRetry={refetch} />
      ) : (
        centersData?.data?.map((center) => (
          <Card
            key={center.id}
            style={styles.centerCard}
            onPress={() =>
              navigation.navigate('CenterDetails', { centerId: center.id })
            }
          >
            <View style={styles.centerHeader}>
              <Text style={[typography.h4, styles.centerName]}>
                {center.name}
              </Text>
              {center.status === 'OPEN' ? (
                <Text style={styles.openBadge}>OPEN</Text>
              ) : (
                <Text style={styles.closedBadge}>CLOSED</Text>
              )}
            </View>
            <Text style={[typography.bodySmall]}>
              {center.location}, {center.district}
            </Text>
            {center.distance != null && (
              <Text style={[typography.caption, styles.distance]}>
                📍 {center.distance.toFixed(1)} km away
              </Text>
            )}
            {center.estimatedWaitMinutes != null && (
              <Text style={[typography.caption, styles.wait]}>
                ⏱ Est. wait: {center.estimatedWaitMinutes} min · Queue:{' '}
                {center.currentQueueLength ?? 0}
              </Text>
            )}
          </Card>
        ))
      )}

      <Pressable
        onPress={() => navigation.navigate('BookingHistory')}
        style={styles.historyLink}
      >
        <Text style={styles.historyLinkText}>View Booking History →</Text>
      </Pressable>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: 24,
  },
  subGreeting: {
    marginTop: spacing.xs,
  },
  logoutBtn: {
    padding: spacing.sm,
  },
  logoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  activeBooking: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.primary[700],
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trackBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  trackBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    marginBottom: spacing.lg,
  },
  centerCard: {
    marginBottom: spacing.lg,
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  centerName: {
    flex: 1,
    marginRight: spacing.sm,
  },
  openBadge: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  closedBadge: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  distance: {
    marginTop: spacing.sm,
  },
  wait: {
    marginTop: spacing.xs,
    color: colors.info,
  },
  historyLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  historyLinkText: {
    color: colors.primary[600],
    fontSize: 16,
    fontWeight: '500',
  },
});
