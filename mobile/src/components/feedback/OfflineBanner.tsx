import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

interface OfflineBannerProps {
  visible: boolean;
  reconnecting?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  visible,
  reconnecting = false,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {reconnecting ? 'Reconnecting...' : 'You are offline. Data may be outdated.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
