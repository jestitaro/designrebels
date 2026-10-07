document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Scroll helpers ---------- */
  document.querySelectorAll('.js-scroll-demo').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' }));
  });
  document.querySelectorAll('.js-scroll-como-funciona').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('como-funciona').scrollIntoView({ behavior: 'smooth' }));
  });

  /* ---------- Hero: mockups flotantes con rotación ---------- */
  const heroStage = document.getElementById('heroStage');
  if (heroStage) {
    requestAnimationFrame(() => heroStage.classList.add('is-active'));

    function rotateSlot(selector, interval) {
      const items = heroStage.querySelectorAll(selector + ' .slot-item');
      if (items.length < 2) return;
      let index = 0;
      setInterval(() => {
        items[index].classList.remove('active');
        index = (index + 1) % items.length;
        items[index].classList.add('active');
      }, interval);
    }
    rotateSlot('.slot-left', 4800);
    rotateSlot('.slot-top', 5200);
    rotateSlot('.slot-right', 5600);
  }

  /* ---------- Cómo funciona: pestañas sincronizadas con el video ----------
     Cada tab tiene un data-time (segundo del video donde arranca ese tramo).
     El tramo activo y la barra de progreso se calculan en vivo contra
     video.currentTime — no es un timer parejo, es el video real mandando. */
  const flowTabs = Array.from(document.querySelectorAll('.flow-tab'));
  const flowVideo = document.getElementById('flow-video');

  if (flowTabs.length && flowVideo) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const segments = flowTabs.map((tab, i) => ({
      tab,
      index: i,
      start: parseFloat(tab.dataset.time),
      bar: tab.querySelector('.flow-tab__progress-bar'),
    }));
    let activeIndex = -1;
    let rafId = null;

    function segmentEnd(i) {
      return i < segments.length - 1 ? segments[i + 1].start : (flowVideo.duration || segments[i].start + 1);
    }

    function setFlowActive(i) {
      if (i === activeIndex) return;
      activeIndex = i;
      segments.forEach((seg, idx) => {
        const isActive = idx === i;
        seg.tab.classList.toggle('active', isActive);
        seg.tab.setAttribute('aria-selected', String(isActive));
        if (!isActive && seg.bar) seg.bar.style.width = '0%';
      });
    }

    function currentSegmentIndex(t) {
      let i = 0;
      for (let k = 0; k < segments.length; k++) {
        if (t >= segments[k].start) i = k; else break;
      }
      return i;
    }

    function tick() {
      const t = flowVideo.currentTime;
      const i = currentSegmentIndex(t);
      setFlowActive(i);
      const seg = segments[i];
      const end = segmentEnd(i);
      const pct = end > seg.start ? Math.min(1, Math.max(0, (t - seg.start) / (end - seg.start))) : 0;
      if (seg.bar) seg.bar.style.width = (pct * 100) + '%';
      rafId = requestAnimationFrame(tick);
    }

    function startSync() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }
    function stopSync() {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    flowTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        const target = segments[i].start;
        try {
          flowVideo.currentTime = i === 0 ? 0 : target + 0.05;
        } catch (e) { /* metadata aún no lista */ }
        setFlowActive(i);
        if (!reduceMotion) {
          flowVideo.play().catch(() => {});
        }
      });
    });

    if (reduceMotion) {
      // Sin auto-avance ni autoplay: el video queda pausado en el primer
      // cuadro y las tabs siguen siendo clickeables para saltar a cada tramo.
      flowVideo.autoplay = false;
      flowVideo.pause();
      setFlowActive(0);
    } else {
      flowVideo.addEventListener('playing', startSync);
      flowVideo.addEventListener('pause', stopSync);
      flowVideo.addEventListener('seeking', () => setFlowActive(currentSegmentIndex(flowVideo.currentTime)));
      setFlowActive(0);
      if (!flowVideo.paused) startSync();
    }

    /* ---- Ampliar: mueve el MISMO <video> a un modal más grande, sin
       reiniciar la reproducción (es el mismo elemento, solo cambia de
       padre), y lo trae de vuelta a la pantalla del monitor al cerrar. ---- */
    const expandBtn = document.querySelector('.flow-tabs__expand');
    const videoModal = document.getElementById('videoModal');
    const videoModalFrame = document.getElementById('videoModalFrame');
    const videoHome = document.querySelector('.flow-tabs__screen');

    if (expandBtn && videoModal && videoModalFrame && videoHome) {
      let videoHomeNextSibling = null;

      function openVideoModal() {
        videoHomeNextSibling = flowVideo.nextElementSibling;
        videoModalFrame.appendChild(flowVideo);
        videoModal.classList.add('is-open');
        videoModal.setAttribute('aria-hidden', 'false');
        document.documentElement.style.overflowY = 'hidden';
        videoModal.querySelector('.video-modal__close')?.focus();
      }

      function closeVideoModal() {
        videoModal.classList.remove('is-open');
        videoModal.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflowY = '';
        videoHome.insertBefore(flowVideo, videoHomeNextSibling);
        expandBtn.focus();
      }

      expandBtn.addEventListener('click', openVideoModal);
      videoModal.querySelectorAll('[data-video-modal-close]').forEach(el => {
        el.addEventListener('click', closeVideoModal);
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('is-open')) closeVideoModal();
      });
    }
  }

  /* ---------- Reveal on scroll ---------- */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('active'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

});

