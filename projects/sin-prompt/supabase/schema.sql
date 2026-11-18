-- ═══════════════════════════════════════════════════════════════════════════
-- Este año, sin prompt · QuartzSales 2026 · Esquema Supabase
--
-- Principio: el cliente NO toca tablas directamente. Todo pasa por funciones
-- RPC `security definer` que validan identidad, asignación, permisos y
-- privacidad del lado del servidor. Las tablas tienen RLS activo y ninguna
-- política de acceso directo para `anon` ni `authenticated`.
--
-- Orden de uso:
--   1. Ejecutar este archivo en el SQL Editor.
--   2. Cargar participantes (ver seed al final, comentado).
--   3. Ejecutar UNA vez, como service role:  select public.generate_assignments();
--   4. Configurar Auth → Email (magic link) y la URL del sitio en Redirect URLs.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists citext;

-- ── Tablas ─────────────────────────────────────────────────────────────────
create table if not exists public.participants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null,
  role_key   text not null default 'other',
  email      citext not null unique,          -- mail habilitado para entrar
  user_id    uuid unique references auth.users(id) on delete set null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  giver_id    uuid primary key references public.participants(id) on delete cascade,
  receiver_id uuid not null unique references public.participants(id) on delete cascade,
  created_at  timestamptz not null default now(),
  check (giver_id <> receiver_id)
);

create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.participants(id) on delete cascade,
  recipient_id  uuid not null references public.participants(id) on delete cascade,
  slot          text not null check (slot in ('destino', 'eleccion')),
  kind          text not null check (kind in ('design', 'drawing')),
  design_id     text,
  drawing_path  text,
  body          text not null check (char_length(btrim(body)) between 12 and 600),
  visibility    text not null default 'private' check (visibility in ('private', 'public')),
  created_at    timestamptz not null default now(),
  read_at       timestamptz,
  unique (sender_id, slot),                    -- un saludo por tipo y persona
  check (sender_id <> recipient_id),
  check ((kind = 'design' and design_id is not null) or (kind = 'drawing' and drawing_path is not null))
);
create index if not exists messages_recipient_idx on public.messages (recipient_id);
create index if not exists messages_public_idx on public.messages (visibility, created_at desc);

create table if not exists public.game_runs (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  started_at     timestamptz not null default now(),
  finished_at    timestamptz
);

create table if not exists public.scores (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  best_ms        integer not null check (best_ms > 0),
  updated_at     timestamptz not null default now()
);

alter table public.participants enable row level security;
alter table public.assignments  enable row level security;
alter table public.messages     enable row level security;
alter table public.game_runs    enable row level security;
alter table public.scores       enable row level security;
-- Sin políticas: nadie lee ni escribe tablas directo. Solo las RPC de abajo.
revoke all on public.participants, public.assignments, public.messages, public.game_runs, public.scores from anon, authenticated;

-- ── Helpers ────────────────────────────────────────────────────────────────
create or replace function public.current_participant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from participants where user_id = auth.uid() and active
$$;

create or replace function public.require_me()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare me uuid := public.current_participant_id();
begin
  if me is null then raise exception 'Primero tenés que identificarte.' using errcode = '28000'; end if;
  return me;
end $$;

create or replace function public.participant_json(p public.participants)
returns json language sql immutable as $$
  select json_build_object('id', p.id, 'name', p.name, 'role', p.role, 'role_key', p.role_key)
$$;

create or replace function public.message_json(m public.messages)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', m.id, 'slot', m.slot, 'sender_id', m.sender_id, 'recipient_id', m.recipient_id,
    'sender', (select participant_json(s) from participants s where s.id = m.sender_id),
    'recipient', (select participant_json(r) from participants r where r.id = m.recipient_id),
    'kind', m.kind, 'design_id', m.design_id, 'drawing_path', m.drawing_path,
    'body', m.body, 'visibility', m.visibility, 'created_at', m.created_at, 'read_at', m.read_at)
$$;

-- ── Identidad ──────────────────────────────────────────────────────────────
-- Vincula el usuario autenticado (mail verificado por magic link) con su fila.
create or replace function public.claim_me()
returns json language plpgsql security definer set search_path = public as $$
declare mail text := auth.jwt() ->> 'email'; p participants;
begin
  if auth.uid() is null then raise exception 'Sesión inválida.' using errcode = '28000'; end if;
  update participants set user_id = auth.uid()
    where email = mail::citext and user_id is null and active;
  select * into p from participants where user_id = auth.uid() and active;
  if not found then
    raise exception 'Tu mail no está en el listado de QuartzSales. Hablá con quien organiza.' using errcode = '42501';
  end if;
  return participant_json(p);
