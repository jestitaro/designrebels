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

  it('cada país tiene sus feriados marcados', () => {
    for (const c of ['ar', 'mx', 'ec', 'es']) expect(SEED_EVENTS.filter((e) => e.country === c && e.isHoliday).length, c).toBeGreaterThanOrEqual(7);
  });

  it('los confirmados tienen fuente, link y fecha de verificación; los pendientes, una nota', () => {
    for (const e of SEED_EVENTS) {
      if (e.verification === 'confirmado') {
        expect(e.source, e.id).not.toBe('');
        expect(e.sourceUrl, e.id).toMatch(/^https?:\/\//);
        expect(e.lastVerifiedAt, e.id).toMatch(/^2026-11-(03|13)$/);
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
      for (const ed of e.editions ?? []) for (const p of [ed.region, ed.city]) if (p) expect(places.has(p), `${e.id}/${ed.id} → ${p}`).toBe(true);
    }
  });

  it('sin fechas comerciales', () => {
    expect(DEFAULT_CATEGORIES.some((c) => c.id === 'comerciales')).toBe(false);
    expect(SEED_EVENTS.some((e) => e.category === 'comerciales')).toBe(false);
  });

  it('Noche de los Museos: una edición por región; las confirmadas con link y las pendientes con nota', () => {
    const nm = SEED_EVENTS.find((e) => e.id === 'seed-ar-noche-museos-2026')!;
    expect(nm.editions?.map((e) => `${e.region}:${e.startDate}`)).toEqual([
      'ar-tuc:2026-10-31', 'ar-er:2026-11-06', 'ar-ctes:2026-11-07', 'ar-cba:2026-11-13', 'ar-caba:2026-11-14', 'ar-ba:2026-11-14',
    ]);
    for (const ed of nm.editions!) {
      if (ed.verification === 'confirmado') expect(ed.url, ed.id).toMatch(/^https:\/\//);
      else expect(ed.note, ed.id).toBeTruthy();
    }
  });

  it('las reglas dan las fechas 2026 verificadas', () => {
    const byId = new Map(SEED_EVENTS.map((e) => [e.id, e]));
    expect(occurrenceStartForYear(byId.get('seed-intl-usabilidad')!, 2026)).toBe('2026-11-12');
    expect(occurrenceStartForYear(byId.get('seed-intl-project-management')!, 2026)).toBe('2026-11-05');
    expect(occurrenceStartForYear(byId.get('seed-es-viernes-santo')!, 2026)).toBe('2026-04-03');
    expect(occurrenceStartForYear(byId.get('seed-es-viernes-santo')!, 2027)).toBe('2027-03-26');
    expect(occurrenceStartForYear(byId.get('seed-ar-carnaval')!, 2026)).toBe('2026-02-16');
    expect(occurrenceStartForYear(byId.get('seed-ar-carnaval')!, 2027)).toBe('2027-02-08');
    expect(occurrenceStartForYear(byId.get('seed-mx-constitucion')!, 2026)).toBe('2026-02-02');
    expect(occurrenceStartForYear(byId.get('seed-mx-juarez')!, 2026)).toBe('2026-03-16');
    expect(occurrenceStartForYear(byId.get('seed-mx-revolucion-descanso')!, 2026)).toBe('2026-11-16');
    expect(occurrenceStartForYear(byId.get('seed-es-md-jueves-santo')!, 2026)).toBe('2026-04-02');
    expect(occurrenceStartForYear(byId.get('seed-es-ct-pascua')!, 2026)).toBe('2026-04-06');
    expect(occurrenceStartForYear(byId.get('seed-es-bcn-pascua-granada')!, 2026)).toBe('2026-05-25');
  });
});
