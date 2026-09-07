import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../components/common/Screen';
import { Card } from '../../../components/common/Card';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { centersApi } from '../api/centersApi';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FarmerStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'Schedule'>;

export const ScheduleScreen: React.FC<Props> = ({ navigation, route }) => {
  const { centerId } = route.params;
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const {
    data: scheduleData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['schedule', centerId, selectedDate],
    queryFn: () => centersApi.getSchedule(centerId),
  });

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const isSlotFull = (available: number) => available <= 0;

  return (
    <Screen scrollable>
      <Text style={[typography.h3, styles.title]}>Available Slots</Text>
      <Text style={[typography.bodySmall, styles.subtitle]}>
        Select a time slot to book
      </Text>

      {isLoading ? (
        <LoadingState message="Loading schedule..." />
      ) : isError ? (
        <ErrorState message="Could not load schedule" onRetry={refetch} />
      ) : !scheduleData?.data?.length ? (
        <EmptyState
          title="No slots available"
          message="No slots are currently available for this center. Please check back later."
          icon="📅"
        />
      ) : (
        scheduleData.data.map((slot) => {
          const full = isSlotFull(slot.availableSlots);

          return (
            <Card key={slot.id} style={styles.slotCard}>
              <View style={styles.slotRow}>
                <View style={styles.timeBlock}>
                  <Text style={styles.time}>
                    {formatTime(slot.startTime)}
                  </Text>
                  <Text style={styles.timeEnd}>
                    to {formatTime(slot.endTime)}
                  </Text>
                </View>
                <View style={styles.availability}>
                  <Text
                    style={[
                      styles.availableText,
                      full ? styles.fullText : null,
                    ]}
                  >
                    {full
                      ? 'Full'
                      : `${slot.availableSlots} slots left`}
                  </Text>
                </View>
              </View>
              <Pressable
                style={[
                  styles.bookBtn,
                  (full || slot.status !== 'OPEN') && styles.bookBtnDisabled,
                ]}
                disabled={full || slot.status !== 'OPEN'}
                onPress={() =>
                  navigation.navigate('Booking', {
                    centerId,
                    slot,
                  })
                }
              >
                <Text
                  style={[
                    styles.bookBtnText,
                    (full || slot.status !== 'OPEN') &&
                      styles.bookBtnTextDisabled,
                  ]}
                >
                  {full ? 'Slot Full' : 'Book This Slot'}
                </Text>
              </Pressable>
            </Card>
          );
        })
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  slotCard: {
    marginBottom: spacing.lg,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timeBlock: {
    flex: 1,
  },
  time: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[700],
  },
  timeEnd: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  availability: {
    alignItems: 'flex-end',
  },
  availableText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  fullText: {
    color: colors.error,
  },
  bookBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bookBtnDisabled: {
    backgroundColor: colors.neutral[200],
  },
  bookBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bookBtnTextDisabled: {
    color: colors.neutral[400],
  },
});
