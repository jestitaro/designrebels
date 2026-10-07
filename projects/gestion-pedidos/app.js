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
     Cada tab tiene un data-time (segundo del video donde arranca ese tramo)
     y un data-caption (la descripción que va debajo del video). El tramo
     activo y la barra de progreso se calculan en vivo contra
     video.currentTime: es el video real el que manda, no un timer. */
  const flowTabs = Array.from(document.querySelectorAll('.flow-tab'));
  const flowVideo = document.getElementById('flow-video');
  const flowStage = document.getElementById('flow-stage');
  const flowCaption = document.getElementById('flow-caption');
  const flowList = document.querySelector('.flow-tabs__list');
  const modalStep = document.getElementById('videoModalStep');
  const modalCaption = document.getElementById('videoModalCaption');

  if (flowTabs.length && flowVideo) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const segments = flowTabs.map((tab) => ({
      tab,
      start: parseFloat(tab.dataset.time),
      title: tab.querySelector('.flow-tab__title')?.textContent.trim() || '',
      caption: tab.dataset.caption || '',
      bar: tab.querySelector('.flow-tab__progress-bar'),
    }));
    let activeIndex = -1;
    let rafId = null;
    let captionTimer = null;

    function segmentEnd(i) {
      return i < segments.length - 1 ? segments[i + 1].start : (flowVideo.duration || segments[i].start + 1);
    }

    function showCaption(i) {
      const seg = segments[i];
      if (modalStep) modalStep.textContent = seg.title;
      if (modalCaption) modalCaption.textContent = seg.caption;
      if (!flowCaption) return;
      clearTimeout(captionTimer);
      if (reduceMotion) { flowCaption.textContent = seg.caption; return; }
      flowCaption.classList.add('is-swapping');
      captionTimer = setTimeout(() => {
        flowCaption.textContent = seg.caption;
        flowCaption.classList.remove('is-swapping');
      }, 200);
    }

    // En mobile la lista es una fila desplazable: lleva el chip activo a la
    // vista sin mover el scroll vertical de la página.
    function revealTab(tab) {
      if (!flowList || flowList.scrollWidth <= flowList.clientWidth) return;
      const left = tab.offsetLeft - flowList.offsetLeft - 8;
      flowList.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    function setFlowActive(i) {
      if (i === activeIndex) return;
      activeIndex = i;
      segments.forEach((seg, idx) => {
        const isActive = idx === i;
        seg.tab.classList.toggle('active', isActive);
        seg.tab.setAttribute('aria-selected', String(isActive));
        seg.tab.tabIndex = isActive ? 0 : -1;
        if (!isActive && seg.bar) seg.bar.style.width = '0%';
      });
      if (flowStage) flowStage.setAttribute('aria-labelledby', segments[i].tab.id);
      showCaption(i);
      revealTab(segments[i].tab);
    }

    function currentSegmentIndex(t) {
      let i = 0;
      for (let k = 0; k < segments.length; k++) {
        if (t >= segments[k].start) i = k; else break;
      }
      return i;
    }

    function syncToVideo() {
      const t = flowVideo.currentTime;
      const i = currentSegmentIndex(t);
      setFlowActive(i);
      const seg = segments[i];
      const end = segmentEnd(i);
      const pct = end > seg.start ? Math.min(1, Math.max(0, (t - seg.start) / (end - seg.start))) : 0;
      if (seg.bar) seg.bar.style.width = (pct * 100) + '%';
    }

    function tick() {
      syncToVideo();
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

    function goToStep(i) {
      try {
        flowVideo.currentTime = i === 0 ? 0 : segments[i].start + 0.05;
      } catch (e) { /* metadata aún no lista */ }
      setFlowActive(i);
      if (!reduceMotion) flowVideo.play().catch(() => {});
    }

    flowTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => goToStep(i));
      // Flechas para moverse entre pestañas (patrón ARIA de tabs).
      tab.addEventListener('keydown', (e) => {
        const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
        let next = null;
        if (e.key in keys) next = (i + keys[e.key] + segments.length) % segments.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = segments.length - 1;
        if (next === null) return;
        e.preventDefault();
        segments[next].tab.focus();
        goToStep(next);
      });
    });

    flowVideo.addEventListener('seeked', syncToVideo);
    flowVideo.addEventListener('playing', startSync);
    flowVideo.addEventListener('pause', stopSync);

    if (reduceMotion) {
      // Sin autoplay: el video queda pausado y las tabs siguen saltando a
      // cada tramo; el usuario puede reproducirlo desde "Ampliar".
      flowVideo.autoplay = false;
      flowVideo.pause();
      setFlowActive(0);
    } else {
      setFlowActive(0);
      if (!flowVideo.paused) startSync();

      // Solo reproduce mientras la sección está en pantalla.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
          if (document.getElementById('videoModal')?.classList.contains('is-open')) return;
          if (entry.isIntersecting) flowVideo.play().catch(() => {});
          else flowVideo.pause();
        }, { threshold: 0.25 }).observe(flowVideo.closest('.flow-tabs__frame') || flowVideo);
      }
    }

    /* ---- Ampliar: mueve el MISMO <video> a un modal más grande, sin
       reiniciar la reproducción (es el mismo elemento, solo cambia de
       padre), y lo trae de vuelta al recuadro al cerrar. ---- */
    const expandBtn = document.querySelector('.flow-tabs__expand');
    const videoModal = document.getElementById('videoModal');
    const videoModalFrame = document.getElementById('videoModalFrame');
    const videoHome = document.querySelector('.flow-tabs__frame');

    if (expandBtn && videoModal && videoModalFrame && videoHome) {
      function openVideoModal() {
        videoModalFrame.appendChild(flowVideo);
        flowVideo.controls = true;
        videoModal.classList.add('is-open');
        videoModal.setAttribute('aria-hidden', 'false');
        document.documentElement.style.overflowY = 'hidden';
        videoModal.querySelector('.video-modal__close')?.focus();
        flowVideo.play().catch(() => {});
      }

      function closeVideoModal() {
        videoModal.classList.remove('is-open');
        videoModal.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflowY = '';
        flowVideo.controls = false;
        videoHome.insertBefore(flowVideo, expandBtn);
        if (reduceMotion) flowVideo.pause(); else flowVideo.play().catch(() => {});
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

