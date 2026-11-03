import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES } from '../../data/defaults';
import type { Catalog } from '../../hooks/useData';
import { expandEvents, occurrencesByDay } from '../../lib/recurrence';
import { parseISO } from '../../lib/dates';
import { makeEvent } from '../../test/factories';
import type { ISODate } from '../../types';
import { MonthGrid } from './MonthGrid';

const catalog: Catalog = {
  categories: DEFAULT_CATEGORIES,
  countries: [],
  categoryById: new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c])),
  countryById: new Map(),
  placeName: () => undefined,
};

function Harness({ initial = '2026-11-10' }: { initial?: ISODate }) {
  const [selected, setSelected] = useState(initial);
  const { y, m } = parseISO(selected);
  const events = [makeEvent({ title: 'Día de la Tradición', startDate: '2026-11-10', relevance: 'alta' })];
  const byDay = occurrencesByDay(expandEvents(events, '2026-09-01', '2027-02-28'), '2026-09-01', '2027-02-28');
  return (
    <>
      <h1 id="t">
        {m}/{y}
      </h1>
      <MonthGrid year={y} month={m} byDay={byDay} selected={selected} today="2026-11-03" catalog={catalog} labelledBy="t" onSelect={setSelected} />
    </>
  );
}

describe('MonthGrid', () => {
  it('expone una grilla con encabezados que empiezan el lunes', () => {
    render(<Harness />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers[0]).toHaveAccessibleName('Lunes');
    expect(headers[6]).toHaveAccessibleName('Domingo');
    expect(screen.getByRole('grid')).toHaveAccessibleName('11/2026');
  });

  it('describe los eventos del día en la etiqueta de la celda', () => {
    render(<Harness />);
    expect(screen.getByRole('gridcell', { name: /martes 10 de noviembre: 1 evento, 1 de relevancia alta/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('gridcell', { name: /^Hoy, martes 3 de noviembre/ })).toHaveAttribute('aria-current', 'date');
  });

  it('se navega con flechas, Inicio/Fin y cambia de mes con RePág/AvPág', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const cell = screen.getByRole('gridcell', { name: /martes 10 de noviembre/ });
    cell.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-11');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-18');
    await user.keyboard('{Home}');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-16');
    await user.keyboard('{End}');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-22');
    await user.keyboard('{PageDown}');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-12-22');
    expect(screen.getByRole('heading')).toHaveTextContent('12/2026');
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-24');
  });

  it('solo una celda está en el orden de tabulación', () => {
    render(<Harness />);
    const tabbable = screen.getAllByRole('gridcell').filter((c) => c.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });
});
