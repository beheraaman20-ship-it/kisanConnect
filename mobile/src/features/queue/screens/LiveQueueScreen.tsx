import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../components/common/Screen';
import { Card } from '../../../components/common/Card';
import { StatusBadge } from '../../../components/status/StatusBadge';
import { QueueStatusCard } from '../../../components/status/QueueStatusCard';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { OfflineBanner } from '../../../components/feedback/OfflineBanner';
import { bookingApi } from '../../booking/api/bookingApi';
import { useLiveQueue } from '../hooks/useLiveQueue';
import { TokenStatus } from '../../../core/types';
import { colors, spacing, typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FarmerStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'LiveQueue'>;

export const LiveQueueScreen: React.FC<Props> = ({ route }) => {
  const { centerId, tokenId, tokenNumber } = route.params;

  const { data: tokenData, isLoading, isError, refetch } = useQuery({
    queryKey: ['token', tokenId],
    queryFn: () => bookingApi.getToken(tokenId),
    refetchInterval: 15000,
  });

  const { queueData, isConnected, isReconnecting } = useLiveQueue(centerId);

  const displayQueue = queueData ?? {
    currentToken: null as any,
    position: tokenData?.data?.queuePosition,
    estimatedWaitMinutes: tokenData?.data?.estimatedWaitTime,
  };

  const token = tokenData?.data;

  if (isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading queue information..." />
      </Screen>
    );
  }

  if (isError || !token) {
    return (
      <Screen>
        <ErrorState message="Could not load your queue status" onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <OfflineBanner
        visible={!isConnected}
        reconnecting={isReconnecting}
      />
      <View style={styles.container}>
        <View style={styles.statusRow}>
          <Text style={[typography.h3, styles.title]}>Live Queue</Text>
          <StatusBadge status={token.status} />
        </View>

        {token.status === TokenStatus.COMPLETED ? (
          <Card style={styles.completedCard}>
            <Text style={styles.completedIcon}>🎉</Text>
            <Text style={[typography.h3, styles.completedTitle]}>
              Procurement Completed!
            </Text>
            <Text style={[typography.bodySmall, styles.completedText]}>
              Your produce has been procured successfully. Thank you for using
              KisanConnect.
            </Text>
          </Card>
        ) : token.status === TokenStatus.REJECTED ? (
          <Card style={{ ...styles.completedCard, ...styles.rejectedCard }}>
            <Text style={styles.completedIcon}>❌</Text>
            <Text style={[typography.h3, styles.completedTitle]}>
              Procurement Rejected
            </Text>
            <Text style={[typography.bodySmall, styles.completedText]}>
              Your procurement was rejected. Please contact the center for more
              information.
            </Text>
          </Card>
        ) : (
          <QueueStatusCard
            queue={displayQueue}
            token={token.tokenNumber || tokenNumber}
          />
        )}

        {token.status === TokenStatus.WAITING && (
          <Card style={styles.progressCard}>
            <Text style={[typography.caption, styles.progressLabel]}>
              What happens next?
            </Text>
            <View style={styles.steps}>
              <ProgressStep number="1" label="Verification" active={false} />
              <ProgressStep number="2" label="Inspection" active={false} />
              <ProgressStep number="3" label="Procurement" active={false} />
            </View>
            <Text style={[typography.caption, styles.hint]}>
              Stay near the center. We'll notify you when your turn approaches.
            </Text>
          </Card>
        )}

        {token.status === TokenStatus.VERIFICATION && (
          <Card style={styles.currentStepCard}>
            <Text style={styles.currentStepTitle}>
              🔍 Verification in progress
            </Text>
            <Text style={[typography.caption, styles.hint]}>
              Please present your token to the center staff for verification.
            </Text>
          </Card>
        )}

        {token.status === TokenStatus.INSPECTION && (
          <Card style={styles.currentStepCard}>
            <Text style={styles.currentStepTitle}>
              🔎 Produce inspection in progress
            </Text>
            <Text style={[typography.caption, styles.hint]}>
              Your produce is being inspected by center staff.
            </Text>
          </Card>
        )}

        {token.status === TokenStatus.PROCUREMENT && (
          <Card style={styles.currentStepCard}>
            <Text style={styles.currentStepTitle}>
              ⚖️ Procurement in progress
            </Text>
            <Text style={[typography.caption, styles.hint]}>
              Your produce is being weighed and recorded. Almost done!
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
};

const ProgressStep: React.FC<{
  number: string;
  label: string;
  active: boolean;
}> = ({ number, label, active }) => (
  <View style={[styles.step, active && styles.stepActive]}>
    <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
      <Text style={styles.stepNumber}>{number}</Text>
    </View>
    <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
  },
  completedCard: {
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    borderColor: colors.success,
    padding: spacing.xxl,
  },
  rejectedCard: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error,
  },
  completedIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  completedTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  completedText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  progressCard: {
    marginTop: spacing.xl,
  },
  progressLabel: {
    marginBottom: spacing.lg,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  step: {
    alignItems: 'center',
    opacity: 0.5,
  },
  stepActive: {
    opacity: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stepCircleActive: {
    backgroundColor: colors.primary[600],
  },
  stepNumber: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  stepLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  stepLabelActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  currentStepCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[300],
  },
  currentStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary[800],
    marginBottom: spacing.xs,
  },
});
