import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
}) => {
  const backgroundColor =
    variant === 'primary'
      ? colors.primary[600]
      : variant === 'secondary'
      ? colors.secondary[500]
      : variant === 'danger'
      ? colors.error
      : 'transparent';

  const borderColor =
    variant === 'outline' ? colors.primary[600] : 'transparent';

  const textColor =
    variant === 'outline' ? colors.primary[600] : colors.white;

  const paddingHorizontal = size === 'small' ? 12 : size === 'medium' ? 16 : 24;
  const paddingVertical = size === 'small' ? 8 : size === 'medium' ? 12 : 16;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          paddingHorizontal,
          paddingVertical,
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: textColor },
            { fontSize: size === 'small' ? 14 : 16 },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    fontWeight: '600',
  },
});
