import { z } from 'zod';
import { eventSchema } from './event';

const greetingSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  internalTitle: z.string(),
  body: z.string(),
  imageUrl: z.string().optional(),
  plannedDate: z.string().optional(),
  status: z.enum(['pendiente', 'listo', 'compartido']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.enum(['blue', 'teal', 'amber', 'pink', 'fuchsia', 'green', 'brand', 'slate']),
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

const personSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  initials: z.string().optional(),
  roles: z.array(z.object({ area: z.string(), title: z.string() })),
  country: z.string().min(1),
  region: z.string().optional(),
  city: z.string().optional(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const vacationSchema = z.object({ id: z.string().min(1), personId: z.string().min(1), start: z.string(), end: z.string(), note: z.string().optional() });

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
    people: z.array(personSchema).default([]),
    vacations: z.array(vacationSchema).default([]),
  }),
});

export type Backup = z.infer<typeof backupSchema>;
