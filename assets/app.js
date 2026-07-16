const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const heroWordStyles = document.createElement('link');
heroWordStyles.rel = 'stylesheet';
heroWordStyles.href = 'assets/hero-word-cycle.css';
document.head.append(heroWordStyles);

const revealItems = document.querySelectorAll('.reveal');

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

const setupHeroTitle = async () => {
  const heroTitle = document.querySelector('.hero-copy h1');
  if (!heroTitle) return;

  const verbs = [
    { text: 'Diseñamos', className: 'verb-design', scale: 1 },
    { text: 'Prototipamos', className: 'verb-prototype', scale: 1 },
    { text: 'Planificamos', className: 'verb-plan', scale: 1 },
    { text: 'Construimos', className: 'verb-build', scale: 1 }
  ];

  heroTitle.setAttribute(
    'aria-label',
    'Diseñamos, prototipamos, planificamos y construimos el cambio antes de que llegue.'
  );
  heroTitle.innerHTML = '<span class="hero-verb-slot" aria-hidden="true"><span class="hero-verb verb-design">Diseñamos</span></span><span class="hero-title-rest" aria-hidden="true"> el cambio antes de que llegue.</span>';

  const heroVerbSlot = heroTitle.querySelector('.hero-verb-slot');
  const heroVerb = heroTitle.querySelector('.hero-verb');
  if (!heroVerbSlot || !heroVerb) return;

  try {
    await document.fonts.ready;
  } catch {
    // Continuar con las fuentes disponibles si la API no responde.
  }

  let verbIndex = 0;
  let resizeTimer;

  const measureVerb = ({ text, className }) => {
    const probe = document.createElement('span');
    probe.className = `hero-verb ${className} hero-verb-measure`;
    probe.textContent = text;
    heroVerbSlot.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  };

  const updateVerbMetrics = () => {
    const isMobile = window.matchMedia('(max-width: 700px)').matches;

    if (isMobile) {
      heroVerbSlot.style.removeProperty('--verb-slot-width');
      heroVerb.style.setProperty('--verb-scale', '1');
      return;
    }

    const widths = verbs.map(measureVerb);
    const targetWidth = widths[0] || 1;

    heroVerbSlot.style.setProperty('--verb-slot-width', `${Math.ceil(targetWidth)}px`);
    verbs.forEach((verb, index) => {
      verb.scale = widths[index] ? targetWidth / widths[index] : 1;
    });
    heroVerb.style.setProperty('--verb-scale', String(verbs[verbIndex].scale));
  };

  const applyVerbStyle = (verb) => {
    heroVerb.className = `hero-verb ${verb.className}`;
    heroVerb.style.setProperty('--verb-scale', String(verb.scale));
  };

  updateVerbMetrics();

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateVerbMetrics, 120);
  });

  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  const deleteWord = async () => {
    while (heroVerb.textContent.length > 0) {
      heroVerb.textContent = heroVerb.textContent.slice(0, -1);
      await wait(55);
    }
  };

  const typeWord = async (word) => {
    for (let index = 1; index <= word.length; index += 1) {
      heroVerb.textContent = word.slice(0, index);
      await wait(85);
    }
  };

  const runTypingCycle = async () => {
    while (document.body.contains(heroVerb)) {
      await wait(1650);
      await deleteWord();

      verbIndex = (verbIndex + 1) % verbs.length;
      const nextVerb = verbs[verbIndex];
      applyVerbStyle(nextVerb);

      await wait(180);
      await typeWord(nextVerb.text);
    }
  };

  if (!prefersReducedMotion) {
    void runTypingCycle();
  }
};

if (heroWordStyles.sheet) {
  void setupHeroTitle();
} else {
  heroWordStyles.addEventListener('load', () => void setupHeroTitle(), { once: true });
  heroWordStyles.addEventListener('error', () => void setupHeroTitle(), { once: true });
}

const board = document.querySelector('.hero-board');

if (board && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
  board.addEventListener('pointermove', (event) => {
    const rect = board.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    board.style.transform = `perspective(900px) rotateX(${y * -2.5}deg) rotateY(${x * 2.5}deg)`;
  });

  board.addEventListener('pointerleave', () => {
    board.style.transform = '';
  });
}
