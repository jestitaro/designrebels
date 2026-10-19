(() => {
  const BASE_W = 1440;
  const BASE_H = 810;

  const scene = document.getElementById("scene");
  const stage = document.getElementById("stage");
  const worlds = Array.from(document.querySelectorAll(".world"));

  // Evita el "flash" de scroll restaurado (y el Mario fantasma a la derecha)
  // mostrando el stage recién cuando forzamos la posición inicial.
  if (stage) {
    stage.scrollLeft = 0;
    try { stage.scrollTo({ left: 0, top: 0, behavior: "auto" }); } catch (_) {}
  }
  document.body.classList.add("is-ready");

  // Si el navegador restaura el scroll via bfcache, lo volvemos a forzar.
  window.addEventListener("pageshow", () => {
    if (stage) {
      stage.scrollLeft = 0;
      try { stage.scrollTo({ left: 0, top: 0, behavior: "auto" }); } catch (_) {}
    }
  });

  const btnStart = document.getElementById("btnStart");
  const btnRestart = document.getElementById("btnRestart");

  // =========================
  // SFX
  // =========================
  const SFX = {
    coin: new Audio("assets/coin-257878.mp3"),
    block: new Audio("assets/jump-up-245782.mp3"),
    flag: new Audio("assets/jsyd_mario_slide-93009.mp3"),
  };
  Object.values(SFX).forEach((a) => {
    try {
      a.preload = "auto";
      a.volume = 0.8;
    } catch (_) {}
  });

  let sfxUnlocked = false;
  function unlockSfxOnce() {
    if (sfxUnlocked) return;
    sfxUnlocked = true;

    // iOS/Safari: necesita un gesto del usuario antes de reproducir audio.
    Object.values(SFX).forEach((a) => {
      try {
        a.muted = true;
        const p = a.play();
        if (p && typeof p.then === "function") {
          p.then(() => {
            a.pause();
            a.currentTime = 0;
            a.muted = false;
          }).catch(() => {
            a.muted = false;
          });
        } else {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        }
      } catch (_) {}
    });
  }

  function playSfx(name) {
    const a = SFX[name];
    if (!a) return;
    try {
      // reiniciar para que suene siempre, incluso en disparos seguidos
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) {}
  }


  // Un solo Mario en toda la experiencia (evita duplicados entre mundos)
  const allWorldPlayers = Array.from(document.querySelectorAll(".world .player"));
  const mainPlayer = allWorldPlayers[0] || null;
  allWorldPlayers.slice(1).forEach((p) => p.remove());

  function mountPlayer(worldEl) {
    if (!mainPlayer || !worldEl) return;
    const floor = worldEl.querySelector(".floor");
    if (floor && !floor.contains(mainPlayer)) floor.appendChild(mainPlayer);
  }

  // En world-intro necesitamos que Mario quede por encima del caño.
  // Si lo montamos dentro de .floor queda atrapado por su z-index (stacking context).
  function mountPlayerIntro(worldEl) {
    if (!mainPlayer || !worldEl) return;

    // si estaba dentro de un floor, sacarlo
    const currentFloor = mainPlayer.closest(".floor");
    if (currentFloor && currentFloor.contains(mainPlayer)) {
      currentFloor.removeChild(mainPlayer);
    }

    if (!worldEl.contains(mainPlayer)) worldEl.appendChild(mainPlayer);
  }

  let activeIndex = 0;
  let entering = false;
  let enterTimer = null;

  // Hero start
  let heroBusy = false;

  // World-intro controls (bloque + hongo + pipe)
  let introBusy = false;
  let introEntered = false;
  let introReady = false;
  let introDone = false;
  let introMush = null;
  let introBigTimer = null;


  // World-2 controls
  let w2Busy = false;
  let w2Entered = false;

  // World-3 controls
  let w3Busy = false;
  let w3Entered = false;


  // World-4 controls
  let w4Busy = false;
  let w4Entered = false;

  // por pantalla guardo bullets revelados
  const revealed = new Map(); // idx -> Set(bulletIndex)
  const getSet = (i) => {
    if (!revealed.has(i)) revealed.set(i, new Set());
    return revealed.get(i);
  };

  function applyScale() {
    const s = Math.max(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
    scene.style.setProperty("--scale", String(s));
  }

  function setActive(i, smooth = true) {
    activeIndex = Math.max(0, Math.min(worlds.length - 1, i));
    stage.scrollTo({
      left: activeIndex * BASE_W,
      top: 0,
      behavior: smooth ? "smooth" : "auto",
    });

    // Montamos el Mario principal en el mundo activo (si el scroll es smooth,
    // esperamos un toque para evitar "teleport" visual durante el desplazamiento)
    const wActive = worlds[activeIndex];
    if (smooth) setTimeout(() => mountPlayer(wActive), 520);
    else mountPlayer(wActive);

// si volvemos a world-1, aseguramos que Mario no quede oculto por la animación del pipe
    const w = worlds[activeIndex];

    // si salimos del intro, reseteamos flags para que pueda volver a reproducirse
    if (w?.id !== "world-intro") {
      introBusy = false;
      introEntered = false;
      introReady = false;
      introDone = false;
      if (introBigTimer) { clearTimeout(introBigTimer); introBigTimer = null; }
      if (mainPlayer) mainPlayer.classList.remove("is-big");
    }
    if (w?.id === "world-intro") ensureIntroEntrance(w);
    if (w?.id === "world-2") ensureWorld2Entrance(w);
    if (w?.id === "world-3") ensureWorld3Entrance(w);
    if (w?.id === "world-4") ensureWorld4Entrance(w);
    if (w?.id === "world-1") { resetWorld1Visuals(w); ensureWorld1Fall(w); }

    if (activeIndex !== worlds.length - 1) resetEndSequence();
    else ensureEndSequence(wActive);
  }

  function syncFromScroll() {
    const i = Math.round(stage.scrollLeft / BASE_W);
    activeIndex = Math.max(0, Math.min(worlds.length - 1, i));
    const w = worlds[activeIndex];

    if (w?.id !== "world-intro") {
      introBusy = false;
      introEntered = false;
      introReady = false;
      introDone = false;
      if (introBigTimer) { clearTimeout(introBigTimer); introBigTimer = null; }
      if (mainPlayer) mainPlayer.classList.remove("is-big");
    }
    if (w?.id === "world-intro") ensureIntroEntrance(w);
    if (w?.id === "world-2") ensureWorld2Entrance(w);
    if (w?.id === "world-3") ensureWorld3Entrance(w);
    if (w?.id === "world-4") ensureWorld4Entrance(w);
    if (w?.id === "world-1") ensureWorld1Fall(w);
    if (activeIndex === worlds.length - 1) ensureEndSequence(w);
  }

  function nextBulletIndex(worldEl, set) {
    const bullets = Array.from(worldEl.querySelectorAll(".bullet"));
    for (let i = 0; i < bullets.length; i++) {
      if (!set.has(i)) return i;
    }
    return null;
  }

  function hit(worldEl, forcedIndex = null) {
    const blocks = Array.from(worldEl.querySelectorAll(".qblock"));
    const bullets = Array.from(worldEl.querySelectorAll(".bullet"));
    if (!blocks.length || !bullets.length) return false;

    const set = getSet(activeIndex);
    const idx = (typeof forcedIndex === "number") ? forcedIndex : nextBulletIndex(worldEl, set);
    if (idx === null) return false;

    // reveal bullet
    bullets[idx]?.classList.add("is-on");
    set.add(idx);

    // block: used + bonk animation
    const b = blocks[idx];
    if (b) {
      b.classList.add("is-used");
      b.classList.remove("is-hit");
      void b.offsetWidth;
      b.classList.add("is-hit");
      setTimeout(() => b.classList.remove("is-hit"), 260);
    }

    playSfx("block");
    return true;
  }


  // =========================
  // World-intro: bloque + hongo + pipe
  // =========================
  function introTargetLeft(worldEl) {
    const qb = worldEl?.querySelector(".intro-qblock");
    if (!qb || !mainPlayer) return 640;

    const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
    const wRect = worldEl.getBoundingClientRect();
    const bRect = qb.getBoundingClientRect();
    const pRect = mainPlayer.getBoundingClientRect();

    const playerW = (pRect.width / scale) || 84;
    const blockCenterX = (bRect.left - wRect.left + bRect.width / 2) / scale;

    return Math.max(0, Math.min(BASE_W - playerW, blockCenterX - playerW / 2));
  }

  function ensureIntroEntrance(worldEl) {
    if (!worldEl || !mainPlayer) return;
    if (introEntered) return;

    introEntered = true;
    introBusy = true;
    introReady = false;
    introDone = false;

    mountPlayerIntro(worldEl);

    // arrancar siempre desde la izquierda y frenar bajo el bloque
    mainPlayer.classList.remove("is-jump", "is-enter-pipe", "is-enter-castle", "is-big");
    mainPlayer.style.transition = "none";
    mainPlayer.style.transform = "none";
    mainPlayer.style.opacity = "0";
    mainPlayer.style.left = "-140px";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // volver a usar transición por CSS (world-intro define el transition)
        mainPlayer.style.transition = "";
        mainPlayer.style.opacity = "1";

        const targetLeft = introTargetLeft(worldEl);

        const onEnd = (ev) => {
          if (ev && ev.propertyName && ev.propertyName !== "left") return;
          mainPlayer.removeEventListener("transitionend", onEnd);
          introBusy = false;
          introReady = true;
        };

        mainPlayer.addEventListener("transitionend", onEnd);
        mainPlayer.style.left = `${targetLeft}px`;

        // fallback si el navegador no dispara transitionend (distancia mínima)
        const curLeft = parseFloat(getComputedStyle(mainPlayer).left) || 0;
        if (Math.abs(curLeft - targetLeft) < 2) setTimeout(onEnd, 0);
      });
    });
  }

  function introSpawnMushroom(worldEl) {
    if (!worldEl || !mainPlayer) return;

    const qb = worldEl.querySelector(".intro-qblock");
    if (!qb) return;

    if (!introMush) {
      introMush = document.createElement("img");
      introMush.className = "intro-mushroom";
      introMush.src = "assets/hongo.png";
      introMush.alt = "";
      introMush.setAttribute("aria-hidden", "true");
      worldEl.appendChild(introMush);
    } else if (introMush.parentElement !== worldEl) {
      worldEl.appendChild(introMush);
    }

    const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
    const wRect = worldEl.getBoundingClientRect();
    const bRect = qb.getBoundingClientRect();
    const pRect = mainPlayer.getBoundingClientRect();

    const groundH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ground-h")) || 100;
    const mushW = parseFloat(getComputedStyle(introMush).width) || 72;

    const blockCenterX = (bRect.left - wRect.left + bRect.width / 2) / scale;
    const playerH = (pRect.height / scale) || 84;

    const startLeft = Math.max(0, Math.min(BASE_W - mushW, blockCenterX - mushW / 2));
    const startBottom = groundH + 210 + 18;   // dentro del bloque
    const popBottom = groundH + 210 + 112;    // sale hacia arriba
    const landBottom = groundH + (playerH - 10); // cae sobre la cabeza de Mario

    introMush.style.transition = "none";
    introMush.style.opacity = "1";
    introMush.style.left = `${startLeft}px`;
    introMush.style.bottom = `${startBottom}px`;

    // pop
    requestAnimationFrame(() => {
      introMush.style.transition = "bottom .25s ease-out, opacity .2s ease";
      introMush.style.bottom = `${popBottom}px`;
    });

    // fall
    setTimeout(() => {
      // si ya no estamos en intro, abortamos
      if (worlds[activeIndex]?.id !== "world-intro") return;
      introMush.style.transition = "bottom .45s ease-in";
      introMush.style.bottom = `${landBottom}px`;
    }, 280);

    // landed -> grow mario + ir al pipe
    setTimeout(() => {
      if (worlds[activeIndex]?.id !== "world-intro") return;

      introMush.style.opacity = "0";

      // power-up: agrandarse unos segundos (no permanente)
      if (introBigTimer) clearTimeout(introBigTimer);
      mainPlayer.classList.add("is-big");
      introBigTimer = setTimeout(() => {
        mainPlayer.classList.remove("is-big");
        introBigTimer = null;
      }, 3200);

      // ir al caño después de que se note el power-up
      setTimeout(() => introGoToPipe(worldEl), 1100);
    }, 780);
  }

  function introGoToPipe(worldEl) {
    if (!worldEl || !mainPlayer) return;
    if (worlds[activeIndex]?.id !== "world-intro") return;

    const pipe = worldEl.querySelector(".intro-pipe");
    if (!pipe) return;

    const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
    const wRect = worldEl.getBoundingClientRect();
    const pRect = mainPlayer.getBoundingClientRect();
    const pipeRect = pipe.getBoundingClientRect();

    const playerW = (pRect.width / scale) || 84;
    const pipeLeft = (pipeRect.left - wRect.left) / scale;

    // alineación para entrar al pipe
    const targetLeft = Math.max(0, Math.min(BASE_W - playerW, pipeLeft + 26));

    const onWalkEnd = (ev) => {
      if (ev && ev.propertyName && ev.propertyName !== "left") return;
      mainPlayer.removeEventListener("transitionend", onWalkEnd);

      // salto más alto para entrar al caño desde arriba
      mainPlayer.classList.remove("is-jump", "is-jump-high", "behind-pipe", "is-enter-pipe");
      void mainPlayer.offsetWidth;
      mainPlayer.classList.add("is-jump-high");

      // en el pico del salto lo mandamos detrás del caño para que no se note cuando vuelve a tamaño normal
      setTimeout(() => {
        if (worlds[activeIndex]?.id !== "world-intro") return;
        mainPlayer.classList.add("behind-pipe");
      }, 170);

      // efecto de “meterse” al caño (ya estando detrás)
      setTimeout(() => {
        if (worlds[activeIndex]?.id !== "world-intro") return;
        mainPlayer.classList.add("is-enter-pipe");
      }, 280);

      // achicar mientras está oculto/entrando
      setTimeout(() => {
        if (worlds[activeIndex]?.id !== "world-intro") return;
        mainPlayer.classList.remove("is-big");
      }, 320);

      setTimeout(() => {
        const next = Math.min(worlds.length - 1, activeIndex + 1);

        // limpiar estilos inline antes de pasar a world-1 (evita que arranque cerca del pipe)
        if (introBigTimer) { clearTimeout(introBigTimer); introBigTimer = null; }
        mainPlayer.style.left = "";
        mainPlayer.style.transition = "";
        mainPlayer.style.transform = "";
        mainPlayer.style.opacity = "";
        // salto instantáneo para evitar parpadeos
        setActive(next, false);

        setTimeout(() => {
          mainPlayer.classList.remove("is-enter-pipe", "is-jump", "is-jump-high", "behind-pipe");
          introBusy = false;
        }, 60);
      }, 560);
    };

    mainPlayer.addEventListener("transitionend", onWalkEnd);
    const curLeft = parseFloat(getComputedStyle(mainPlayer).left) || 0;
    mainPlayer.style.left = `${targetLeft}px`;
    if (Math.abs(curLeft - targetLeft) < 2) setTimeout(onWalkEnd, 0);
  }

  function introHandleSpace(worldEl) {
    if (!worldEl || !mainPlayer) return;
    if (introBusy || !introReady || introDone) return;

    introDone = true;
    introBusy = true;

    // salto para golpear el bloque
    mainPlayer.classList.remove("is-jump");
    void mainPlayer.offsetWidth;
    mainPlayer.classList.add("is-jump");

    setTimeout(() => {
      if (worlds[activeIndex]?.id !== "world-intro") return;
      // el bloque NO se mueve: solo sale el honguito
      playSfx("block");
      introSpawnMushroom(worldEl);
    }, 190);

    // fin del salto
    setTimeout(() => {
      mainPlayer.classList.remove("is-jump");
    }, 520);
  }


  // =========================
  // World-1: monedas -> objetivos
  // =========================
  let w1Busy = false;
  let w1Entered = false; // entrada caída desde el caño superior

  function revealBulletOnly(worldEl, idx) {
    const bullets = Array.from(worldEl.querySelectorAll(".bullet"));
    const set = getSet(activeIndex);
    if (!bullets.length) return false;
    if (idx === null || idx === undefined) return false;
    bullets[idx]?.classList.add("is-on");
    set.add(idx);
    worldEl.classList.add("has-bullets");
    return true;
  }

  function resetWorld1Visuals(worldEl) {
    const player = worldEl?.querySelector(".player");
    if (player) {
      player.classList.remove("is-jump", "is-enter-pipe");
      player.style.opacity = "";
      player.style.transform = "";
    }
  }


  function ensureWorld1Fall(worldEl) {
    if (w1Entered) return;

    // Solo al entrar por primera vez (sin monedas/objetivos aún)
    const set = getSet(activeIndex);
    if (set && set.size > 0) { w1Entered = true; return; }

    w1Entered = true;

    // Asegurar que el Mario principal esté montado en este mundo
    if (mainPlayer && !worldEl.contains(mainPlayer)) mountPlayer(worldEl);

    const player = worldEl?.querySelector(".player");
    const pipeTop = worldEl?.querySelector(".pipe-top-left");
    if (!player || !pipeTop) return;

    w1Busy = true;

    // Preparar sin flash
    player.classList.remove("is-jump", "is-enter-pipe", "is-fall", "behind-pipe");
    player.style.transition = "none";
    player.style.opacity = "0";
    player.style.transform = "";

    void player.offsetWidth;

    player.style.opacity = "1";
    player.classList.add("behind-pipe");
    player.classList.add("is-fall");

    // Después de salir del caño, lo traemos al frente
    setTimeout(() => player.classList.remove("behind-pipe"), 260);

    const onEnd = () => {
      player.removeEventListener("animationend", onEnd);
      player.classList.remove("is-fall", "behind-pipe");
      player.style.transition = "";
      player.style.opacity = "";
      player.style.transform = "";
      w1Busy = false;
    };
    player.addEventListener("animationend", onEnd);

    setTimeout(() => {
      if (!w1Busy) return;
      player.classList.remove("is-fall", "behind-pipe");
      player.style.transition = "";
      player.style.opacity = "";
      player.style.transform = "";
      w1Busy = false;
    }, 1200);
  }

  function exitWorld1ToPipe(worldEl) {
    if (w1Busy) return;
    const player = worldEl.querySelector(".player");
    const pipe = worldEl.querySelector(".pipe-exit-right");
    if (!player || !pipe) return;

    w1Busy = true;

    const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
    const wRect = worldEl.getBoundingClientRect();
    const pRect = player.getBoundingClientRect();
    const pipeRect = pipe.getBoundingClientRect();

    const playerW = (pRect.width / scale) || 84;
    const pipeLeft = (pipeRect.left - wRect.left) / scale;
    // objetivo: que Mario llegue al “borde” del caño y quede alineado para entrar
    const targetLeft = Math.max(0, Math.min(BASE_W - playerW, pipeLeft + 18));

    const onWalkEnd = () => {
      player.removeEventListener("transitionend", onWalkEnd);

      // parecer que entra al pipe
      player.classList.add("is-enter-pipe");

      setTimeout(() => {
        const next = Math.min(worlds.length - 1, activeIndex + 1);
        setActive(next, true);

        // dejar world-1 listo si vuelven para atrás
        setTimeout(() => {
          player.classList.remove("is-enter-pipe");
          resetWorld1Visuals(worldEl);
          w1Busy = false;
        }, 60);
      }, 420);
    };

    player.addEventListener("transitionend", onWalkEnd);
    const currentLeft = parseFloat(getComputedStyle(player).left) || 0;
    player.style.left = `${targetLeft}px`;
    if (Math.abs(currentLeft - targetLeft) < 2) {
      setTimeout(onWalkEnd, 0);
    }
  }

  function collectNextCoin(worldEl) {
    if (w1Busy) return;

    const set = getSet(activeIndex);
    const idx = nextBulletIndex(worldEl, set);
    if (idx === null) {
      // ya están todos: ahora sí, al apretar flecha, salir por el pipe
      exitWorld1ToPipe(worldEl);
      return;
    }

    const coins = Array.from(worldEl.querySelectorAll(".coin"));
    const coinEl = coins[idx];
    const player = worldEl.querySelector(".player");
    if (!coinEl || !player) return;

    w1Busy = true;

    // calcular posiciones en coordenadas "base" (sin el scale)
    const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
    const wRect = worldEl.getBoundingClientRect();
    const cRect = coinEl.getBoundingClientRect();
    const pRect = player.getBoundingClientRect();

    const coinCenterX = (cRect.left - wRect.left + cRect.width / 2) / scale;
    const playerW = (pRect.width / scale) || 84;
    const targetLeft = Math.max(0, Math.min(BASE_W - playerW, coinCenterX - playerW / 2));

    // caminar hasta la moneda
    const onWalkEnd = () => {
      player.removeEventListener("transitionend", onWalkEnd);

      // salto para agarrar moneda
      player.classList.remove("is-jump");
      void player.offsetWidth;
      player.classList.add("is-jump");

      // en el pico del salto: marcar coin como agarrada + mostrar objetivo
      setTimeout(() => {
        playSfx("coin");
        coinEl.classList.add("is-collected");
        revealBulletOnly(worldEl, idx);
      }, 200);

      // liberar input
      setTimeout(() => {
        player.classList.remove("is-jump");
        w1Busy = false;
      }, 520);
    };

    player.addEventListener("transitionend", onWalkEnd);
    const currentLeft = parseFloat(getComputedStyle(player).left) || 0;
    player.style.left = `${targetLeft}px`;
    if (Math.abs(currentLeft - targetLeft) < 2) {
      // no hubo transición (ya estaba en el punto)
      setTimeout(onWalkEnd, 0);
    }
  }

  // =========================
