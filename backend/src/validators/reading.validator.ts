import { z } from 'zod';

export const ALLOWED_TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
] as const;

export type TimeSlot = (typeof ALLOWED_TIME_SLOTS)[number];

// Helper to check if a date string is in the future (relative to user's local date)
export const isDateInFuture = (dateString: string): boolean => {
  // Compare YYYY-MM-DD lexicographically with today's local date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  return dateString > todayStr;
};

export const readingInputSchema = z
  .object({
    reading_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be formatted as YYYY-MM-DD.' })
      .refine(
        (val) => {
          const d = new Date(val + 'T00:00:00Z');
          return !isNaN(d.getTime());
        },
        { message: 'Invalid calendar date.' }
      )
      .refine(
        (val) => !isDateInFuture(val),
        { message: 'Date cannot be in the future.' }
      ),

    time_slot: z.enum([
      'Morning (fasting)',
      'After breakfast',
      'After lunch',
      'After dinner',
    ]),

    glucose_value: z
      .any()
      .superRefine((val, ctx) => {
        if (val === undefined || val === null || val === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please enter a glucose value.',
          });
          return;
        }
        if (typeof val === 'string' && val.includes('.')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Value must be between 40 and 600 mg/dl.',
          });
          return;
        }
        const num = Number(val);
        if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Value must be between 40 and 600 mg/dl.',
          });
          return;
        }
      })
      .transform((val) => Number(val)),
  });

export type ReadingInput = z.infer<typeof readingInputSchema>;
