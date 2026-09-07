import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../components/common/Screen';
import { Card } from '../../../components/common/Card';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { Button } from '../../../components/common/Button';
import { centersApi } from '../api/centersApi';
import { colors, spacing, typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FarmerStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'CenterDetails'>;

export const CenterDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { centerId } = route.params;

  const {
    data: centerData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['center', centerId],
    queryFn: () => centersApi.getCenter(centerId),
  });

  if (isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading center details..." />
      </Screen>
    );
  }

  if (isError || !centerData?.data) {
    return (
      <Screen>
        <ErrorState message="Could not load center details" onRetry={refetch} />
      </Screen>
    );
  }

  const center = centerData.data;

  return (
    <Screen scrollable>
      <Card style={styles.infoCard}>
        <Text style={[typography.h2, styles.name]}>{center.name}</Text>
        <View style={styles.statusRow}>
          {center.status === 'OPEN' ? (
            <Text style={styles.openBadge}>● OPEN</Text>
          ) : (
            <Text style={styles.closedBadge}>● CLOSED</Text>
          )}
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Location</Text>
          <Text style={styles.detailValue}>
            {center.location}, {center.district}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📊 Daily Capacity</Text>
          <Text style={styles.detailValue}>{center.dailyCapacity} farmers</Text>
        </View>
        {center.currentQueueLength != null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👥 Current Queue</Text>
            <Text style={styles.detailValue}>{center.currentQueueLength} farmers</Text>
          </View>
        )}
        {center.estimatedWaitMinutes != null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏱ Est. Waiting</Text>
            <Text style={[styles.detailValue, styles.waitValue]}>
              {center.estimatedWaitMinutes} minutes
            </Text>
          </View>
        )}
      </Card>

      <View style={styles.actions}>
        <Button
          title="View Schedule & Book"
          onPress={() =>
            navigation.navigate('Schedule', { centerId: center.id })
          }
        />
      </View>

      <Card style={styles.tipsCard}>
        <Text style={[typography.h4, styles.tipsTitle]}>What to expect</Text>
        <Text style={[typography.bodySmall, styles.tipText]}>
          1. Book a slot online to avoid waiting{'\n'}
          2. Receive a digital token immediately{'\n'}
          3. Track your queue position in real-time{'\n'}
          4. Arrive when your turn approaches{'\n'}
          5. Get your produce procured quickly
        </Text>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    marginBottom: spacing.lg,
  },
  name: {
    marginBottom: spacing.sm,
  },
  statusRow: {
    marginBottom: spacing.lg,
  },
  openBadge: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 14,
  },
  closedBadge: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  waitValue: {
    color: colors.info,
    fontWeight: '700',
  },
  actions: {
    marginBottom: spacing.xl,
  },
  tipsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  tipsTitle: {
    marginBottom: spacing.md,
  },
  tipText: {
    lineHeight: 26,
  },
});
