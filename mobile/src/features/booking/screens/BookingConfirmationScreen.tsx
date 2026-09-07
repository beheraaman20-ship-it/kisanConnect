import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/common/Screen';
import { Button } from '../../../components/common/Button';
import { colors, spacing, typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FarmerStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'BookingConfirmation'>;

export const BookingConfirmationScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { token, centerId } = route.params;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={[typography.h2, styles.title]}>Booking Confirmed!</Text>
        <Text style={[typography.bodySmall, styles.subtitle]}>
          Your procurement slot has been booked successfully
        </Text>

        <View style={styles.tokenCard}>
          <Text style={[typography.caption, styles.tokenLabel]}>
            Your Digital Token
          </Text>
          <Text style={styles.tokenNumber}>{token.tokenNumber}</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, styles.waitingText]}>WAITING</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Queue Position</Text>
            <Text style={[styles.detailValue, styles.positionText]}>
              {token.queuePosition}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Est. Wait</Text>
            <Text style={[styles.detailValue, styles.waitTimeText]}>
              {token.estimatedWaitTime} min
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booked At</Text>
            <Text style={styles.detailValue}>
              {formatDate(token.bookedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Track My Queue Live"
            onPress={() =>
              navigation.replace('LiveQueue', {
                centerId,
                tokenId: token.id,
                tokenNumber: token.tokenNumber,
              })
            }
          />
          <View style={styles.spacer} />
          <Button
            title="Back to Home"
            variant="outline"
            onPress={() => navigation.navigate('Home')}
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  checkmark: {
    fontSize: 40,
    color: colors.white,
    fontWeight: '700',
  },
  title: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  tokenCard: {
    width: '100%',
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[600],
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderStyle: 'dashed',
  },
  tokenLabel: {
    color: colors.primary[700],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary[700],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.primary[200],
    marginBottom: spacing.lg,
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
    fontWeight: '600',
    color: colors.text,
  },
  waitingText: {
    color: colors.warning,
  },
  positionText: {
    color: colors.warning,
  },
  waitTimeText: {
    color: colors.info,
  },
  actions: {
    width: '100%',
  },
  spacer: {
    height: spacing.md,
  },
});