end $$;

create or replace function public.list_participants()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  perform require_me();
  return coalesce((select json_agg(participant_json(p) order by p.name) from participants p where p.active), '[]'::json);
end $$;

-- ── Sorteo (una sola vez, global) ──────────────────────────────────────────
-- Un único ciclo aleatorio: nadie se toca, todos dan y reciben exactamente uno.
create or replace function public.generate_assignments()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if exists (select 1 from assignments) then
    raise exception 'El sorteo ya se hizo. Para rehacerlo, vaciá assignments a mano (y avisá).';
  end if;
  with ordered as (
    select id, row_number() over (order by random()) as rn, count(*) over () as total
    from participants where active
  )
  insert into assignments (giver_id, receiver_id)
  select a.id, b.id from ordered a join ordered b on b.rn = (a.rn % a.total) + 1;
  get diagnostics n = row_count;
  if n < 2 then raise exception 'Hacen falta al menos 2 participantes.'; end if;
  return n;
end $$;
revoke execute on function public.generate_assignments() from public, anon, authenticated;

create or replace function public.get_my_assignment()
returns json language plpgsql stable security definer set search_path = public as $$
declare me uuid := require_me(); p participants;
begin
  select pr.* into p from assignments a join participants pr on pr.id = a.receiver_id where a.giver_id = me;
  if not found then return null; end if;
  return participant_json(p);
end $$;

-- ── Postales ───────────────────────────────────────────────────────────────
create or replace function public.send_postcard(
  p_slot text, p_recipient_id uuid, p_kind text, p_design_id text,
  p_drawing_path text, p_body text, p_visibility text)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := require_me(); assigned uuid; m messages;
begin
  if p_slot not in ('destino', 'eleccion') then raise exception 'Tipo de saludo inválido.'; end if;
  if p_recipient_id = me then raise exception 'No podés mandarte una postal a vos.'; end if;
  if not exists (select 1 from participants where id = p_recipient_id and active) then
    raise exception 'Esa persona no está en el listado.';
  end if;
  if p_slot = 'destino' then
    select receiver_id into assigned from assignments where giver_id = me;
    if assigned is null or assigned <> p_recipient_id then
      raise exception 'El destino ya eligió por vos. Este saludo va para otra persona.';
    end if;
  end if;
  if p_slot = 'eleccion' and not exists (select 1 from messages where sender_id = me and slot = 'destino') then
    raise exception 'Primero mandá el saludo del destino.';
  end if;
  if char_length(btrim(coalesce(p_body, ''))) < 12 then raise exception 'Escribí al menos 12 caracteres.'; end if;
  if char_length(btrim(p_body)) > 600 then raise exception 'Máximo 600 caracteres.'; end if;
  if p_kind not in ('design', 'drawing') then raise exception 'Formato de postal inválido.'; end if;
  if p_kind = 'design' and coalesce(p_design_id, '') = '' then raise exception 'Elegí una postal.'; end if;
  if p_kind = 'drawing' and (p_drawing_path is null or split_part(p_drawing_path, '/', 1) <> me::text) then
    raise exception 'Dibujo inválido.';
  end if;
  insert into messages (sender_id, recipient_id, slot, kind, design_id, drawing_path, body, visibility)
  values (me, p_recipient_id, p_slot, p_kind,
          case when p_kind = 'design' then p_design_id end,
          case when p_kind = 'drawing' then p_drawing_path end,
          btrim(p_body), case when p_visibility = 'public' then 'public' else 'private' end)
  returning * into m;
  return message_json(m);
exception when unique_violation then
  raise exception 'Ya enviaste este saludo.';
end $$;

create or replace function public.get_my_messages()
returns json language plpgsql stable security definer set search_path = public as $$
declare me uuid := require_me();
begin
  return json_build_object(
    'sent', coalesce((select json_agg(message_json(m) order by m.created_at) from messages m where m.sender_id = me), '[]'::json),
    'received', coalesce((select json_agg(message_json(m) order by m.created_at desc) from messages m where m.recipient_id = me), '[]'::json));
end $$;

