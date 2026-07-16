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

const heroTitle = document.querySelector('.hero-copy h1');

if (heroTitle) {
  const verbs = [
    { text: 'Diseñamos', className: 'verb-design' },
    { text: 'Prototipamos', className: 'verb-prototype' },
    { text: 'Planificamos', className: 'verb-plan' },
    { text: 'Construimos', className: 'verb-build' }
  ];

  heroTitle.setAttribute(
    'aria-label',
    'Diseñamos, prototipamos, planificamos y construimos el cambio antes de que llegue.'
  );
  heroTitle.innerHTML = '<span class="hero-verb verb-design" aria-hidden="true">Diseñamos</span><span aria-hidden="true"> el cambio antes de que llegue.</span>';

  const heroVerb = heroTitle.querySelector('.hero-verb');
  let verbIndex = 0;

  if (heroVerb && !prefersReducedMotion) {
    window.setInterval(() => {
      heroVerb.classList.add('is-changing');

      window.setTimeout(() => {
        verbIndex = (verbIndex + 1) % verbs.length;
        const nextVerb = verbs[verbIndex];

        heroVerb.className = `hero-verb ${nextVerb.className} is-changing`;
        heroVerb.textContent = nextVerb.text;

        requestAnimationFrame(() => {
          heroVerb.classList.remove('is-changing');
        });
      }, 220);
    }, 2600);
  }
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
