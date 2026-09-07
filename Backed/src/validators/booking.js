import { z } from 'zod';

export const bookSlotSchema = z.object({
  slotId: z.number().int().positive(),
  slot_id: z.number().int().positive().optional(),
});

export const rescheduleSchema = z.object({
  newSlotId: z.number().int().positive(),
  new_slot_id: z.number().int().positive().optional(),
  slotId: z.number().int().positive().optional(),
});