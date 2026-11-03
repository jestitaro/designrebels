import { describe, expect, it } from 'vitest';
import { makeEvent } from '../test/factories';
import type { Greeting } from '../types';
import { applyFilters, countActiveFilters, EMPTY_FILTERS, greetingsByEvent } from './filters';

const mate = makeEvent({ id: 'mate', title: 'Día Nacional del Mate', country: 'ar', region: 'ar-ctes', category: 'cultura', relevance: 'alta', verification: 'confirmado', favorite: true });
const muertos = makeEvent({ id: 'muertos', title: 'Día de Muertos', country: 'mx', category: 'cultura', relevance: 'alta' });
const ux = makeEvent({ id: 'ux', title: 'Día Mundial de la Usabilidad', country: 'intl', category: 'profesiones', relevance: 'media' });
const viejo = makeEvent({ id: 'viejo', title: 'Archivado', country: 'ar', archived: true });
const all = [mate, muertos, ux, viejo];

const greeting = (eventId: string, status: Greeting['status']): Greeting => ({
  id: `g-${eventId}`, eventId, internalTitle: '', body: '', tone: 'cercano', channel: '', status, privateNotes: '',
  versions: [], createdAt: '', updatedAt: '',
});

const ids = (list: { id: string }[]) => list.map((e) => e.id);

describe('filtros combinados', () => {
  it('oculta archivados por defecto', () => {
    expect(ids(applyFilters(all, EMPTY_FILTERS))).toEqual(['mate', 'muertos', 'ux']);
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, showArchived: true }))).toContain('viejo');
  });

  it('busca sin importar tildes ni mayúsculas', () => {
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, query: 'dia MUNDIAL usabilidad' }))).toEqual(['ux']);
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, query: 'MUERTOS dia' }))).toEqual(['muertos']);
  });

  it('combina grupos con AND y valores con OR', () => {
    const f = { ...EMPTY_FILTERS, countries: ['ar', 'mx'], categories: ['cultura'], relevance: ['alta' as const] };
    expect(ids(applyFilters(all, f))).toEqual(['mate', 'muertos']);
    expect(ids(applyFilters(all, { ...f, verification: ['confirmado'] }))).toEqual(['mate']);
    expect(ids(applyFilters(all, { ...f, regions: ['ar-ctes'] }))).toEqual(['mate']);
    expect(ids(applyFilters(all, { ...f, favoritesOnly: true }))).toEqual(['mate']);
  });

  it('filtra por con/sin saludo (los descartados no cuentan)', () => {
    const map = greetingsByEvent([greeting('mate', 'borrador'), greeting('ux', 'descartado')]);
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, greeting: 'con' }, map))).toEqual(['mate']);
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, greeting: 'sin' }, map))).toEqual(['muertos', 'ux']);
  });

  it('respeta las categorías ocultas en Configuración salvo que se filtren explícitamente', () => {
    const hidden = new Set(['profesiones']);
    expect(ids(applyFilters(all, EMPTY_FILTERS, new Map(), hidden))).toEqual(['mate', 'muertos']);
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, categories: ['profesiones'] }, new Map(), hidden))).toEqual(['ux']);
  });

  it('cuenta filtros activos', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...EMPTY_FILTERS, countries: ['ar', 'mx'], favoritesOnly: true })).toBe(3);
  });
});
