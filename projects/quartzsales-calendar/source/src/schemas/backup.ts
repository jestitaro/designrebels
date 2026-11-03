import { z } from 'zod';
import { eventSchema } from './event';

const greetingSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  internalTitle: z.string(),
  body: z.string(),
  tone: z.enum(['institucional', 'cercano', 'divertido', 'humor-interno']),
  channel: z.string(),
  plannedDate: z.string().optional(),
  status: z.enum(['sin redactar', 'borrador', 'listo', 'compartido', 'descartado']),
  privateNotes: z.string(),
  versions: z.array(
    z.object({
      id: z.string(),
      body: z.string(),
      status: z.enum(['sin redactar', 'borrador', 'listo', 'compartido', 'descartado']),
      savedAt: z.string(),
      reason: z.enum(['manual', 'cambio de estado', 'restauración']),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.enum(['blue', 'teal', 'amber', 'pink', 'fuchsia', 'green', 'brand']),
  subcategories: z.array(z.object({ id: z.string(), name: z.string() })),
  visible: z.boolean(),
  order: z.number(),
});

const placeSchema = z.object({ id: z.string().min(1), name: z.string().min(1), active: z.boolean() });

const countrySchema = placeSchema.extend({
  order: z.number(),
  regions: z.array(placeSchema.extend({ cities: z.array(placeSchema) })),
});

const settingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  leadDays: z.number().int().min(0).max(60),
  lastExportAt: z.string().optional(),
});

export const backupSchema = z.object({
  app: z.literal('qs-calendar'),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.string(),
  data: z.object({
    events: z.array(eventSchema),
    greetings: z.array(greetingSchema),
    categories: z.array(categorySchema),
    countries: z.array(countrySchema),
    settings: settingsSchema,
    deletedSeedIds: z.array(z.string()).default([]),
    seedVersion: z.number().default(0),
    reviewedAlerts: z.array(z.object({ key: z.string(), reviewedAt: z.string() })).default([]),
  }),
});

export type Backup = z.infer<typeof backupSchema>;