// End: bandera + castillo + fuegos artificiales
// =========================
let endBusy = false;
let endStarted = false;
let endTimers = [];

function endPlayer(endEl) {
  return endEl?.querySelector(".player");
}

function endSetTimer(fn, ms) {
  const id = setTimeout(fn, ms);
  endTimers.push(id);
  return id;
}

function endClearTimers() {
  endTimers.forEach((id) => clearTimeout(id));
  endTimers = [];
}

function endGetTargetLeftFromEl(endEl, el, xBias = 0) {
  const player = endPlayer(endEl);
  if (!endEl || !el || !player) return null;

  const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
  const wRect = endEl.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();
  const pRect = player.getBoundingClientRect();

  const elCenterX = (eRect.left - wRect.left + eRect.width / 2) / scale + xBias;
  const playerW = (pRect.width / scale) || 84;

  return Math.max(0, Math.min(BASE_W - playerW, elCenterX - playerW / 2));
}

function endGetMastTargetLeft(endEl) {
  const mast = endEl?.querySelector(".mast");
  // un poco a la izquierda del centro del mástil para que parezca que lo “agarra”
  return endGetTargetLeftFromEl(endEl, mast, -10);
}

function endGetCastleDoorTargetLeft(endEl) {
  const castle = endEl?.querySelector(".castle");
  const player = endPlayer(endEl);
  if (!endEl || !castle || !player) return null;

  const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
  const wRect = endEl.getBoundingClientRect();
  const cRect = castle.getBoundingClientRect();
  const pRect = player.getBoundingClientRect();

  // La puerta suele estar aprox a 1/3 del castillo desde la izquierda
  const doorX = (cRect.left - wRect.left + cRect.width * 0.34) / scale;
  const playerW = (pRect.width / scale) || 84;

  return Math.max(0, Math.min(BASE_W - playerW, doorX - playerW / 2));
}

