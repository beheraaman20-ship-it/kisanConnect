import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Screen } from '../../../components/common/Screen';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { otpSchema, OtpFormData } from '../validation/authValidation';
import { colors, spacing, typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

export const OtpScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mobile } = route.params;
  const { verifyOtp, isLoading, error, clearError, sendOtp } = useAuth();
  const [timer, setTimer] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: OtpFormData) => {
    try {
      await verifyOtp(mobile, data.otp);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Farmer' as never }],
      });
    } catch (e) {
      Alert.alert('Error', error || 'Invalid OTP');
    }
  };

  const resendOtp = async () => {
    try {
      await sendOtp(mobile);
      setTimer(30);
      clearError();
      Alert.alert('Success', 'OTP resent successfully');
    } catch (e) {
      Alert.alert('Error', error || 'Unable to resend OTP');
    }
  };

  return (
    <Screen keyboardAvoiding>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[typography.h2, styles.title]}>Enter OTP</Text>
          <Text style={[typography.bodySmall, styles.subtitle]}>
            OTP sent to +91 {mobile}
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="otp"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="OTP"
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  clearError();
                }}
                onBlur={onBlur}
                error={errors.otp?.message}
              />
            )}
          />

          <Button
            title={isLoading ? 'Verifying...' : 'Verify & Login'}
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
          />

          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={[typography.caption, styles.resendText]}>
                Resend OTP in {timer}s
              </Text>
            ) : (
              <Button
                title="Resend OTP"
                onPress={resendOtp}
                variant="outline"
                size="small"
                fullWidth={false}
              />
            )}
          </View>
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
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resendContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
  },
});
