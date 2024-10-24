import { z } from 'zod';

export const phoneSchema = z.object({
    phone: z.string()
      .regex(/^998\d{9}$/, 'Phone number must start with 998 followed by 9 digits')
      .refine(
        (value) => value.length === 12,
        'Phone number must be exactly 12 digits long'
      ),
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const userDetailsSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  gender: z.enum(['male', 'female']),
});