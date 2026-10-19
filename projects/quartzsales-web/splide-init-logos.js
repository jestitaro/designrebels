document.addEventListener('DOMContentLoaded', () => {
  const carousels = document.querySelectorAll('.splide');
  carousels.forEach(el => {
    const id = el.getAttribute('id') || '';
    if (['logosCarousel','testimonialCarousel','teamCarousel'].includes(id)) return; // ya se inicializan aparte
    const instance = new Splide(el, {
      type: 'loop',
      perPage: window.innerWidth >= 1280 ? 3 : window.innerWidth >=1024 ? 2 : 1,
      gap: '2rem',
      pagination: true,
      arrows: true,
      breakpoints: {
        1280:{ perPage:3},
        1024:{ perPage:2},
        768:{ perPage:1 },
        480:{ perPage:1, padding:{left:0,right:0}}
      },
      lazyLoad: 'nearby',
      autoplay: true,
      interval: 4500,
      pauseOnHover: true,
      pauseOnFocus: true,
      speed: 700,
      drag: true,
    });
    instance.mount();
  });
});
        // === IA Section: simple on-scroll reveal ===
(function () {
  const els = document.querySelectorAll('.ai-card[data-anim]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  els.forEach(el => io.observe(el));
})();


// === IA Section: simple on-scroll reveal ===
(function () {
  const els = document.querySelectorAll('.ai-card[data-anim]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
})();


// === AI section v5: set bg height to 50% of card height ===
(function(){
  const section = document.querySelector('#ai-retail');
  if(!section) return;
  const bg = section.querySelector('.ai-section__bg');
  const firstCard = section.querySelector('.ai-card');
  const title = section.querySelector('.ai-section__title');
  if(!bg || !firstCard || !title) return;

  function setHeight(){
    const titleBottom = title.offsetTop + title.offsetHeight;
    const style = window.getComputedStyle(title);
    const mb = parseFloat(style.marginBottom || 0);
    const gap = 32; // separación entre título y grid aprox
    const halfCard = firstCard.offsetHeight * 0.5;
    const h = titleBottom + mb + gap + halfCard;
    bg.style.height = h + 'px';
  }

  setHeight();
  window.addEventListener('resize', setHeight);
})();

/* ---- Neutralize clicks on slides (hover-only behavior) ---- */
function neutralizeSlideClicks(scope){
  var root = scope || document;
  root.addEventListener('click', function(e){
    // Allow Splide controls
    if (e.target.closest && e.target.closest('.splide__arrow, .splide__pagination, .splide__toggle')) return;
    // If click is inside a slide, prevent navigation / actions
    if (e.target.closest && e.target.closest('.splide__slide')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true); // capture phase to intercept early
}
document.addEventListener('DOMContentLoaded', function(){ neutralizeSlideClicks(document); });
/* ---- /Neutralize clicks ---- */


// Carrusel de Logos
document.addEventListener('DOMContentLoaded', () => {
  const logosCarousel = document.querySelector('#logosCarousel');
  if (logosCarousel) {
    new Splide('#logosCarousel', {
      type: 'loop',
      perPage: 5,            // menos por vista → más grandes
      gap: '0.8rem',         // solo este carrusel queda más junto
      autoplay: true,
      interval: 3000,
      pauseOnHover: true,
      arrows: false,
      pagination: false,
      breakpoints: {
        1024: { perPage: 4, gap: '0.6rem' },
        768:  { perPage: 3, gap: '0.5rem' },
        480:  { perPage: 2, gap: '0.4rem' }
      }
    }).mount();
  }
});
