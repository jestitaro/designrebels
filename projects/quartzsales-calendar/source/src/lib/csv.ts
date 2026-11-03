/** Parser CSV (RFC 4180) con comillas, saltos dentro de campos y separador , o ; (Excel en español). */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"' && field === '') quoted = true;
    else if (c === sep) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function escapeCell(value: string, sep: string): string {
  return /["\r\n]/.test(value) || value.includes(sep) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Genera CSV con BOM para que Excel respete tildes. */
export function toCsv(rows: string[][], sep = ','): string {
  return '﻿' + rows.map((r) => r.map((c) => escapeCell(c, sep)).join(sep)).join('\r\n') + '\r\n';
}
