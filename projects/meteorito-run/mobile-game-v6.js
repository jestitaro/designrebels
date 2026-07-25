(() => {
  "use strict";

  const body = document.body;
  const frame = document.querySelector(".game-frame");
  const launch = document.getElementById("mobileGameLaunch");
  const close = document.getElementById("mobileGameClose");
  const soundProxy = document.getElementById("mobileSoundProxy");
  const pauseProxy = document.getElementById("mobilePauseProxy");
  const soundButton = document.getElementById("soundButton");
  const pauseButton = document.getElementById("pauseButton");
  const startOverlay = document.getElementById("startOverlay");

  const syncControls = () => {
    if (soundButton && soundProxy) {
      const pressed = soundButton.getAttribute("aria-pressed") === "true";
      soundProxy.setAttribute("aria-pressed", String(pressed));
      soundProxy.setAttribute("aria-label", pressed ? "Desactivar sonido" : "Activar sonido");
    }

    if (pauseButton && pauseProxy) {
      const paused = pauseButton.classList.contains("is-paused");
      pauseProxy.classList.toggle("is-paused", paused);
      pauseProxy.disabled = pauseButton.disabled;
      pauseProxy.setAttribute("aria-label", paused ? "Continuar partida" : "Pausar partida");
    }
  };

  const refreshGameSize = () => {
    window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 120);
  };

  const requestImmersiveLandscape = async () => {
    try {
      if (frame?.requestFullscreen && !document.fullscreenElement) {
        await frame.requestFullscreen({ navigationUI: "hide" });
      }
    } catch (_) {
      // Algunos navegadores bloquean fullscreen; el lightbox sigue funcionando.
    }

    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock("landscape");
      }
    } catch (_) {
      // Android puede exigir fullscreen o tener la rotación bloqueada.
    }
  };

  const openGame = async () => {
    body.classList.add("mobile-game-open");
    launch?.setAttribute("aria-expanded", "true");

    // Garantiza que el estado inicial y su botón vuelvan a estar visibles.
    if (startOverlay && !document.querySelector(".overlay.is-visible")) {
      startOverlay.classList.add("is-visible");
      startOverlay.setAttribute("aria-hidden", "false");
    }

    syncControls();
    await requestImmersiveLandscape();
    refreshGameSize();
  };

  const closeGame = async () => {
    if (pauseButton && !pauseButton.disabled && !pauseButton.classList.contains("is-paused")) {
      pauseButton.click();
    }

    body.classList.remove("mobile-game-open");
    launch?.setAttribute("aria-expanded", "false");

    try {
      screen.orientation?.unlock?.();
    } catch (_) {}

    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (_) {}

    refreshGameSize();
  };

  launch?.addEventListener("click", openGame);
  close?.addEventListener("click", closeGame);

  soundProxy?.addEventListener("click", () => {
    soundButton?.click();
    syncControls();
  });

  pauseProxy?.addEventListener("click", () => {
    pauseButton?.click();
    syncControls();
  });

  soundButton?.addEventListener("click", () => setTimeout(syncControls, 0));
  pauseButton?.addEventListener("click", () => setTimeout(syncControls, 0));
  document.getElementById("resumeButton")?.addEventListener("click", () => setTimeout(syncControls, 0));
  document.getElementById("startButton")?.addEventListener("click", () => setTimeout(syncControls, 0));
  document.getElementById("restartButton")?.addEventListener("click", () => setTimeout(syncControls, 0));

  window.addEventListener("orientationchange", refreshGameSize);
  window.addEventListener("resize", () => {
    syncControls();
    if (body.classList.contains("mobile-game-open")) refreshGameSize();
  });

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && body.classList.contains("mobile-game-open")) {
      body.classList.remove("mobile-game-open");
      launch?.setAttribute("aria-expanded", "false");
    }
    refreshGameSize();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("mobile-game-open")) closeGame();
  });

  syncControls();
})();