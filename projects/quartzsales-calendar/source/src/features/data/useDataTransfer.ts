import { useState } from 'react';
import { updateSettings } from '../../db/repo';
import { buildBackup, parseBackup } from '../../lib/backup';
import { parseCsv, toCsv } from '../../lib/csv';
import { todayISO } from '../../lib/dates';
import { downloadFile } from '../../lib/download';
import { csvTemplate, eventsToCsv, parseEventsCsv, type CsvParseResult } from '../../lib/eventsCsv';
import type { Backup } from '../../schemas/backup';
import type { CalendarEvent } from '../../types';
import type { Catalog } from '../../hooks/useData';
import { useToast } from '../../components/ui/Toast';
import { useFilePicker } from './useFilePicker';
import { db } from '../../db/db';

/** Estado y acciones de importación/exportación compartidos por Configuración y Biblioteca. */
export function useDataTransfer(catalog: Catalog) {
  const toast = useToast();
  const pickJson = useFilePicker('application/json,.json');
  const pickCsv = useFilePicker('text/csv,.csv');
  const [json, setJson] = useState<{ backup: Backup; name: string; migratedFrom?: number } | null>(null);
  const [csv, setCsv] = useState<{ result: CsvParseResult; name: string } | null>(null);

  async function exportJson() {
    const backup = await buildBackup();
    downloadFile(`qs-calendar-respaldo-${todayISO()}.json`, JSON.stringify(backup, null, 2), 'application/json');
    await updateSettings({ lastExportAt: backup.exportedAt });
    toast.success('Respaldo descargado. Guardalo en un lugar seguro.');
  }

  async function importJson() {
    const file = await pickJson();
    if (!file) return;
    const parsed = parseBackup(file.text);
    if (!parsed.ok) toast.error(parsed.error);
    else setJson({ backup: parsed.backup, name: file.name, migratedFrom: parsed.migratedFrom });
  }

  function downloadTemplate() {
    downloadFile('qs-calendar-plantilla-eventos.csv', toCsv(csvTemplate()), 'text/csv;charset=utf-8');
  }

  function exportCsv(events: CalendarEvent[], name = `qs-calendar-eventos-${todayISO()}.csv`) {
    if (events.length === 0) return toast.error('No hay eventos para exportar.');
    downloadFile(name, toCsv(eventsToCsv(events, catalog)), 'text/csv;charset=utf-8');
    toast.success(`Se exportaron ${events.length} eventos.`);
  }

  async function importCsv() {
    const file = await pickCsv();
    if (!file) return;
    const rows = parseCsv(file.text);
    if (rows.length < 2) return toast.error('El CSV está vacío o solo tiene encabezados.');
    setCsv({ result: parseEventsCsv(rows, catalog, await db.events.toArray()), name: file.name });
  }

  return { json, setJson, csv, setCsv, exportJson, importJson, downloadTemplate, exportCsv, importCsv };
}
