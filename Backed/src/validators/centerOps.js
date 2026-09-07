import { z } from 'zod';

export const STATUSES = [
  'BOOKED',
  'WAITING',
  'VERIFICATION',
  'INSPECTION',
  'PROCUREMENT',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED',
  'REJECTED',
];

export const advanceStatusSchema = z.object({
  status: z.enum(STATUSES),
  reason: z.string().optional(),
});

export const procurementSchema = z.object({
  commodity: z.string().trim().optional(),
  quantity: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
  unit: z.string().trim().optional(),
  qualityStatus: z.enum(['pending', 'good', 'average', 'rejected']).optional(),
  quality_status: z.enum(['pending', 'good', 'average', 'rejected']).optional(),
  notes: z.string().optional(),
});