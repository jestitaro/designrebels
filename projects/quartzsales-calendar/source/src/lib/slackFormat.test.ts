import { describe, expect, it } from 'vitest';
import { countCharacters, parseSlack } from './slackFormat';

describe('formato tipo Slack', () => {
  it('reconoce negrita, cursiva, tachado y código', () => {
    expect(parseSlack('Hola *equipo* _lindo_ ~feo~ `x`')).toEqual([
      { type: 'text', text: 'Hola ' },
      { type: 'bold', text: 'equipo' },
      { type: 'text', text: ' ' },
      { type: 'italic', text: 'lindo' },
      { type: 'text', text: ' ' },
      { type: 'strike', text: 'feo' },
      { type: 'text', text: ' ' },
      { type: 'code', text: 'x' },
    ]);
  });

  it('respeta los saltos de línea', () => {
    expect(parseSlack('a\n\nb')).toEqual([{ type: 'text', text: 'a' }, { type: 'break' }, { type: 'break' }, { type: 'text', text: 'b' }]);
  });

  it('no formatea asteriscos sueltos ni palabras con guion bajo', () => {
    expect(parseSlack('2 * 3 = 6 y mi_variable_x')).toEqual([{ type: 'text', text: '2 * 3 = 6 y mi_variable_x' }]);
  });

  it('acepta puntuación pegada', () => {
    expect(parseSlack('¡*Feliz día*!')).toEqual([{ type: 'text', text: '¡' }, { type: 'bold', text: 'Feliz día' }, { type: 'text', text: '!' }]);
  });

  it('cuenta emojis como un carácter', () => {
    expect(countCharacters('🧉👩‍💻 ok')).toBe(5);
  });
});
