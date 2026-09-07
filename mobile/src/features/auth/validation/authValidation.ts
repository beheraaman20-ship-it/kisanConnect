import { z } from 'zod';

export const mobileSchema = z.object({
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numeric'),
});

export type MobileFormData = z.infer<typeof mobileSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
