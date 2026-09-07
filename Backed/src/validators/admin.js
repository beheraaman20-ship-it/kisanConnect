import { z } from 'zod';

export const centerCreateSchema = z.object({
  code: z.string().trim().min(1).max(10),
  name: z.string().trim().min(2),
  location: z.string().optional(),
  district: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  daily_capacity: z.number().int().positive().optional(),
  active_counters: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
});

export const centerUpdateSchema = centerCreateSchema.partial();

export const scheduleCreateSchema = z.object({
  centerId: z.union([z.number(), z.string().transform((v) => Number(v))]),
  center_id: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
  tokenDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  capacity: z.number().int().positive().optional(),
  times: z.array(z.tuple([z.string(), z.string()])).min(1).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

export const slotUpdateSchema = z.object({
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  available_slots: z.number().int().min(0).optional(),
  status: z.enum(['open', 'closed', 'full']).optional(),
});

export const staffAssignSchema = z.object({
  userId: z.union([z.number(), z.string().transform((v) => Number(v))]),
  user_id: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
  centerId: z.union([z.number(), z.string().transform((v) => Number(v))]),
  center_id: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
});