function endWalkTo(endEl, targetLeft, onArrive) {
  const player = endPlayer(endEl);
  if (!player || typeof targetLeft !== "number") return;

  const onWalkEnd = () => {
    player.removeEventListener("transitionend", onWalkEnd);
    onArrive?.();
  };

  player.addEventListener("transitionend", onWalkEnd);
  const currentLeft = parseFloat(getComputedStyle(player).left) || 0;
  player.style.left = `${targetLeft}px`;
  if (Math.abs(currentLeft - targetLeft) < 2) setTimeout(onWalkEnd, 0);
}

function startEndSequence(endEl) {
  if (!endEl) return;

  mountPlayer(endEl);
  const player = endPlayer(endEl);
  if (!player) return;

  endBusy = true;
  endEl.classList.remove("is-finale");

  // Reset visual de bandera
  const flag = endEl.querySelector(".flag-img");
  if (flag) flag.classList.remove("is-down");

  // Reposicionar instantáneo a la izquierda (sin que “entre por derecha”)
  player.classList.remove("is-jump", "is-enter-castle");
  player.style.transition = "none";
  player.style.opacity = "0";
  player.style.left = "-140px";
  player.style.transform = "";
  void player.offsetWidth;
  player.style.opacity = "";
  player.style.transition = ""; // vuelve al transition por CSS (#end .player)

  const mastTarget = endGetMastTargetLeft(endEl);
  const doorTarget = endGetCastleDoorTargetLeft(endEl);

  if (typeof mastTarget !== "number" || typeof doorTarget !== "number") {
    endBusy = false;
    return;
  }

  // 1) caminar al mástil
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      endWalkTo(endEl, mastTarget, () => {
        // 2) saltito para “bajar mástil” (baja bandera)
        player.classList.remove("is-jump");
        void player.offsetWidth;
        player.classList.add("is-jump");

        endSetTimer(() => {
          playSfx("flag");
          if (flag) flag.classList.add("is-down");
        }, 180);

        // 3) esperar que baje la bandera y entrar al castillo
        endSetTimer(() => {
          player.classList.remove("is-jump");
          endWalkTo(endEl, doorTarget, () => {
            player.classList.add("is-enter-castle");

            // 4) final: fuegos + botón reiniciar
            endSetTimer(() => {
              endEl.classList.add("is-finale");
              endBusy = false;
              if (btnRestart) btnRestart.hidden = false;
            }, 560);
          });
        }, 1100);
      });
    });
  });
}

