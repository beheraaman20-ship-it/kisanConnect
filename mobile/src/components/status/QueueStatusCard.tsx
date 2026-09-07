import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface QueueStatusCardProps {
  queue: {
    currentToken?: string | null;
    position?: number;
    estimatedWaitMinutes?: number;
  } | null;
  token: string;
}

export const QueueStatusCard: React.FC<QueueStatusCardProps> = ({
  queue,
  token,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.label}>Your Token</Text>
          <Text style={styles.tokenValue}>{token}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Current Token</Text>
          <Text style={styles.currentToken}>
            {queue?.currentToken || '---'}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Position</Text>
          <Text style={styles.position}>{queue?.position ?? '---'}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Est. Wait</Text>
          <Text style={styles.waitTime}>
            {queue?.estimatedWaitMinutes != null
              ? `${queue.estimatedWaitMinutes} min`
              : '---'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tokenValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary[600],
  },
  currentToken: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  position: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.warning,
  },
  waitTime: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.info,
  },
});
