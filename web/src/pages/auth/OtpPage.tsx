import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { otpSchema, type OtpFormData } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';

export const OtpPage: React.FC = () => {
  const { verifyOtp, isLoading, error, clearError, sendOtp, devOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mobile =
    (location.state as { mobile?: string } | null)?.mobile ?? '';
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
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
      navigate('/', { replace: true });
    } catch {
      // error is surfaced via store
    }
  };

  const resendOtp = async () => {
    try {
      await sendOtp(mobile);
      setTimer(30);
      clearError();
      setSuccessMessage('OTP resent successfully');
    } catch {
      setSuccessMessage(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft size={16} /> Back to login
        </Link>

        {!mobile ? <Navigate to="/login" replace /> : null}

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Enter OTP</h1>
          <p className="mt-1 text-sm text-neutral-500">
            OTP sent to +91 {mobile}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {(error || successMessage) && (
            <div
              className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                successMessage
                  ? 'bg-green-50 text-success'
                  : 'bg-red-50 text-error'
              }`}
            >
              {successMessage ?? error}
            </div>
          )}

          {devOtp && (
            <div className="mb-4 rounded-lg border border-dashed border-primary-300 bg-primary-50 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase text-primary-700">
                Dev mode — your OTP
              </p>
              <p className="text-2xl font-bold tracking-widest text-primary-700">
                {devOtp}
              </p>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(devOtp);
                  setSuccessMessage('OTP copied to clipboard');
                }}
                className="mt-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Copy OTP
              </button>
            </div>
          )}

          <Controller
            control={control}
            name="otp"
            render={({ field }) => (
              <Input
                label="OTP"
                placeholder="Enter 4-6 digit OTP"
                inputMode="numeric"
                maxLength={6}
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e.target.value.replace(/\D/g, '').slice(0, 6));
                  clearError();
                }}
                onBlur={field.onBlur}
                error={errors.otp?.message}
              />
            )}
          />

          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            loading={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify & Login'}
          </Button>

          <div className="mt-4 text-center">
            {timer > 0 ? (
              <p className="text-sm text-neutral-500">
                Resend OTP in {timer}s
              </p>
            ) : (
              <div className="mx-auto max-w-[200px]">
                <Button variant="outline" size="small" onClick={resendOtp}>
                  Resend OTP
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};