function ensureEndSequence(endEl) {
  if (!endEl || endEl.id !== "end") return;
  if (endStarted) return;

  endStarted = true;
  endClearTimers();
  if (btnRestart) btnRestart.hidden = true;

  // Asegurar que el Mario esté montado en END antes de arrancar
  mountPlayer(endEl);
  endSetTimer(() => startEndSequence(endEl), 60);
}




  // =========================
  // World-2: entrar caminando + objetivos con salto
  // =========================
  function w2Player(worldEl) {
    return worldEl?.querySelector(".player");
  }

  function w2GetBlockTargetLeft(worldEl, blockIdx) {
    const blocks = Array.from(worldEl.querySelectorAll(".qblock"));
    const player = w2Player(worldEl);
    const blockEl = blocks[blockIdx];
    if (!blockEl || !player) return null;

    // calcular posiciones en coordenadas base (sin scale)
    const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
    const wRect = worldEl.getBoundingClientRect();
    const bRect = blockEl.getBoundingClientRect();
    const pRect = player.getBoundingClientRect();

    const blockCenterX = (bRect.left - wRect.left + bRect.width / 2) / scale;
    const playerW = (pRect.width / scale) || 84;

    // centro de Mario alineado con centro del bloque
    return Math.max(0, Math.min(BASE_W - playerW, blockCenterX - playerW / 2));
  }

  function w2WalkTo(worldEl, targetLeft, onArrive) {
    const player = w2Player(worldEl);
    if (!player || typeof targetLeft !== "number") return;

    const onWalkEnd = () => {
      player.removeEventListener("transitionend", onWalkEnd);
      onArrive?.();
    };

    player.addEventListener("transitionend", onWalkEnd);
    const currentLeft = parseFloat(getComputedStyle(player).left) || 0;
    player.style.left = `${targetLeft}px`;
    if (Math.abs(currentLeft - targetLeft) < 2) setTimeout(onWalkEnd, 0);
  }

  function w2JumpHit(worldEl, idx, after) {
    if (w2Busy) return;
    const player = w2Player(worldEl);
    if (!player) return;

    w2Busy = true;

    player.classList.remove("is-jump");
    void player.offsetWidth;
    player.classList.add("is-jump");

    // pico del salto: bonk + revelar
    setTimeout(() => {
      hit(worldEl, idx);
    }, 200);

    setTimeout(() => {
      player.classList.remove("is-jump");
      w2Busy = false;
      after?.();
    }, 520);
  }

  function w2Enter(worldEl) {
    mountPlayer(worldEl);
    const player = w2Player(worldEl);
    if (!player) return;

    w2Busy = true;
    player.classList.remove("is-jump");

    // IMPORTANTE: venimos con el mismo Mario desde el mundo anterior y puede quedar con left muy grande.
    // Si lo reubicamos con transición, se ve que "entra desde la derecha".
    // Entonces: lo ponemos OFFSCREEN IZQUIERDA SIN transición (y sin flash), y recién ahí caminamos.
    player.style.transition = "none";
    player.style.opacity = "0";
    player.style.left = "-140px";
    player.style.transform = "";
    void player.offsetWidth; // force reflow
    player.style.opacity = "";
    player.style.transition = ""; // vuelve al transition por CSS (#world-2 .player)

    const target = w2GetBlockTargetLeft(worldEl, 0);
    if (typeof target !== "number") {
      w2Busy = false;
      return;
    }

    // esperar 2 frames para que tome el left inicial
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        w2WalkTo(worldEl, target, () => {
          w2Busy = false;
        });
      });
    });
  }

  function ensureWorld2Entrance(worldEl) {
    mountPlayer(worldEl);
    const set = getSet(activeIndex);
    if (set.size > 0) return; // si ya empezó, no re-entrar
    if (w2Entered) return;
    w2Entered = true;

    // delay para que no se vea raro con scroll smooth
    setTimeout(() => w2Enter(worldEl), 80);
  }

  function w2HandleSpace(worldEl) {
    if (w2Busy) return;
    const set = getSet(activeIndex);
    if (set.size !== 0) return; // sólo el 1° objetivo con espacio
    w2JumpHit(worldEl, 0);
  }

  function w2HandleArrowRight(worldEl) {
    if (w2Busy) return;
    const set = getSet(activeIndex);
    if (set.size === 0) return; // primero: espacio

    // 1 -> bloque 2, 2 -> bloque 3
    if (set.size >= 1 && set.size <= 2) {
      const idx = set.size;
      const target = w2GetBlockTargetLeft(worldEl, idx);
      if (typeof target !== "number") return;

      w2Busy = true;
      w2WalkTo(worldEl, target, () => {
        w2Busy = false;
        w2JumpHit(worldEl, idx);
      });
      return;
    }

    // con los 3 objetivos: salir caminando a la siguiente pantalla
    if (set.size >= 3) {
      const player = w2Player(worldEl);
      if (!player) return;

      w2Busy = true;
      const offRight = BASE_W + 160;

      const onWalkEnd = () => {
        player.removeEventListener("transitionend", onWalkEnd);
        w2Busy = false;
        setActive(activeIndex + 1, false);
      };

      player.addEventListener("transitionend", onWalkEnd);
      player.style.left = `${offRight}px`;
    }
  }

  // =========================
  // World-3: igual a World-2 (IA) + sin Mario duplicado
  // =========================
  function w3Player(worldEl) {
    return worldEl?.querySelector(".player");
  }

  function w3GetBlockTargetLeft(worldEl, blockIdx) {
    const blocks = Array.from(worldEl.querySelectorAll(".qblock"));
    const player = w3Player(worldEl);
    const blockEl = blocks[blockIdx];
    if (!blockEl || !player) return null;

    const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
    const wRect = worldEl.getBoundingClientRect();
    const bRect = blockEl.getBoundingClientRect();
    const pRect = player.getBoundingClientRect();

    const blockCenterX = (bRect.left - wRect.left + bRect.width / 2) / scale;
    const playerW = (pRect.width / scale) || 84;

    return Math.max(0, Math.min(BASE_W - playerW, blockCenterX - playerW / 2));
  }

  function w3WalkTo(worldEl, targetLeft, onArrive) {
    const player = w3Player(worldEl);
    if (!player || typeof targetLeft !== "number") return;

    const onWalkEnd = () => {
      player.removeEventListener("transitionend", onWalkEnd);
      onArrive?.();
    };

    player.addEventListener("transitionend", onWalkEnd);
    const currentLeft = parseFloat(getComputedStyle(player).left) || 0;
    player.style.left = `${targetLeft}px`;
    if (Math.abs(currentLeft - targetLeft) < 2) setTimeout(onWalkEnd, 0);
  }

  function w3JumpHit(worldEl, idx, after) {
    if (w3Busy) return;
    const player = w3Player(worldEl);
    if (!player) return;

    w3Busy = true;

    player.classList.remove("is-jump");
    void player.offsetWidth;
    player.classList.add("is-jump");

    setTimeout(() => {
      hit(worldEl, idx);
    }, 200);

    setTimeout(() => {
      player.classList.remove("is-jump");
      w3Busy = false;
      after?.();
    }, 520);
  }

  function w3Enter(worldEl) {
    mountPlayer(worldEl);
    const player = w3Player(worldEl);
    if (!player) return;

    w3Busy = true;
    player.classList.remove("is-jump");

    // IMPORTANTE: venimos con el mismo Mario desde world-2 y puede quedar con left muy grande.
    // Si lo reubicamos con transición, se ve que "entra desde la derecha".
    // Entonces: lo ponemos OFFSCREEN IZQUIERDA SIN transición (y sin flash), y recién ahí caminamos.
    player.style.transition = "none";
    player.style.opacity = "0";
    player.style.left = "-140px";
    player.style.transform = "";
    void player.offsetWidth; // force reflow
    player.style.opacity = "";
    player.style.transition = ""; // vuelve al transition por CSS (#world-3 .player)

    const target = w3GetBlockTargetLeft(worldEl, 0);
    if (typeof target !== "number") {
      w3Busy = false;
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        w3WalkTo(worldEl, target, () => {
          w3Busy = false;
        });
      });
    });
  }

  function ensureWorld3Entrance(worldEl) {
    mountPlayer(worldEl);
    const set = getSet(activeIndex);
    if (set.size > 0) return;
    if (w3Entered) return;
    w3Entered = true;
    // Sin delay para evitar el "flash" del Mario viniendo de world-2 en otra posición
    setTimeout(() => w3Enter(worldEl), 0);
  }

  function w3HandleSpace(worldEl) {
    if (w3Busy) return;
    const set = getSet(activeIndex);
    if (set.size !== 0) return;
    w3JumpHit(worldEl, 0);
  }

  function w3HandleArrowRight(worldEl) {
    if (w3Busy) return;
    const set = getSet(activeIndex);
    if (set.size === 0) return;

    if (set.size >= 1 && set.size <= 2) {
      const idx = set.size;
      const target = w3GetBlockTargetLeft(worldEl, idx);
      if (typeof target !== "number") return;

      w3Busy = true;
      w3WalkTo(worldEl, target, () => {
        w3Busy = false;
        w3JumpHit(worldEl, idx);
      });
      return;
    }

    if (set.size >= 3) {
      const player = w3Player(worldEl);
      if (!player) return;

      w3Busy = true;
      const offRight = BASE_W + 160;

      const onWalkEnd = () => {
        player.removeEventListener("transitionend", onWalkEnd);
        w3Busy = false;
        // Instantáneo para evitar doble mundo visible
        setActive(activeIndex + 1, false);
      };

      player.addEventListener("transitionend", onWalkEnd);
      player.style.left = `${offRight}px`;
    }
  }



  function resetEndSequence() {
  entering = false;
  clearTimeout(enterTimer);
  enterTimer = null;

  endBusy = false;
  endStarted = false;
  endClearTimers();

  const endEl = document.getElementById("end");
  if (endEl) {
    endEl.classList.remove("is-finale");
    const flag = endEl.querySelector(".flag-img");
    if (flag) flag.classList.remove("is-down");
  }

  // reset del Mario
  if (mainPlayer) {
    mainPlayer.classList.remove("is-jump", "is-enter-castle");
  }

  if (btnRestart) btnRestart.hidden = true;
}



  

