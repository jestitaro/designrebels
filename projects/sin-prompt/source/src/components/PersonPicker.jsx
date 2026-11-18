import { useId, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { initials } from '../config/participants.js';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Selector de personas con buscador. Navegable con teclado (radiogroup):
 * Tab entra a la lista, flechas recorren, Enter/Espacio elige.
 */
export default function PersonPicker({ people, value, onChange, exclude = [], label = 'Buscá por nombre o rol', disabledIds = {}, autoFocus }) {
  const [q, setQ] = useState('');
  const id = useId();
  const list = useMemo(() => {
    const nq = norm(q.trim());
    return people
      .filter((p) => !exclude.includes(p.id))
      .filter((p) => !nq || norm(p.name).includes(nq) || norm(p.role).includes(nq));
  }, [people, q, exclude]);

  const onKey = (e, idx) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      document.getElementById(`${id}-${Math.min(list.length - 1, idx + 1)}`)?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (idx === 0) document.getElementById(`${id}-q`)?.focus();
      else document.getElementById(`${id}-${idx - 1}`)?.focus();
    }
  };

  return (
    <div className="picker">
      <label className="picker-search" htmlFor={`${id}-q`}>
        <Icon name="search" />
        <span className="sr-only">{label}</span>
        <input
          id={`${id}-q`}
          type="search"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder={label}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              document.getElementById(`${id}-0`)?.focus();
            }
          }}
        />
      </label>
      <div className="picker-list" role="radiogroup" aria-label="Personas de QuartzSales">
        {list.length === 0 && (
          <p className="empty-inline">Nadie con ese nombre por acá. ¿Probás con el apellido o el rol?</p>
        )}
        {list.map((p, i) => {
          const selected = value === p.id;
          const note = disabledIds[p.id];
          return (
            <button
              key={p.id}
              id={`${id}-${i}`}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`person ${selected ? 'is-selected' : ''}`}
              onClick={() => onChange(p.id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <span className="avatar" aria-hidden="true">{initials(p.name)}</span>
              <span className="person-txt">
                <strong>{p.name}</strong>
                <span>{p.role}{note ? ` · ${note}` : ''}</span>
              </span>
              <span className="person-check" aria-hidden="true">
                <Icon name="check" size={16} stroke={2.4} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
