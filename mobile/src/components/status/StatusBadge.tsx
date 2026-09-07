import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TokenStatus } from '../../core/types';
import { colors, borderRadius } from '../../theme';

interface StatusBadgeProps {
  status: TokenStatus | string;
}

const getStatusColors = (status: string): { bg: string; text: string } => {
  switch (status) {
    case TokenStatus.BOOKED:
      return { bg: colors.info + '20', text: colors.info };
    case TokenStatus.WAITING:
      return { bg: colors.warning + '20', text: colors.warning };
    case TokenStatus.VERIFICATION:
      return { bg: colors.secondary[400] + '30', text: colors.secondary[700] };
    case TokenStatus.INSPECTION:
      return { bg: colors.secondary[200] + '60', text: colors.secondary[800] };
    case TokenStatus.PROCUREMENT:
      return { bg: colors.primary[200], text: colors.primary[800] };
    case TokenStatus.COMPLETED:
      return { bg: colors.success + '20', text: colors.success };
    case TokenStatus.CANCELLED:
    case TokenStatus.REJECTED:
      return { bg: colors.error + '20', text: colors.error };
    case TokenStatus.RESCHEDULED:
      return { bg: colors.neutral[200], text: colors.neutral[600] };
    default:
      return { bg: colors.neutral[200], text: colors.neutral[600] };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { bg, text } = getStatusColors(status);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