// =========================
// World-4: igual a World-2/3 (entra caminando + objetivos con salto)
// =========================
function w4Player(worldEl) {
  return worldEl?.querySelector(".player");
}

function w4GetBlockTargetLeft(worldEl, blockIdx) {
  const blocks = Array.from(worldEl.querySelectorAll(".qblock"));
  const player = w4Player(worldEl);
  const blockEl = blocks[blockIdx];
  if (!blockEl || !player) return null;

  const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
  const wRect = worldEl.getBoundingClientRect();
  const bRect = blockEl.getBoundingClientRect();
  const pRect = player.getBoundingClientRect();

  const blockCenterX = (bRect.left - wRect.left + bRect.width / 2) / scale;
  const playerW = (pRect.width / scale) || 84;

  return Math.max(0, Math.min(BASE_W - playerW, blockCenterX - playerW / 2));
}

function w4WalkTo(worldEl, targetLeft, onArrive) {
  const player = w4Player(worldEl);
  if (!player || typeof targetLeft !== "number") return;

  const onWalkEnd = () => {
    player.removeEventListener("transitionend", onWalkEnd);
    onArrive?.();
  };

  player.addEventListener("transitionend", onWalkEnd);
  const currentLeft = parseFloat(getComputedStyle(player).left) || 0;
  player.style.left = `${targetLeft}px`;
  if (Math.abs(currentLeft - targetLeft) < 2) setTimeout(onWalkEnd, 0);
}

