/* Dino Cup — Kahoot report parsing (XLSX/CSV) + file hashing.
   Depends on window.DinoCupData (roster.js) and window.XLSX (SheetJS).
   Exposes window.DinoCupParser. */
(function () {
  const { norm } = window.DinoCupData;

  function cleanNumber(value) { return Number(String(value ?? '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0; }
  function findHeader(headers, names) { return headers.find(header => names.some(name => norm(header).includes(name))); }

  function splitCsvLine(line) {
    const output = []; let current = ''; let quoted = false;
    for (let index = 0; index < line.length; index++) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') { current += '"'; index++; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { output.push(current.replace(/^"|"$/g, '')); current = ''; }
      else current += char;
    }
    output.push(current.replace(/^"|"$/g, ''));
    return output;
  }

  const NAME_ALIASES = ['nickname', 'player', 'name', 'nombre', 'participante', 'jugador', 'identifier', 'email'];
  const SCORE_ALIASES = ['score', 'points', 'puntos', 'puntaje', 'total score', 'current total'];
  const RANK_ALIASES = ['rank', 'puesto', 'position', 'ranking', 'place'];
  const TITLE_ALIASES = ['title', 'quiz', 'kahoot', 'nombre del juego', 'game name', 'report title'];

  function rowsFromMatrix(matrix) {
    const headerIndex = matrix.findIndex(row => row.some(cell => NAME_ALIASES.some(alias => norm(cell).includes(alias))));
    if (headerIndex < 0) return { rows: [], nameKey: null };
    const headers = matrix[headerIndex].map((header, index) => String(header || `column_${index}`).trim());
    const rows = matrix.slice(headerIndex + 1).filter(row => row.some(Boolean)).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
    return { rows, nameKey: findHeader(headers, NAME_ALIASES) };
  }

  function detectTitleFromMatrix(matrix) {
    for (const row of matrix.slice(0, 6)) {
      for (let index = 0; index < row.length; index += 1) {
        const cell = String(row[index] || '').trim();
        if (!cell) continue;
        const label = norm(cell);
        if (TITLE_ALIASES.some(alias => label.includes(alias)) && row[index + 1]) {
          return String(row[index + 1]).trim();
        }
      }
    }
    const firstTextRow = matrix.find(row => row.some(cell => String(cell || '').trim()));
    return firstTextRow ? String(firstTextRow.find(cell => String(cell || '').trim()) || '').trim() : '';
  }

  async function csvFile(file) {
    const text = await file.text();
    const matrix = text.split(/\r?\n/).filter(line => line.trim()).map(splitCsvLine);
    return { rows: rowsFromMatrix(matrix).rows, detectedTitle: detectTitleFromMatrix(matrix) };
  }

  function pickKahootSheet(workbook) {
    const preferred = ['Final Scores', 'Final scores', 'Scores', 'Overview', 'Raw Report Data', 'Raw data', 'RawReportData'];
    const names = [...preferred.filter(name => workbook.SheetNames.includes(name)), ...workbook.SheetNames.filter(name => !preferred.includes(name))];
    let detectedTitle = '';
    for (const sheet of workbook.SheetNames) {
      const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1, defval: '' });
      const title = detectTitleFromMatrix(matrix);
      if (title) { detectedTitle = title; break; }
    }
    for (const sheet of names) {
      const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1, defval: '' });
      const parsed = rowsFromMatrix(matrix);
      if (parsed.rows.length && parsed.nameKey) return { rows: parsed.rows, detectedTitle };
    }
    return { rows: XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' }), detectedTitle };
  }

  async function xlsxFile(file) {
    if (!window.XLSX) throw new Error('SheetJS no cargó');
    const buffer = await file.arrayBuffer();
    return pickKahootSheet(XLSX.read(buffer));
  }

  function parseKahootRows(rows) {
    const headers = Object.keys(rows[0] || {});
    const nameKey = findHeader(headers, NAME_ALIASES);
    const scoreKey = findHeader(headers, SCORE_ALIASES);
    const rankKey = findHeader(headers, RANK_ALIASES);
    if (!nameKey) return [];
    const parsed = rows.map((row, index) => ({
      nickname: String(row[nameKey] || '').trim(),
      score: cleanNumber(row[scoreKey]),
      rank: rankKey ? cleanNumber(row[rankKey]) : index + 1
    })).filter(row => row.nickname && !/average|total|summary|final scores/i.test(row.nickname));
    return parsed.sort((a, b) => (rankKey ? a.rank - b.rank : b.score - a.score)).map((row, index) => ({ ...row, rank: index + 1 }));
  }

  async function hashFile(file) {
    if (!window.crypto?.subtle) return `${file.name}-${file.size}`;
    const buffer = await file.arrayBuffer();
    const digest = await window.crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function parseKahootFile(file) {
    const parsed = file.name.toLowerCase().endsWith('.csv') ? await csvFile(file) : await xlsxFile(file);
    const rows = parseKahootRows(parsed.rows);
    const fileHash = await hashFile(file);
    const detectedTitle = parsed.detectedTitle || file.name.replace(/\.[^.]+$/, '');
    return { rows, detectedTitle, fileHash };
  }

  window.DinoCupParser = { parseKahootFile, parseKahootRows, cleanNumber, findHeader, hashFile };
})();
