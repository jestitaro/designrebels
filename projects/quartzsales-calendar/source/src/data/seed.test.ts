import { describe, expect, it } from 'vitest';
import { eventSchema } from '../schemas/event';
import { DEFAULT_CATEGORIES, DEFAULT_COUNTRIES } from './defaults';
import { SEED_EVENTS } from './seed';
import { occurrenceStartForYear } from '../lib/recurrence';

describe('seed', () => {
  it('todos los eventos son válidos y con IDs únicos', () => {
    for (const e of SEED_EVENTS) {
      const r = eventSchema.safeParse(e);
      expect(r.success, `${e.id}: ${r.success ? '' : JSON.stringify(r.error.issues)}`).toBe(true);
    }
    expect(new Set(SEED_EVENTS.map((e) => e.id)).size).toBe(SEED_EVENTS.length);
  });

  it('los confirmados tienen fuente, link y fecha de verificación; los pendientes, una nota', () => {
    for (const e of SEED_EVENTS) {
      if (e.verification === 'confirmado') {
        expect(e.source, e.id).not.toBe('');
        expect(e.sourceUrl, e.id).toMatch(/^https?:\/\//);
        expect(e.lastVerifiedAt, e.id).toBe('2026-11-03');
      } else {
        expect(e.verificationNote, e.id).toBeTruthy();
      }
    }
  });

  it('usa categorías, subcategorías y lugares existentes, sin eventos de QuartzSales', () => {
    const cats = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));
    const places = new Set(DEFAULT_COUNTRIES.flatMap((c) => [c.id, ...c.regions.flatMap((r) => [r.id, ...r.cities.map((x) => x.id)])]));
    for (const e of SEED_EVENTS) {
      expect(cats.has(e.category), e.id).toBe(true);
      expect(e.category).not.toBe('quartzsales');
      if (e.subcategory) expect(cats.get(e.category)!.subcategories.some((s) => s.id === e.subcategory), `${e.id} → ${e.subcategory}`).toBe(true);
      for (const p of [e.country, e.region, e.city]) if (p) expect(places.has(p), `${e.id} → ${p}`).toBe(true);
    }
  });

  it('las reglas dan las fechas 2026 verificadas', () => {
    const byId = new Map(SEED_EVENTS.map((e) => [e.id, e]));
    expect(occurrenceStartForYear(byId.get('seed-intl-usabilidad')!, 2026)).toBe('2026-11-12');
    expect(occurrenceStartForYear(byId.get('seed-intl-project-management')!, 2026)).toBe('2026-11-05');
    expect(occurrenceStartForYear(byId.get('seed-intl-black-friday')!, 2026)).toBe('2026-11-27');
    expect(occurrenceStartForYear(byId.get('seed-es-viernes-santo')!, 2026)).toBe('2026-04-03');
    expect(occurrenceStartForYear(byId.get('seed-es-viernes-santo')!, 2027)).toBe('2027-03-26');
  });
});