function w4JumpHit(worldEl, idx, after) {
  if (w4Busy) return;
  const player = w4Player(worldEl);
  if (!player) return;

  w4Busy = true;

  player.classList.remove("is-jump");
  void player.offsetWidth;
  player.classList.add("is-jump");

  // pico del salto: bonk + revelar
  setTimeout(() => {
    hit(worldEl, idx);
  }, 200);

  setTimeout(() => {
    player.classList.remove("is-jump");
    w4Busy = false;
    after?.();
  }, 520);
}

function w4Enter(worldEl) {
  const player = w4Player(worldEl);
  if (!player) return;

  w4Busy = true;
  player.classList.remove("is-jump");

  // Reposicion instantáneo a la izquierda (sin "entrar por derecha")
  const prevTransition = player.style.transition;
  const prevOpacity = player.style.opacity;
  player.style.transition = "none";
  player.style.opacity = "0";
  player.style.left = "-140px";

  const target = w4GetBlockTargetLeft(worldEl, 0);
  if (typeof target !== "number") {
    player.style.opacity = prevOpacity || "";
    player.style.transition = prevTransition || "";
    w4Busy = false;
    return;
  }

  // Restaurar transición y arrancar caminata
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      player.style.transition = prevTransition || "";
      player.style.opacity = prevOpacity || "1";
      w4WalkTo(worldEl, target, () => {
        w4Busy = false;
      });
    });
  });
}

