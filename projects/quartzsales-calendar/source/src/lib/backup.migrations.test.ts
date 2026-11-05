import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '../db/db';
import { parseBackup } from './backup';

describe('migraciones de respaldos', () => {
  it('hay un paso de migración para cada versión anterior', () => {
    for (let v = 1; v < SCHEMA_VERSION; v++) {
      const r = parseBackup(JSON.stringify({ app: 'qs-calendar', schemaVersion: v, exportedAt: 'x', data: {} }));
      expect(r.ok ? '' : r.error, `v${v}`).not.toContain('No hay migración');
    }
  });
});
