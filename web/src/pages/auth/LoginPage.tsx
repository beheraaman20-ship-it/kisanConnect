import React from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { mobileSchema, type MobileFormData } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { sendOtp, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

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
      navigate('/otp', { state: { mobile: data.mobile } });
    } catch {
      // error is surfaced via store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-3xl">
            🌾
          </span>
          <h1 className="text-3xl font-bold text-primary-600">KisanConnect</h1>
          <p className="mt-1 text-neutral-500">
            Smart Farmer Procurement Management
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-xl font-semibold text-neutral-900">
            Login
          </h2>
          <p className="mb-5 text-sm text-neutral-500">
            Enter your registered mobile number to receive an OTP
          </p>

          {error ? (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-error">
              {error}
            </div>
          ) : null}

          <Controller
            control={control}
            name="mobile"
            render={({ field }) => (
              <Input
                label="Mobile Number"
                placeholder="Enter 10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10));
                  clearError();
                }}
                onBlur={field.onBlur}
                error={errors.mobile?.message}
              />
            )}
          />

          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            loading={isLoading}
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        </div>
      </div>
    </div>
  );
};