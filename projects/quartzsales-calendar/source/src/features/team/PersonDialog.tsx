import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { addVacation, createPerson, deletePerson, deleteVacation, updatePerson } from '../../db/team';
import { useCatalog, useVacations } from '../../hooks/useData';
import { formatRange, isValidISODate } from '../../lib/dates';
import { DEFAULT_AREAS, initials } from '../../lib/team';
import type { Person, PersonRole } from '../../types';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DateInput } from '../../components/ui/DateInput';
import { Modal } from '../../components/ui/Dialog';
import { Checkbox, Field, Input, Select } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';

interface Props {
  open: boolean;
  person: Person | null;
  onClose: () => void;
}

/** Alta y edición de una persona del equipo, con sus vacaciones. */
export function PersonDialog({ open, person, onClose }: Props) {
  const catalog = useCatalog();
  const vacations = useVacations() ?? [];
  const toast = useToast();
  const [name, setName] = useState('');
  const [initialsText, setInitialsText] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [active, setActive] = useState(true);
  const [roles, setRoles] = useState<PersonRole[]>([]);
  const [vacStart, setVacStart] = useState('');
  const [vacEnd, setVacEnd] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(person?.name ?? '');
    setInitialsText(person?.initials ?? '');
    setCountry(person?.country ?? 'ar');
    setRegion(person?.region ?? '');
    setCity(person?.city ?? '');
    setActive(person?.active ?? true);
    setRoles(person?.roles.length ? person.roles : [{ area: '', title: '' }]);
    setVacStart('');
    setVacEnd('');
    setErrors({});
  }, [open, person]);

  const countryObj = catalog.countryById.get(country);
  const myVacations = person ? vacations.filter((v) => v.personId === person.id).sort((a, b) => a.start.localeCompare(b.start)) : [];

  async function save() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Escribí el nombre.';
    if (!country) errs.country = 'Elegí un país.';
    const cleanRoles = roles.map((r) => ({ area: r.area.trim(), title: r.title.trim() })).filter((r) => r.area || r.title);
    if (cleanRoles.length === 0) errs.roles = 'Agregá al menos un puesto.';
    if (cleanRoles.some((r) => !r.area)) errs.roles = 'Cada puesto necesita un área.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const data = { name: name.trim(), initials: initialsText.trim().toUpperCase() || undefined, country, region: region || undefined, city: city.trim() || undefined, active, roles: cleanRoles };
    if (person) await updatePerson(person.id, data);
    else await createPerson(data);
    toast.success(person ? 'Cambios guardados.' : 'Persona agregada.');
    onClose();
  }

  async function addVac() {
    if (!person) return;
    if (!isValidISODate(vacStart) || !isValidISODate(vacEnd) || vacEnd < vacStart) {
      setErrors({ vac: 'Indicá desde y hasta (dd/mm/aaaa), con el fin después del inicio.' });
      return;
    }
    await addVacation({ personId: person.id, start: vacStart, end: vacEnd });
    setVacStart('');
    setVacEnd('');
    setErrors({});
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={person ? `Editar a ${person.name}` : 'Agregar persona'}
        footer={
          <>
            {person && <Button variant="danger-ghost" icon={Trash2} onClick={() => setConfirmDelete(true)} className="mr-auto">Eliminar</Button>}
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={() => void save()}>{person ? 'Guardar' : 'Agregar'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <Field label="Nombre" required error={errors.name}>
              {(p) => <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={name} onChange={(e) => setName(e.target.value)} data-autofocus />}
            </Field>
            <Field label="Iniciales">
              {(p) => <Input id={p.id} value={initialsText} maxLength={3} placeholder={initials(name || ' ')} onChange={(e) => setInitialsText(e.target.value)} />}
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="País" required error={errors.country}>
              {(p) => (
                <Select id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={country} onChange={(e) => { setCountry(e.target.value); setRegion(''); }}>
                  {catalog.countries.filter((c) => c.id !== 'intl').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Provincia o región">
              {(p) => (
                <Select id={p.id} value={region} onChange={(e) => setRegion(e.target.value)} disabled={!countryObj?.regions.length}>
                  <option value="">—</option>
                  {countryObj?.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Ciudad">
              {(p) => <Input id={p.id} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej. Temperley" />}
            </Field>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[13px] font-bold">Puestos</legend>
            <datalist id="qs-areas">{DEFAULT_AREAS.map((a) => <option key={a} value={a} />)}</datalist>
            {roles.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <Field label={`Área ${i + 1}`} hideLabel={i > 0}>
                  {(p) => <Input id={p.id} list="qs-areas" value={r.area} placeholder="Área" onChange={(e) => setRoles(roles.map((x, j) => (j === i ? { ...x, area: e.target.value } : x)))} />}
                </Field>
                <Field label={`Puesto ${i + 1}`} hideLabel={i > 0}>
                  {(p) => <Input id={p.id} value={r.title} placeholder="Puesto" onChange={(e) => setRoles(roles.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />}
                </Field>
                <IconButton icon={Trash2} label={`Quitar puesto ${i + 1}`} variant="danger-ghost" disabled={roles.length === 1}
                  onClick={() => setRoles(roles.filter((_, j) => j !== i))} />
              </div>
            ))}
            {errors.roles && <p role="alert" className="text-xs font-bold text-danger-fg">{errors.roles}</p>}
            <div>
              <Button size="sm" variant="ghost" icon={Plus} onClick={() => setRoles([...roles, { area: '', title: '' }])}>Agregar puesto</Button>
            </div>
          </fieldset>

          <Checkbox label="Activo en el equipo" description="Si lo desactivás, deja de aparecer en saludos, feriados y vacaciones." checked={active} onChange={(e) => setActive(e.target.checked)} />

          {person && (
            <fieldset className="flex flex-col gap-2 border-t border-border pt-4">
              <legend className="mb-1 text-[13px] font-bold">Vacaciones</legend>
              {myVacations.length === 0 ? (
                <p className="text-[13px] text-muted">Sin vacaciones cargadas.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border rounded border border-border">
                  {myVacations.map((v) => (
                    <li key={v.id} className="flex items-center gap-2 px-3 py-1.5 text-[13px]">
                      <span className="flex-1">{formatRange(v.start, v.end)}</span>
                      <IconButton icon={Trash2} size="sm" variant="danger-ghost" label={`Quitar vacaciones ${formatRange(v.start, v.end)}`} onClick={() => void deleteVacation(v.id)} />
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <Field label="Desde">{(p) => <DateInput id={p.id} value={vacStart} onChange={setVacStart} />}</Field>
                <Field label="Hasta">{(p) => <DateInput id={p.id} value={vacEnd} min={vacStart} onChange={setVacEnd} />}</Field>
                <Button icon={Plus} onClick={() => void addVac()}>Sumar</Button>
              </div>
              {errors.vac && <p role="alert" className="text-xs font-bold text-danger-fg">{errors.vac}</p>}
            </fieldset>
          )}
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title={`¿Eliminar a ${person?.name ?? ''}?`}
        description="Se borra del equipo junto con sus vacaciones. Si solo se fue por un tiempo, desactivalo."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          if (person) await deletePerson(person.id);
          toast.success('Persona eliminada.');
          onClose();
        }}
      />
    </>
  );
}
