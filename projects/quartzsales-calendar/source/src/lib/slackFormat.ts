export type SlackToken =
  | { type: 'text'; text: string }
  | { type: 'bold' | 'italic' | 'strike' | 'code'; text: string }
  | { type: 'break' };

const MARKS: Record<string, 'bold' | 'italic' | 'strike' | 'code'> = { '*': 'bold', _: 'italic', '~': 'strike', '`': 'code' };
// Marca de apertura al inicio o después de espacio/puntuación; cierre antes de espacio/puntuación o final.
const INLINE = /(^|[\s(¿¡"'])([*_~`])(?=\S)(.+?)(?<=\S)\2(?=$|[\s.,;:!?)"'])/gu;

/** Tokeniza texto con formato tipo Slack: *negrita*, _cursiva_, ~tachado~, `código`. */
export function parseSlack(text: string): SlackToken[] {
  const tokens: SlackToken[] = [];
  text.split('\n').forEach((line, i) => {
    if (i > 0) tokens.push({ type: 'break' });
    let last = 0;
    for (const match of line.matchAll(INLINE)) {
      const [, lead = '', mark = '', inner = ''] = match;
      const start = (match.index ?? 0) + lead.length;
      if (start > last) tokens.push({ type: 'text', text: line.slice(last, start) });
      tokens.push({ type: MARKS[mark]!, text: inner });
      last = start + mark.length * 2 + inner.length;
    }
    if (last < line.length) tokens.push({ type: 'text', text: line.slice(last) });
  });
  return tokens;
}

/** Cantidad de caracteres visibles (emojis compuestos cuentan como 1). */
export function countCharacters(text: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    let n = 0;
    for (const _ of new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(text)) n++;
    return n;
  }
  return Array.from(text).length;
}
