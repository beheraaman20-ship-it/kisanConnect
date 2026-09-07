import { z } from 'zod';

export const sendOtpSchema = z.object({
  mobile: z.string().min(10).max(15),
});

export const verifyOtpSchema = z.object({
  mobile: z.string().min(10).max(15),
  otp: z.string().min(4).max(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});