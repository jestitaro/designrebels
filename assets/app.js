const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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