import { z } from 'zod';

export const rejectReasonSchema = z.object({
  preset: z.string().min(1, 'Please select a rejection reason preset'),
  note: z.string().max(500, 'Note must be under 500 characters').optional(),
});

export const requestChangesSchema = z.object({
  notes: z
    .string()
    .min(5, 'Please provide detailed change request instructions (at least 5 characters)')
    .max(1000, 'Notes must be under 1000 characters'),
});

export const addAdminSchema = z.object({
  email: z.string().email('Please enter a valid administrator email address'),
});

export const addPresetSchema = z.object({
  preset: z
    .string()
    .min(3, 'Preset must be at least 3 characters')
    .max(100, 'Preset must be under 100 characters'),
});

export const marketplaceSettingsSchema = z.object({
  maxPendingPerUser: z.coerce.number().min(1, 'Must be at least 1').max(50, 'Max 50'),
  requireEmailVerification: z.boolean(),
  slaHoursWarning: z.coerce.number().min(1, 'Must be at least 1 hour').max(168, 'Max 168 hours (7 days)'),
  reportThreshold: z.coerce.number().min(1, 'Must be at least 1').max(20, 'Max 20 reports'),
});