create or replace function public.mark_read(p_message_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update messages set read_at = coalesce(read_at, now())
  where id = p_message_id and recipient_id = require_me();
end $$;

-- Galería: SOLO públicas. Las privadas no salen por ninguna RPC salvo a su
-- remitente y su destinatario (get_my_messages).
create or replace function public.public_gallery()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  perform require_me();
  return coalesce((select json_agg(message_json(m) order by m.created_at desc) from messages m where m.visibility = 'public'), '[]'::json);
end $$;

-- Árbol: una pieza por mensaje. Las privadas no revelan nombres.
create or replace function public.tree_state()
returns json language plpgsql stable security definer set search_path = public as $$
declare me uuid := require_me();
begin
  return json_build_object(
    'total', (select count(*) * 2 from participants where active),
    'pieces', coalesce((
      select json_agg(json_build_object(
        'id', m.id, 'visibility', m.visibility, 'mine', m.sender_id = me,
        'from_name', case when m.visibility = 'public' then s.name end,
        'to_name',   case when m.visibility = 'public' then r.name end) order by m.created_at)
      from messages m join participants s on s.id = m.sender_id join participants r on r.id = m.recipient_id), '[]'::json));
end $$;

-- ── Minijuego: el tiempo lo mide el servidor ───────────────────────────────
create or replace function public.start_game()
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := require_me(); rid uuid;
begin
  delete from game_runs where participant_id = me and finished_at is null;
  insert into game_runs (participant_id) values (me) returning id into rid;
  return rid;
end $$;

create or replace function public.finish_game(p_run_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := require_me(); r game_runs; ms integer; prev integer; pos integer; n integer;
begin
  select * into r from game_runs where id = p_run_id and participant_id = me and finished_at is null for update;
  if not found then raise exception 'Esta partida no es válida. Probá de nuevo.'; end if;
  update game_runs set finished_at = now() where id = r.id;
  ms := (extract(epoch from (now() - r.started_at)) * 1000)::integer;
  if ms < 8000 then raise exception 'Eso fue demasiado rápido para ser humano.'; end if;
  if ms > 15 * 60 * 1000 then raise exception 'La partida venció. Probá de nuevo.'; end if;
  select best_ms into prev from scores where participant_id = me;
  insert into scores (participant_id, best_ms) values (me, ms)
  on conflict (participant_id) do update set best_ms = least(scores.best_ms, excluded.best_ms),
    updated_at = case when excluded.best_ms < scores.best_ms then now() else scores.updated_at end;
  select count(*) + 1 into pos from scores where best_ms < (select best_ms from scores where participant_id = me);
  select count(*) into n from scores;
  return json_build_object('ms', ms, 'best_ms', least(coalesce(prev, ms), ms), 'improved', prev is null or ms < prev, 'rank', pos, 'total', n);
end $$;

create or replace function public.leaderboard()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  perform require_me();
  return coalesce((select json_agg(json_build_object('participant', participant_json(p), 'best_ms', s.best_ms) order by s.best_ms)
                   from scores s join participants p on p.id = s.participant_id), '[]'::json);
end $$;

-- Permisos de ejecución: solo usuarios autenticados.
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.claim_me(), public.list_participants(), public.get_my_assignment(),
  public.send_postcard(text, uuid, text, text, text, text, text), public.get_my_messages(),
  public.mark_read(uuid), public.public_gallery(), public.tree_state(),
  public.start_game(), public.finish_game(uuid), public.leaderboard()
to authenticated;
-- Las políticas de storage la usan con los permisos del usuario.
grant execute on function public.current_participant_id() to authenticated;

-- ── Storage: dibujos ───────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('drawings', 'drawings', false)
on conflict (id) do nothing;

-- Subir: solo a tu propia carpeta ({participant_id}/archivo.png).
create policy "drawings_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'drawings' and (storage.foldername(name))[1] = public.current_participant_id()::text);

-- Leer: si sos remitente, destinatario, o la postal es pública.
create policy "drawings_read_allowed" on storage.objects for select to authenticated
using (
  bucket_id = 'drawings' and (
    (storage.foldername(name))[1] = public.current_participant_id()::text
    or exists (
      select 1 from public.messages m
      where m.drawing_path = storage.objects.name
        and (m.visibility = 'public' or m.recipient_id = public.current_participant_id())
    )
  )
);

-- ── Seed (ejemplo, reemplazar por el equipo real) ──────────────────────────
-- insert into public.participants (name, role, role_key, email) values
--   ('Nombre Apellido', 'Development', 'dev', 'nombre@quartzsales.com'),
--   ...;
-- select public.generate_assignments();   -- como service role, una sola vez
