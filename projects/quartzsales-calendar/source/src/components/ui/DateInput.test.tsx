import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DateInput } from './DateInput';

function Harness({ initial = '' }: { initial?: string }) {
  const [v, setV] = useState(initial);
  return (
    <>
      <DateInput aria-label="Fecha" value={v} onChange={setV} />
      <output data-testid="value">{v}</output>
    </>
  );
}

describe('DateInput', () => {
  it('muestra el valor en dd/mm/aaaa', () => {
    render(<Harness initial="2026-11-10" />);
    expect(screen.getByLabelText('Fecha')).toHaveValue('10/11/2026');
  });

  it('acepta dígitos y agrega las barras', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText('Fecha'), '05112026');
    expect(screen.getByLabelText('Fecha')).toHaveValue('05/11/2026');
    expect(screen.getByTestId('value')).toHaveTextContent('2026-11-05');
  });

  it('marca como inválida una fecha imposible', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText('Fecha'), '31/02/2026');
    expect(screen.getByTestId('value')).toHaveTextContent('invalid');
  });
});
