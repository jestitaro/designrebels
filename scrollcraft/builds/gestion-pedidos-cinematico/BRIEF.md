# BRIEF — QuartzSales · Gestión de pedidos (Order Entry), landing cinemática

Interviewed. Answers below are the user's own words (translated context added
in brackets only where needed for a reader who wasn't in the conversation).

## 1. Vibe + references

**Vibe:** Precisa, tecnológica, fluida, confiable y dinámica.

**References** (explicitly: for the *idea*, not to be copied literally):
- *Tron: Legacy* — for the idea of connections, flows and information journeys.
  Not a literal sci-fi aesthetic.
- *Portal / Aperture Science* — for the feeling of moving through a system where
  each stage has a clear function.
- Dieter Rams / Braun industrial design — for clarity, hierarchy, the sense
  that nothing is placed without a reason.

Explicit constraint: **keep the current QuartzSales visual universe** — lots of
white, violet as the protagonist, grids, real interfaces, floating elements.
**Not dark, not futuristic.**

## 2. Scroll journey (user's own sequence)

1. Understand immediately what the product does: take an order and carry it,
   controlled, all the way to the ERP.
2. Hero: the computer/product as the protagonist element, some system pieces
   floating around it, not overloaded.
3. Scroll "enters" how the product works: Pedido → Validaciones →
   Excepciones/Aprobación → Transmisión al ERP → Confirmación.
4. Benefits appear *tied to that journey*, not as five disconnected blocks.
5. Widen the lens: the same system serves different actors — equipo comercial,
   clientes, administración.
6. Last feeling: "Todo el proceso conectado. Una sola gestión."
7. Close on the Solicitar demo CTA.

## 3. Energy curve

Hero calm (time to understand, curiosity not anxiety) → energy rises entering
the order (rules, validations appear) → **peak between Validación → Aprobación
→ Transmisión al ERP** (connections, states changing, information moving,
small system responses) → resolution when the order lands in the ERP → energy
drops again for the roles section → clear CTA close.

`Calma → curiosidad → movimiento → intensidad → resolución → calma/CTA.`

## 4. Feeling curve (stage by stage) + the peak

| Stage | Felt line (user's words) |
|---|---|
| Hero | "Entiendo qué hace y parece fácil." |
| Primeros beneficios | "Ah, esto elimina varias cosas manuales." |
| Entrada al flujo | "Quiero ver qué pasa con este pedido." |
| Validaciones y excepciones | "El sistema está controlando todo esto por mí." |
| Aprobación | "Hay lógica detrás, no es solamente cargar un carrito." |
| Transmisión al ERP | "Ah, todo termina conectado automáticamente." |
| Final | "Esto me ahorra doble carga y me ordena todo el proceso." |

**The peak** (largest span, most asset budget): watching **one single order
travel through the whole system and finally land in the ERP** — spanning the
Validación → Aprobación → Transmisión al ERP acts.

**Tell-a-friend sentence:** "¿Viste cómo el pedido va pasando por todo el
proceso hasta llegar al ERP?"

## 5. Signature move (seed → built spec)

User's seed: **one order is born in the hero and stays with you through the
whole scroll.** Not a mockup swap between sections. It starts as a small
cart/card object and physically advances down the page: products get added,
validations appear, a rule trips an exception, it goes through approval, its
state changes, and it's finally absorbed/transmitted into the ERP. Alongside
it (their words): **a violet line/connection that keeps building itself as we
scroll**, acting as the through-line of the whole landing.

→ Built as: a single persistent order-card DOM element (`#pedido-token`),
positioned via `transform` off `--sc-p`, that mutates its own contents/state
classes per act (idle → items adding → flagged/exception → approved-stamp →
transmitting → confirmed), riding a violet SVG path (`stroke-dashoffset` driven
by scroll) that only ever grows, never resets. Full spec in the score table
below.

## 6. Aesthetic range

**Premium-minimal + playful tech**, explicitly not brutalist, not maximalist,
not a static corporate SaaS page. User's own split: **75% premium/minimal, 25%
playful/experimental.** Air, real typography, clean interfaces, few objects
per scene — but some elements carry movement, depth and personality.
Animation must serve the product story, never decorate for its own sake.

## 7. World structure

**Continuous world, organized in chapters** (not fully disconnected scenes,
not an infinite 3D flythrough either). User's own framing: **"recorrido 2.5D
por el producto, usando interfaces reales y profundidad sólo cuando aporte."**
Chapters: 01 Carga · 02 Validación · 03 Aprobación · 04 ERP · 05 Confirmación.
A chapter change may shift composition, scale, camera or motion, but something
always visually threads one scene to the next — that thread is the order
token + the violet line from §5.

## 8. Assets available

Real product assets, reused first (user's explicit priority order — real
before generated):
- `media/hero/*` — desktop mockup + floating slot mockups.
- `media/carga_guiada.png` — real photo, person using the app.
- `media/paso1.mp4` — real screen recording, "Carga" step.
- `media/flow/paso-2..5-*.png` — real screenshots: Validación, Aprobación,
  Transmisión al ERP, Confirmación.
- `media/icons/*v2.png` — controlv2, gestionv2, integracionv2, visibilidadv2.
- Real UI pieces obtainable by cropping the above: listado de pedidos,
  selector de cliente/sucursal, productos, carrito, resumen del pedido,
  estados, tipo de pedido especial/tradicional, validaciones,
  aprobación/excepciones, transmisión al ERP, notificaciones.

Explicit constraint: **no large new illustrations, nothing added just to fill
space.** Where the signature move needs a piece that does not exist as a
screenshot (the order token itself, in its five states; the connecting
line), build it as coded SVG/HTML in the brand's own tokens rather than
generating imagery — it must "feel like it's part of the QuartzSales product,
not a generic SaaS landing asset." **No `KIE_AI_API_KEY` is configured in this
environment**, which reinforces the same decision: this build does not call
the image/video generator. Everything is either a real existing asset or
coded UI in QuartzSales' own design tokens.

## Step 1 answers (not re-asked — clearly implied by the above, recorded here for the record)

- **What is this, who for:** QuartzSales Order Entry, a B2B SaaS module for
  taking and managing orders (from POS or sales team), wired live to an ERP
  (pricing, stock, running accounts, invoicing). For companies with a sales
  force, self-service clients, and an admin/back-office team who all touch
  the same order.
- **What the visitor must believe by the end:** the whole order process — from
  entry to ERP — is one connected, controlled system; nothing is manual,
  nothing is double-loaded.
- **The one action:** "Solicitar demo" (the label already used site-wide).

## Authored silence

The hero deliberately holds still for a beat after the headline resolves,
before the order token starts its first micro-move — the "curiosity, not
anxiety" the user asked for. That pause is intentional, not unfinished scroll.
