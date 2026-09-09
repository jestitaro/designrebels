# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| gestion-pedidos-cinematico | Guided process (custom: fixed process-nav with a live chapter/progress readout; ends on the process's own resolution, not a generic CTA slab; bans dark/futuristic worlds and disconnected-scene cuts) | Fixed top bar with wordmark + live "0N · Capítulo — N/05" chapter chip and progress fill, replacing per-act eyebrows | `pin` + parallax (layered product/chip planes, no video) | pin → flow+reveal → scrub → pin → flow+reveal(iris) → pin+spotlight(peak) → flow → pan → pin (9 acts, ~19vh total) | `pin`, last-element-on-page, solid violet gradient stage (brand's own CTA gradient), one-value hold cue, footer inside the stage | A single persistent order-card (`#qs-token`) fixed beside a self-drawing violet SVG line (`stroke-dashoffset` off real scroll position across the 5 process chapters), mutating state (idle→loading→checking→flag→approved→sending→done) as the reader passes each chapter; mobile collapses to a bottom progress pill | 2.5D, continuous-but-chaptered (not worldflight, not disconnected scenes) | 4500 |

*(empty: your first build has nothing to clear, so build whatever the interview
points at. From the second onwards, this table is the constraint.)*

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

- **gestion-pedidos-cinematico** takes: the "Guided process" grammar (fixed
  nav carrying a live chapter/progress readout instead of per-act eyebrows,
  closing on the process's own resolution). the "persistent state-card +
  self-drawing scroll-bound line" signature move (a fixed HUD token that
  mutates state as the reader crosses real document chapters, paired with an
  SVG line whose `stroke-dashoffset` is driven by actual scroll position). the
  9-act length band (~19 viewport-heights) — outside the 6-7 act / 13.6-13.8vh
  band the first four builds shared. A later build should not re-use a
  fixed-HUD-token-tracks-scroll-chapters device as its signature move, or the
  same nav-carries-the-chapter-count treatment.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
