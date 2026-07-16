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

const setupHeroTitle = () => {
  const heroTitle = document.querySelector('.hero-copy h1');
  if (!heroTitle) return;

  const verbs = [
    { text: 'Diseñamos', className: 'verb-purple' },
    { text: 'Prototipamos', className: 'verb-green' },
    { text: 'Planificamos', className: 'verb-violet' },
    { text: 'Construimos', className: 'verb-ink' }
  ];

  heroTitle.setAttribute(
    'aria-label',
    'Diseñamos, prototipamos, planificamos y construimos el cambio antes de que llegue.'
  );
  heroTitle.innerHTML = '<span class="hero-verb-line" aria-hidden="true"><span class="hero-verb verb-purple">Diseñamos</span></span><span class="hero-title-rest" aria-hidden="true">el cambio antes de que llegue.</span>';

  const heroVerb = heroTitle.querySelector('.hero-verb');
  if (!heroVerb || prefersReducedMotion) return;

  let verbIndex = 0;
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
      heroVerb.className = `hero-verb ${nextVerb.className}`;

      await wait(180);
      await typeWord(nextVerb.text);
    }
  };

  void runTypingCycle();
};

if (heroWordStyles.sheet) {
  setupHeroTitle();
} else {
  heroWordStyles.addEventListener('load', setupHeroTitle, { once: true });
  heroWordStyles.addEventListener('error', setupHeroTitle, { once: true });
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
