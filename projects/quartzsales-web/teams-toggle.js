document.addEventListener('DOMContentLoaded', () => {
  const cards = Array.from(document.querySelectorAll('.tile--teams .card-inner'));
  if (!cards.length) return;

  const isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  cards.forEach(card => {
    const hint = card.querySelector('.flip-hint');

    const toggle = (e) => {
      e.stopPropagation();
      card.classList.toggle('is-active');
    };

    // Botón flecha → funciona en touch Y teclado
    if (hint) {
      hint.addEventListener('click', toggle);
    }

    // En touch, tocar cualquier parte de la cara frontal también gira
    if (isTouchOnly) {
      const front = card.querySelector('.card-face.front');
      if (front) {
        front.addEventListener('click', (e) => {
          // no duplicar si el tap fue justo en la flecha
          if (!hint || !hint.contains(e.target)) {
            card.classList.toggle('is-active');
          }
        });
      }
    }
  });

  // Resetear cuando la card sale del viewport
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) e.target.classList.remove('is-active');
      });
    }, { threshold: 0 });
    cards.forEach(c => io.observe(c));
  }
});