function ensureWorld4Entrance(worldEl) {
  mountPlayer(worldEl);
  const set = getSet(activeIndex);
  if (set.size > 0) return;
  if (w4Entered) return;
  w4Entered = true;
  setTimeout(() => w4Enter(worldEl), 80);
}

function w4HandleSpace(worldEl) {
  if (w4Busy) return;
  const set = getSet(activeIndex);
  if (set.size !== 0) return; // sólo el 1° objetivo con espacio
  w4JumpHit(worldEl, 0);
}

function w4HandleArrowRight(worldEl) {
  if (w4Busy) return;
  const set = getSet(activeIndex);
  const blocksCount = Array.from(worldEl.querySelectorAll(".qblock")).length || 0;
  if (blocksCount === 0) return;

  if (set.size === 0) return; // primero: espacio

  // caminar + salto en cada bloque siguiente
  if (set.size >= 1 && set.size < blocksCount) {
    const idx = set.size; // 1 -> bloque 2, 2 -> bloque 3, etc
    const target = w4GetBlockTargetLeft(worldEl, idx);
    if (typeof target !== "number") return;

    w4Busy = true;
    w4WalkTo(worldEl, target, () => {
      w4Busy = false;
      w4JumpHit(worldEl, idx);
    });
    return;
  }

  // con todos revelados: salir caminando y pasar al siguiente mundo (instantáneo)
  if (set.size >= blocksCount) {
    const player = w4Player(worldEl);
    if (!player) return;

    w4Busy = true;
    const offRight = BASE_W + 160;

    const onWalkEnd = () => {
      player.removeEventListener("transitionend", onWalkEnd);
      w4Busy = false;
      // salto instantáneo para evitar duplicados en scroll smooth
      setActive(activeIndex + 1, false);
    };

    player.addEventListener("transitionend", onWalkEnd);
    player.style.left = `${offRight}px`;
  }
}
function resetAll() {
    revealed.clear();
    worlds.forEach((w) => {
      w.querySelectorAll(".bullet").forEach((li) => li.classList.remove("is-on"));
      w.classList.remove("has-bullets");
      w.querySelectorAll(".qblock").forEach((qb) => {
        qb.classList.remove("is-used");
        qb.classList.remove("is-hit");
      });

      // reset monedas world-1
      w.querySelectorAll(".coin").forEach((c) => c.classList.remove("is-collected"));
      const p = w.querySelector(".player");
      if (p) {
        p.classList.remove("is-jump", "is-enter-pipe");
        p.style.left = "";
        p.style.opacity = "";
        p.style.transform = "";
      }
    });
    w1Busy = false;
    w1Entered = false;
    w2Busy = false;
    w2Entered = false;
    w3Busy = false;
    w3Entered = false;
    w4Busy = false;
    w4Entered = false;
    heroBusy = false;

    introBusy = false;
    introEntered = false;
    introReady = false;
    introDone = false;
    if (introMush) {
      introMush.remove();
      introMush = null;
    }
    resetEndSequence();
  }

  // Click en bloques (fuerza orden 1-2-3)
  worlds.forEach((w, wIdx) => {
    const blocks = Array.from(w.querySelectorAll(".qblock"));
    blocks.forEach((btn, bIdx) => {
      btn.addEventListener("click", () => {
        setActive(wIdx, false);
        hit(w, bIdx);
      });
    });
  });

  // Chips jump
  document.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = Number(btn.getAttribute("data-jump"));
      if (!Number.isNaN(target)) setActive(target, true);
    });
  });

  // Start / Restart
  function startFromHero() {
    if (!mainPlayer || heroBusy) return;
    unlockSfxOnce();
    if (activeIndex !== 0) {
      // si por alguna razón no estamos en hero, simplemente avanzamos
      setActive(1, true);
      return;
    }

    heroBusy = true;
    const heroEl = worlds[0];
    mountPlayer(heroEl);

    // Convertimos el posicionamiento centrado (left:50% + transform)
    // a posicionamiento absoluto por left, para poder "caminar" a la derecha
    const scale = parseFloat(getComputedStyle(scene).getPropertyValue("--scale")) || 1;
    const wRect = heroEl.getBoundingClientRect();
    const pRect = mainPlayer.getBoundingClientRect();
    const currentLeft = (pRect.left - wRect.left) / scale;

    mainPlayer.classList.remove("is-jump", "is-enter-pipe", "is-enter-castle");
    mainPlayer.style.transition = "none";
    mainPlayer.style.opacity = "1";
    mainPlayer.style.transform = "none";
    mainPlayer.style.left = `${Math.max(-140, currentLeft)}px`;

    // doble RAF para asegurar que el navegador aplique el estado inicial
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mainPlayer.style.transition = "left .85s linear";
        mainPlayer.style.left = `${BASE_W + 180}px`;

        const onEnd = () => {
          mainPlayer.removeEventListener("transitionend", onEnd);

          // salto de pantalla instantáneo para evitar cualquier duplicado durante scroll
          setActive(1, false);

          // reset a estilos por defecto (centrado) para la siguiente pantalla
          mainPlayer.style.transition = "";
          mainPlayer.style.left = "";
          mainPlayer.style.transform = "";

          heroBusy = false;
        };
        mainPlayer.addEventListener("transitionend", onEnd);
      });
    });
  }

  btnStart?.addEventListener("click", startFromHero);
  btnRestart?.addEventListener("click", () => {
    resetAll();
    setActive(0, true);
  });

  // Teclado
  window.addEventListener("keydown", (e) => {
    unlockSfxOnce();
    const w = worlds[activeIndex];
    const isEnd = w?.id === "end";
    const isWorld1 = w?.id === "world-1";
    const isWorld2 = w?.id === "world-2";
    const isWorld3 = w?.id === "world-3";
    const isWorld4 = w?.id === "world-4";
    const isIntro = w?.id === "world-intro";

    if (isEnd) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === " " || e.code === "Space") {
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (isIntro) return;
      if (isWorld1) collectNextCoin(w);
      else if (isWorld2) w2HandleArrowRight(w);
      else if (isWorld3) w3HandleArrowRight(w);
      else if (isWorld4) w4HandleArrowRight(w);
      else setActive(activeIndex + 1, false);
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (isIntro) return;
      if (!w1Busy && !w2Busy && !w3Busy && !w4Busy) setActive(activeIndex - 1, false);
    }

    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      if (isIntro) { introHandleSpace(w); return; }
      if (isWorld1) collectNextCoin(w);
      else if (isWorld2) w2HandleSpace(w);
      else if (isWorld3) w3HandleSpace(w);
      else if (isWorld4) w4HandleSpace(w);
      else hit(w);
    }
  }, { passive: false });

  // Scroll sync (si alguien scrollea con trackpad)
  let t = null;
  stage.addEventListener("scroll", () => {
    clearTimeout(t);
    t = setTimeout(syncFromScroll, 80);
  }, { passive: true });

  // init
  applyScale();
  window.addEventListener("resize", applyScale);
  setActive(0, false);
})();