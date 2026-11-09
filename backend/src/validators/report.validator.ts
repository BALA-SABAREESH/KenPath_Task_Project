import { z } from 'zod';

export const reportDateQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date query parameter must be formatted as YYYY-MM-DD.' })
    .refine((val) => !isNaN(new Date(val + 'T00:00:00Z').getTime()), {
      message: 'Invalid date format.',
    })
    .optional(),
});
