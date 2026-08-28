/* Talent Lab — hero-physics.js
 * Los íconos del hero caen con una simulación de física real (gravedad +
 * colisiones), usando Matter.js (vendorizado en assets/vendor/, MIT license
 * — ver matter-js-LICENSE.txt), en vez de una animación CSS con curvas
 * prediseñadas. Por eso el orden en que aterrizan y cómo quedan apilados
 * nunca es el mismo ni está guionado: lo resuelve el motor.
 *
 * Se renderiza a mano sobre los mismos <div>/<svg> ya existentes (no sobre
 * un <canvas>): cada body de Matter.js tiene un elemento del DOM asociado,
 * y en cada frame se lee su posición/ángulo y se aplica como transform.
 * Eso deja el hover, el :focus y la accesibilidad de los íconos intactos.
 *
 * Arranca recién cuando el bloque entra en pantalla (si no, con una
 * sección tan alta la caída ya habría terminado fuera de vista antes de
 * que alguien llegue a scrollear hasta acá).
 */
(function () {
  const shelf = document.querySelector('.icon-shelf');
  if (!shelf || !window.Matter) return;

  const icons = Array.from(shelf.querySelectorAll('.shelf-icon'));
  if (!icons.length) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    layoutStatic();
    return;
  }

  const { Engine, Bodies, Composite, Body, Sleeping } = Matter;

  let engine = null;
  let rafId = null;
  let started = false;
  const items = []; // { el, body, w, h }

  function layoutStatic() {
    // Sin animación: los acomoda en una fila prolija, ya en su posición final.
    ensureRoomBelowText();
    const w = shelf.clientWidth || 900;
    let x = 10;
    icons.forEach(el => {
      const iw = el.offsetWidth || parseInt(el.style.width, 10) || 140;
      const ih = el.offsetHeight || iw;
      const y = shelf.clientHeight - ih - 4;
      el.style.transform = `translate(${x}px, ${Math.max(0, y)}px)`;
      el.style.opacity = '1';
      x += iw * 0.72;
      if (x > w - 60) x = 10;
    });
  }

  function ensureRoomBelowText() {
    // La sección debe tener suficiente alto como para que el texto Y la pila
    // de íconos entren sin pisarse — sin importar qué tan bajo sea el
    // viewport (una ventana de escritorio achicada, un notebook con poca
    // altura, etc.). Si no alcanza, se agranda el hero en vez de dejar que
    // la pila trepe hasta la altura del título.
    const heroGrid = document.querySelector('.hero-grid');
    const heroPanel = document.querySelector('.hero-panel');
    if (!heroGrid || !heroPanel) return;
    const shelfTop = shelf.getBoundingClientRect().top;
    const textBottom = heroGrid.getBoundingClientRect().bottom - shelfTop;
    const PILE_CLEARANCE = 260;
    const minRequired = Math.round(textBottom + PILE_CLEARANCE);
    if (shelf.clientHeight < minRequired) {
      heroPanel.style.minHeight = (minRequired + 40) + 'px';
    }
  }

  function setup() {
    ensureRoomBelowText();
    const W = shelf.clientWidth;
    const H = shelf.clientHeight;

    engine = Engine.create();
    engine.gravity.y = 1.15;
    engine.enableSleeping = true;

    const wallOpts = { isStatic: true, friction: 0.55, restitution: 0.12 };
    const ground = Bodies.rectangle(W / 2, H + 40, W + 400, 80, wallOpts);
    const leftWall = Bodies.rectangle(-40, H / 2, 80, H * 4, wallOpts);
    const rightWall = Bodies.rectangle(W + 40, H / 2, 80, H * 4, wallOpts);
    Composite.add(engine.world, [ground, leftWall, rightWall]);

    icons.forEach((el, i) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const shape = el.dataset.shape || 'rect';
      const startX = Math.max(w, Math.min(W - w, 40 + Math.random() * (W - 80)));
      const startY = -80 - i * 150 - Math.random() * 70;
      const angle = (Math.random() - 0.5) * 1.1;

      const bodyOpts = {
        friction: 0.45,
        frictionAir: 0.012,
        frictionStatic: 0.6,
        restitution: 0.24,
        angle,
        sleepThreshold: 30
      };
      const body = shape === 'circle'
        ? Bodies.circle(startX, startY, Math.min(w, h) * 0.46, bodyOpts)
        : Bodies.rectangle(startX, startY, w * 0.86, h * 0.8, bodyOpts);
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.18);

      el.style.willChange = 'transform';
      items.push({ el, body, w, h });
    });
  }

  function render() {
    let allAsleep = true;
    items.forEach(({ el, body, w, h }) => {
      if (!body.isSleeping) allAsleep = false;
      const x = body.position.x - w / 2;
      const y = body.position.y - h / 2;
      el.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
      if (el.style.opacity !== '1') el.style.opacity = '1';
    });
    Engine.update(engine, 1000 / 60);
    rafId = allAsleep ? null : requestAnimationFrame(render);
  }

  function wake() {
    if (!engine) return;
    items.forEach(({ body }) => Sleeping.set(body, false));
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  function start() {
    if (started) return;
    started = true;
    setup();
    items.forEach(({ body }, i) => {
      setTimeout(() => { if (engine) Composite.add(engine.world, body); }, i * 140);
    });
    rafId = requestAnimationFrame(render);
  }

  icons.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (!started) return;
      const item = items.find(it => it.el === el);
      if (!item || !item.body.parent) return;
      wake();
      Body.applyForce(item.body, item.body.position, {
        x: (Math.random() - 0.5) * 0.025,
        y: -0.05 - Math.random() * 0.015
      });
      Body.setAngularVelocity(item.body, (Math.random() - 0.5) * 0.35);
    });
  });

  const shelfObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      shelfObserver.disconnect();
      // El bloque de texto tiene su propia transición de entrada (.reveal,
      // ~0.7s animando opacity + transform). Si medimos su altura mientras
      // todavía se está moviendo, agarramos una posición de paso, no la
      // final — y el colchón que calculamos para la pila queda corto.
      // Esperamos a que termine esa transición antes de medir y armar la física.
      setTimeout(start, 760);
    });
  }, { threshold: 0, rootMargin: '0px 0px -35% 0px' });
  shelfObserver.observe(shelf);
})();
