import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../components/common/Screen';
import { Card } from '../../../components/common/Card';
import { StatusBadge } from '../../../components/status/StatusBadge';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { farmerApi } from '../../farmerProfile/api/farmerApi';
import { colors, spacing, typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FarmerStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'BookingHistory'>;

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const BookingHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: farmerApi.getBookings,
  });

  const bookings = data?.data || [];

  return (
    <Screen scrollable>
      {isLoading ? (
        <LoadingState message="Loading your bookings..." />
      ) : isError ? (
        <ErrorState message="Could not load bookings" onRetry={refetch} />
      ) : !bookings.length ? (
        <EmptyState
          title="No bookings yet"
          message="Book your first procurement slot to see your history here."
          icon="🗂️"
        />
      ) : (
        <>
          {bookings.map((booking: any) => (
            <Card
              key={booking.id}
              style={styles.card}
              onPress={() => {
                if (booking.centerId && booking.status !== 'COMPLETED') {
                  navigation.navigate('LiveQueue', {
                    centerId: booking.centerId,
                    tokenId: booking.id,
                    tokenNumber: booking.tokenNumber,
                  });
                }
              }}
            >
              <View style={styles.header}>
                <View>
                  <Text style={[typography.h4, styles.token]}>
                    {booking.tokenNumber}
                  </Text>
                  <Text style={[typography.caption]}>
                    {booking.centerName || 'Procurement Center'}
                  </Text>
                </View>
                <StatusBadge status={booking.status} />
              </View>

              <View style={styles.details}>
                <Text style={[typography.caption]}>
                  📅 {formatDate(booking.date || booking.bookedAt)}
                </Text>
                <Text style={[typography.caption]}>
                  ⏱ {booking.startTime ? `${booking.startTime} - ${booking.endTime}` : ''}
                </Text>
              </View>

              {booking.status !== 'COMPLETED' &&
                booking.status !== 'CANCELLED' &&
                booking.status !== 'REJECTED' && (
                  <Pressable
                    style={styles.trackBtn}
                    onPress={() =>
                      navigation.navigate('LiveQueue', {
                        centerId: booking.centerId,
                        tokenId: booking.id,
                        tokenNumber: booking.tokenNumber,
                      })
                    }
                  >
                    <Text style={styles.trackText}>Track →</Text>
                  </Pressable>
                )}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  token: {
    color: colors.primary[700],
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  trackText: {
    color: colors.primary[600],
    fontSize: 14,
    fontWeight: '600',
  },
});
