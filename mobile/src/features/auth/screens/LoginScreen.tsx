import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Screen } from '../../../components/common/Screen';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { mobileSchema, MobileFormData } from '../validation/authValidation';
import { colors, spacing, typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { sendOtp, isLoading, error, clearError } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MobileFormData>({
    resolver: zodResolver(mobileSchema),
  });

  const onSubmit = async (data: MobileFormData) => {
    try {
      await sendOtp(data.mobile);
      clearError();
      navigation.navigate('Otp', { mobile: data.mobile });
    } catch (e) {
      Alert.alert('Error', error || 'Unable to send OTP');
    }
  };

  return (
    <Screen keyboardAvoiding>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[typography.h1, styles.title]}>KisanConnect</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Smart Farmer Procurement Management
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[typography.h3, styles.formTitle]}>Login</Text>
          <Text style={[typography.bodySmall, styles.formHint]}>
            Enter your registered mobile number to receive an OTP
          </Text>

          <Controller
            control={control}
            name="mobile"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Mobile Number"
                placeholder="Enter 10-digit mobile number"
                keyboardType="number-pad"
                maxLength={10}
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  clearError();
                }}
                onBlur={onBlur}
                error={errors.mobile?.message}
              />
            )}
          />

          <Button
            title={isLoading ? 'Sending OTP...' : 'Send OTP'}
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxxl,
  },
  title: {
    color: colors.primary[600],
    fontSize: 32,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    marginBottom: spacing.xs,
  },
  formHint: {
    marginBottom: spacing.xl,
  },
});
