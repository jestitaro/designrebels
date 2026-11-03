import { z } from 'zod';
import { isValidISODate } from '../lib/dates';

// Mensajes de validación en español.
z.config(z.locales.es());

const isoDate = z.string().refine(isValidISODate, 'Fecha inválida (usá dd/mm/aaaa).');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (HH:mm).');
const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Tiene que ser un link que empiece con http:// o https://.')
  .optional();

export const recurrenceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('yearly-fixed') }),
  z.object({
    type: z.literal('yearly-nth-weekday'),
    month: z.number().int().min(1).max(12),
    weekday: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    nth: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(-1)]),
    offsetDays: z.number().int().min(-31).max(31),
  }),
  z.object({ type: z.literal('yearly-easter'), offsetDays: z.number().int().min(-70).max(70) }),
]);

export const relevanceSchema = z.enum(['alta', 'media', 'baja']);
export const verificationSchema = z.enum(['confirmado', 'pendiente', 'tentativo']);
export const editorialStatusSchema = z.enum(['sin evaluar', 'para comunicar', 'en preparación', 'comunicado', 'descartado']);

/** Contenido editable de un evento (sin metadatos de sistema). */
export const eventContentSchema = z
  .object({
    title: z.string().trim().min(1, 'El nombre es obligatorio.').max(160, 'Máximo 160 caracteres.'),
    summary: z.string().trim().max(280, 'Máximo 280 caracteres.'),
    description: z.string(),
    history: z.string(),
    traditions: z.string(),
    category: z.string().min(1, 'Elegí una categoría.'),
    subcategory: z.string().optional(),
    country: z.string().min(1, 'Elegí un país.'),
    region: z.string().optional(),
    city: z.string().optional(),
    startDate: isoDate,
    endDate: isoDate.optional(),
    allDay: z.boolean(),
    startTime: time.optional(),
    endTime: time.optional(),
    timezone: z.string().min(1),
    recurrence: recurrenceSchema,
    dateType: z.enum(['fija', 'variable', 'edición anual']),
    holidayObservances: z.array(z.object({ year: z.number().int(), date: isoDate, note: z.string().optional() })),
    relevance: relevanceSchema,
    verification: verificationSchema,
    verificationNote: z.string().optional(),
    source: z.string(),
    sourceUrl: optionalUrl,
    lastVerifiedAt: isoDate.optional(),
    imageUrl: optionalUrl,
    contentIdeas: z.array(z.string()),
    favorite: z.boolean(),
    archived: z.boolean(),
    editorialStatus: editorialStatusSchema,
  })
  .superRefine((v, ctx) => {
    if (v.endDate && v.endDate < v.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'La fecha de fin no puede ser anterior al inicio.' });
    }
    if (!v.allDay && !v.startTime) {
      ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Indicá la hora de inicio o marcalo como día completo.' });
    }
    if (!v.allDay && v.startTime && v.endTime && !v.endDate && v.endTime < v.startTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'La hora de fin no puede ser anterior al inicio.' });
    }
    if (v.verification === 'confirmado' && !v.source.trim()) {
      ctx.addIssue({ code: 'custom', path: ['source'], message: 'Para marcarlo como confirmado, indicá la fuente.' });
    }
  });

export const eventSchema = z.intersection(
  eventContentSchema,
  z.object({
    id: z.string().min(1),
    provenance: z.enum(['seed', 'usuario']),
    userModified: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export type EventContent = z.infer<typeof eventContentSchema>;

/** Convierte los issues de zod en { campo: mensaje } (primer error por campo). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
