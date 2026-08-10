# Talent Lab · by QuartzSales

Landing + app funcional para que cada equipo de QuartzSales tenga su propio "Lab": sube actualizaciones de lo que está construyendo y el resto de la compañía deja feedback y valoraciones — estilo cafecito, pero para ideas y proyectos internos.

## Arquitectura

Mismo patrón que Dino Cup (`projects/qs-league`): un proyecto Firebase propio y dedicado, sin capas de admin separadas — cualquier usuario autenticado puede crear su Lab, publicar actualizaciones en el que le pertenece, y dejar feedback en cualquiera.

```
projects/talent-lab/
├── index.html          landing pública + vista de detalle de Lab (SPA con router por hash) + modales (login/signup, crear Lab, nueva actualización)
├── firebase.json        apunta a firestore.rules
├── .firebaserc            proyecto default: talent-lab-quartzsales
├── firestore.rules       reglas completas del proyecto talent-lab-quartzsales
├── README.md              este archivo
└── assets/
    ├── firebase.js         Auth + Firestore (compat SDK) — window.TalentLabFirebase
    ├── app.js               toda la UI: routing, render, formularios, eventos
    └── styles.css           un solo stylesheet, reutiliza los tokens de color de Design Rebels (--purple/--coral/--mint/--blue/--yellow, tipografía Manrope)
```

No hay separación público/admin como en Dino Cup: acá todos los usuarios autenticados tienen los mismos permisos (crear su propio Lab, publicar en el que les pertenece, opinar en cualquiera).

## Modelo de datos (Firestore, proyecto `talent-lab-quartzsales`)

```
talentlab_profiles   {uid, email, displayName, createdAt} — cada usuario crea/edita solo el suyo, lectura pública
talentlab_labs       {id, ownerUid, ownerName, name, tagline, description, category, links[], createdAt, updatedAt}
talentlab_updates    {id, labId, authorUid, authorName, title, body, createdAt} — solo el dueño del Lab puede crear
talentlab_feedback   {id, labId, updateId, authorUid, authorName, rating(1-5), comment, createdAt}
```

Los ratings **nunca se guardan cacheados**: el promedio de cada actualización y de cada Lab se recalcula en el cliente sumando `talentlab_feedback` cada vez que se pinta la pantalla (mismo principio que el ranking de Dino Cup). En v1 nada se edita ni se borra desde el cliente — ver "Pendiente" más abajo.

`firestore.rules` es la fuente de verdad de estos permisos (usa `get()` sobre `talentlab_labs` para verificar que quien publica una actualización sea el dueño del Lab).

## Puesta en marcha (pasos manuales, fuera de este repo)

Este código está listo pero necesita un proyecto Firebase real conectado. Nadie con acceso a este repo puede crear ni configurar ese proyecto por vos — son pasos que hace una persona con cuenta de Firebase:

1. **Crear el proyecto** en [Firebase Console](https://console.firebase.google.com/) → nombre sugerido `talent-lab-quartzsales` (o el que prefieras, pero actualizá `.firebaserc` y `assets/firebase.js` con el nombre real).
2. **Habilitar Authentication** → método Email/contraseña.
3. **Habilitar Firestore** (modo producción).
4. **Desplegar las reglas**: con el [Firebase CLI](https://firebase.google.com/docs/cli) instalado, `firebase login`, y desde `projects/talent-lab/`:
   ```
   firebase deploy --only firestore:rules
   ```
5. **Copiar la config real** desde Firebase Console (Configuración del proyecto → tus apps → SDK setup) y reemplazar los valores `REEMPLAZAR_*` en `assets/firebase.js` (`apiKey`, `messagingSenderId`, `appId`).
6. **Cargar el primer Lab de verdad**: una vez desplegado, entrar a la app, crear una cuenta, y usar el botón "Crear mi Lab" para dar de alta **Talent Games by Design Rebels** (nombre, resumen, descripción, y como enlaces: `Jugar Dino Chomp :: ../dino-chomp/`, `Jugar Dino Escape :: ../dino-escape/`, `Jugar Meteorito Run :: ../meteorito-run/`, todos ya publicados en este mismo repo). No hay seed automático por código a propósito — ver nota abajo.

### Por qué no hay un Lab "sembrado" por código

Dino Cup tuvo un bug real (ver `../qs-league/HANDOFF.md`) donde un seed automático se re-ejecutaba en cada login y resucitaba datos borrados a mano. Para no repetir ese patrón, acá el primer Lab (Talent Games) se crea a mano, una sola vez, desde la propia UI ya en producción — se vuelve un dato real más, dueño de una cuenta real, sin ninguna lógica especial en el código que pueda resucitarlo o pisarlo.

## Pendiente

- Editar o borrar Labs/actualizaciones/feedback (hoy es todo de solo-creación, igual que el ledger de Dino Cup).
- Imágenes en las actualizaciones (v1 es solo texto — evita la complejidad de Storage hasta que haga falta).
- Restringir el signup a dominios de email de QuartzSales (hoy cualquier email puede crear cuenta; se puede agregar una validación en `firestore.rules` sobre `request.auth.token.email` si hace falta).
- Notificaciones cuando alguien deja feedback en tu Lab.
- Confirmar que `firestore.rules` esté desplegado en el proyecto real (paso 4 arriba).
