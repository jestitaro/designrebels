# Supabase · Este año, sin prompt

Toda la lógica sensible vive en el servidor. El frontend no lee ni escribe tablas: solo llama funciones RPC `security definer` que validan identidad, asignación, permisos y privacidad. Las tablas tienen RLS activo y sin políticas de acceso directo.

## Puesta en marcha

1. Crear proyecto en Supabase.
2. SQL Editor → ejecutar `schema.sql`.
3. Cargar el equipo real en `participants` (nombre, rol, `role_key`, mail).
4. Ejecutar **una sola vez** con service role: `select public.generate_assignments();`
5. Auth → Providers → Email: habilitar magic link. Auth → URL Configuration: agregar la URL del sitio (p. ej. `https://jestitaro.github.io/designrebels/projects/sin-prompt/`) a Redirect URLs.
6. En `source/.env`: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. `npm run build`.

## Qué valida el servidor

| Regla | Dónde |
|---|---|
| Solo entra quien tiene su mail en `participants` | `claim_me()` |
| Sorteo global único, en un ciclo: nadie se toca, todos dan y reciben uno | `generate_assignments()` (no ejecutable por usuarios) |
| El saludo del destino solo puede ir a la persona asignada | `send_postcard()` |
| Un saludo por tipo y persona; no a uno mismo; largo 12–600 | `send_postcard()` + constraints |
| El segundo saludo requiere haber enviado el primero | `send_postcard()` |
| Privadas: solo remitente y destinatario | `get_my_messages()`, `public_gallery()`, storage |
| Árbol: las privadas no revelan nombres | `tree_state()` |
| Tiempo del juego medido en el servidor, mínimo 8 s, guarda el mejor | `start_game()` / `finish_game()` |
| Dibujos: cada uno sube solo a su carpeta; se leen si podés ver la postal | políticas de `storage.objects` |

El esquema se probó contra Postgres 16 con un shim de `auth`/`storage`: sorteo, identificación, permisos, duplicados, privacidad y tiempos se comportan como dice la tabla.

## Pendiente antes de producción

- Probar end-to-end contra un proyecto Supabase real (el adaptador `source/src/lib/api/supabase.js` está escrito pero no se ejecutó contra un backend real).
- Limpieza de dibujos huérfanos (subidos pero cuyo envío falló).
- El Realtime para ver crecer el árbol en vivo es opcional: hoy se refresca al entrar a la pantalla.
