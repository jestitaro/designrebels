# QuartzSales Calendar

App personal para planificar las comunicaciones internas de QuartzSales: fechas especiales por país y región, saludos para el equipo y recordatorios. Funciona 100% en el navegador (sin backend, sin login, sin servicios externos).

Publicada en `/projects/quartzsales-calendar/` del sitio de Design Rebels.

> Estado: en desarrollo (fase 1 de 4). El README completo de uso, deploy y respaldos llega en la fase 4.

## Estructura

```text
projects/quartzsales-calendar/
├── index.html, assets/   ← build publicado (generado, no editar a mano)
├── README.md
└── source/               ← código fuente (React + TypeScript + Vite)
```

## Desarrollo

```bash
cd projects/quartzsales-calendar/source
npm install
npm run dev      # servidor local con recarga
npm test         # tests
npm run build    # typecheck + build + copia a projects/quartzsales-calendar/
npm run preview  # sirve el repo en http://localhost:4173/projects/quartzsales-calendar/
```
