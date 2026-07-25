(() => {
  "use strict";

  const body = document.body;
  const frame = document.querySelector(".game-frame");
  const canvasWrap = document.querySelector(".canvas-wrap");
  const launch = document.getElementById("mobileGameLaunch");
  const close = document.getElementById("mobileGameClose");
  const soundProxy = document.getElementById("mobileSoundProxy");
  const pauseProxy = document.getElementById("mobilePauseProxy");
  const soundButton = document.getElementById("soundButton");
  const pauseButton = document.getElementById("pauseButton");
  const startOverlay = document.getElementById("startOverlay");

  const forcedStyle = document.createElement("style");
  forcedStyle.id = "meteorito-mobile-forced-layout";
  forcedStyle.textContent = `
    body.mobile-game-open {
      width: 100vw !important;
      height: 100dvh !important;
      min-height: 100dvh !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    body.mobile-game-open .game-frame {
      position: fixed !important;
      z-index: 99999 !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100dvh !important;
      min-height: 0 !important;
      max-width: none !important;
      max-height: none !important;
      margin: 0 !important;
      display: block !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: hidden !important;
      background: #04040d !important;
    }

    body.mobile-game-open .frame-top,
    body.mobile-game-open .frame-bottom {
      display: none !important;
    }

    body.mobile-game-open .canvas-wrap {
      position: absolute !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100dvh !important;
      min-height: 0 !important;
      max-height: none !important;
      aspect-ratio: auto !important;
      border-radius: 0 !important;
      overflow: hidden !important;
    }

    body.mobile-game-open #gameCanvas {
      width: 100% !important;
      height: 100% !important;
    }

    body.mobile-game-open .mobile-game-toolbar {
      position: fixed !important;
      z-index: 100050 !important;
      top: max(6px, env(safe-area-inset-top)) !important;
      right: max(8px, env(safe-area-inset-right)) !important;
      left: max(8px, env(safe-area-inset-left)) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: 7px !important;
      min-height: 40px !important;
      padding: 0 !important;
      pointer-events: none !important;
    }

    body.mobile-game-open .mobile-game-toolbar__title {
      margin-right: auto !important;
      padding: 6px 8px !important;
      color: #15d9ff !important;
      font-family: var(--display) !important;
      font-size: .22rem !important;
      border-radius: 8px !important;
      background: rgba(5,5,18,.82) !important;
      backdrop-filter: blur(8px) !important;
    }

    body.mobile-game-open .mobile-game-toolbar .icon-button {
      width: 36px !important;
      height: 36px !important;
      display: grid !important;
      pointer-events: auto !important;
      background: rgba(5,5,18,.86) !important;
    }

    body.mobile-game-open .hud {
      inset: 10px 132px auto 12px !important;
    }

    body.mobile-game-open .overlay {
      inset: 0 !important;
      padding: 46px 88px 10px 10px !important;
      display: grid !important;
      place-items: center !important;
      overflow: hidden !important;
    }

    body.mobile-game-open .overlay-card {
      width: min(72vw, 430px) !important;
      max-height: calc(100dvh - 56px) !important;
      padding: 12px 16px !important;
      border-radius: 16px !important;
      overflow: hidden !important;
    }

    body.mobile-game-open .overlay-kicker {
      font-size: .24rem !important;
    }

    body.mobile-game-open .overlay-card h2 {
      margin: 5px 0 7px !important;
      font-size: clamp(.75rem, 3vw, 1.05rem) !important;
      line-height: 1.24 !important;
    }

    body.mobile-game-open .overlay-card p {
      font-size: .59rem !important;
      line-height: 1.28 !important;
    }

    body.mobile-game-open .controls-grid {
      margin: 7px 0 !important;
      gap: 5px !important;
    }

    body.mobile-game-open .control {
      min-height: 38px !important;
      padding: 4px !important;
      gap: 4px !important;
    }

    body.mobile-game-open .control small {
      font-size: .21rem !important;
    }

    body.mobile-game-open .key {
      padding: 4px 6px !important;
      font-size: .23rem !important;
    }

    body.mobile-game-open .mouse-icon {
      width: 15px !important;
      height: 21px !important;
    }

    body.mobile-game-open .tap-icon {
      width: 21px !important;
      height: 21px !important;
    }

    body.mobile-game-open .overlay-card .button {
      min-height: 36px !important;
      margin-top: 7px !important;
      font-size: .32rem !important;
    }

    body.mobile-game-open .overlay-note {
      margin-top: 5px !important;
      font-size: .43rem !important;
    }

    body.mobile-game-open .mobile-jump {
      position: fixed !important;
      z-index: 100040 !important;
      right: max(10px, env(safe-area-inset-right)) !important;
      bottom: max(8px, env(safe-area-inset-bottom)) !important;
      width: 70px !important;
      height: 70px !important;
      display: grid !important;
      opacity: .96 !important;
      pointer-events: auto !important;
    }

    body.mobile-game-open .rotate-device {
      position: fixed !important;
      z-index: 100100 !important;
      inset: 0 !important;
    }

    @media (orientation: portrait) {
      body.mobile-game-open .rotate-device { display: grid !important; }
    }

    @media (orientation: landscape) {
      body.mobile-game-open .rotate-device { display: none !important; }
    }
  `;
  document.head.appendChild(forcedStyle);

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
    }, 160);
  };

  const requestImmersiveLandscape = async () => {
    try {
      if (frame?.requestFullscreen && !document.fullscreenElement) {
        await frame.requestFullscreen({ navigationUI: "hide" });
      }
    } catch (_) {}

    try {
      if (screen.orientation?.lock) await screen.orientation.lock("landscape");
    } catch (_) {}
  };

  const openGame = async () => {
    body.classList.add("mobile-game-open");
    launch?.setAttribute("aria-expanded", "true");

    if (startOverlay && !document.querySelector(".overlay.is-visible")) {
      startOverlay.classList.add("is-visible");
      startOverlay.setAttribute("aria-hidden", "false");
    }

    syncControls();
    refreshGameSize();
    await requestImmersiveLandscape();
    refreshGameSize();
  };

  const closeGame = async () => {
    if (pauseButton && !pauseButton.disabled && !pauseButton.classList.contains("is-paused")) {
      pauseButton.click();
    }

    body.classList.remove("mobile-game-open");
    launch?.setAttribute("aria-expanded", "false");

    try { screen.orientation?.unlock?.(); } catch (_) {}
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (_) {}

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