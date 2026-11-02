const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const heroWordStyles = document.createElement('link');
heroWordStyles.rel = 'stylesheet';
heroWordStyles.href = 'assets/hero-word-cycle.css';
document.head.append(heroWordStyles);

const labGridStyles = document.createElement('link');
labGridStyles.rel = 'stylesheet';
labGridStyles.href = 'assets/lab-grid.css';
document.head.append(labGridStyles);

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

const projectCarousel = document.querySelector('.project-carousel');

if (projectCarousel) {
  const cards = [...projectCarousel.querySelectorAll('[data-project-card]')];
  const dots = [...projectCarousel.querySelectorAll('[data-carousel-dot]')];
  const previousButton = projectCarousel.querySelector('.carousel-prev');
  const nextButton = projectCarousel.querySelector('.carousel-next');
  let activeIndex = 0;
  let pointerStartX = null;
  let suppressClickUntil = 0;

  const normalizeIndex = (index) => (index + cards.length) % cards.length;

  const getRelativePosition = (index) => {
    let difference = index - activeIndex;
    const half = cards.length / 2;

    if (difference > half) difference -= cards.length;
    if (difference < -half) difference += cards.length;

    if (difference < -2 || difference > 2) return 'hidden';
    return String(difference);
  };

  const updateCarousel = () => {
    cards.forEach((card, index) => {
      const position = getRelativePosition(index);
      const isActive = index === activeIndex;
      card.dataset.position = position;
      card.tabIndex = isActive ? 0 : -1;

      if (isActive) {
        card.setAttribute('aria-current', 'true');
      } else {
        card.removeAttribute('aria-current');
      }
    });

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle('is-active', isActive);
      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  };

  const setActive = (index, focusCard = false) => {
    activeIndex = normalizeIndex(index);
    updateCarousel();

    if (focusCard) {
      window.setTimeout(() => cards[activeIndex]?.focus({ preventScroll: true }), 80);
    }
  };

  cards.forEach((card, index) => {
    card.addEventListener('click', (event) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        return;
      }

      if (index !== activeIndex) {
        event.preventDefault();
        setActive(index);
      }
    });
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => setActive(index));
  });

  previousButton?.addEventListener('click', () => setActive(activeIndex - 1));
  nextButton?.addEventListener('click', () => setActive(activeIndex + 1));

  projectCarousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActive(activeIndex - 1, true);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActive(activeIndex + 1, true);
    }
  });

  projectCarousel.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    pointerStartX = event.clientX;
  });

  window.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) return;

    const distance = event.clientX - pointerStartX;
    pointerStartX = null;

    if (Math.abs(distance) < 45) return;

    suppressClickUntil = performance.now() + 350;
    setActive(activeIndex + (distance < 0 ? 1 : -1));
  });

  window.addEventListener('pointercancel', () => {
    pointerStartX = null;
  });

  updateCarousel();
}
