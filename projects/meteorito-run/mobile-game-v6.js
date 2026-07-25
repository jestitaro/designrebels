(() => {
  "use strict";

  const body = document.body;
  const launch = document.getElementById("mobileGameLaunch");
  const close = document.getElementById("mobileGameClose");
  const soundProxy = document.getElementById("mobileSoundProxy");
  const pauseProxy = document.getElementById("mobilePauseProxy");
  const soundButton = document.getElementById("soundButton");
  const pauseButton = document.getElementById("pauseButton");

  const syncControls = () => {
    if (soundButton && soundProxy) {
      const pressed = soundButton.getAttribute("aria-pressed") === "true";
      soundProxy.setAttribute("aria-pressed", String(pressed));
      soundProxy.setAttribute(
        "aria-label",
        pressed ? "Desactivar sonido" : "Activar sonido"
      );
    }

    if (pauseButton && pauseProxy) {
      const paused = pauseButton.classList.contains("is-paused");
      pauseProxy.classList.toggle("is-paused", paused);
      pauseProxy.disabled = pauseButton.disabled;
      pauseProxy.setAttribute(
        "aria-label",
        paused ? "Continuar partida" : "Pausar partida"
      );
    }
  };

  const refreshGameSize = () => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  };

  const openGame = () => {
    body.classList.add("mobile-game-open");
    launch?.setAttribute("aria-expanded", "true");
    syncControls();
    refreshGameSize();
  };

  const closeGame = () => {
    if (
      pauseButton &&
      !pauseButton.disabled &&
      !pauseButton.classList.contains("is-paused")
    ) {
      pauseButton.click();
    }

    body.classList.remove("mobile-game-open");
    launch?.setAttribute("aria-expanded", "false");
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

  document.getElementById("resumeButton")?.addEventListener("click", () => {
    setTimeout(syncControls, 0);
  });

  document.getElementById("startButton")?.addEventListener("click", () => {
    setTimeout(syncControls, 0);
  });

  document.getElementById("restartButton")?.addEventListener("click", () => {
    setTimeout(syncControls, 0);
  });

  window.addEventListener("orientationchange", refreshGameSize);
  window.addEventListener("resize", syncControls);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("mobile-game-open")) {
      closeGame();
    }
  });

  syncControls();
})();
