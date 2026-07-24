(() => {
  "use strict";

  const ORIGINAL_SCRIPT = "script.js";
  const START_MARKER = "  function dino() {";
  const END_MARKER = "  function quartz(reward) {";

  const viewportStyles = document.createElement("style");
  viewportStyles.dataset.meteoritoViewportFit = "true";
  viewportStyles.textContent = `
    @media (min-width: 1101px) and (max-height: 850px) {
      html,
      body {
        height: 100%;
        min-height: 100%;
        overflow: hidden;
      }

      body {
        display: grid;
        grid-template-rows: 66px minmax(0, 1fr);
      }

      .game-header {
        min-height: 66px;
      }

      .brand__logo {
        width: 44px;
        height: 44px;
      }

      .brand strong {
        font-size: 0.62rem;
      }

      .brand small {
        font-size: 0.34rem;
      }

      .game-shell {
        width: min(calc(100% - 32px), 1380px);
        height: calc(100dvh - 76px);
        min-height: 0;
        margin-top: 0;
        padding-bottom: 10px;
        grid-template-columns: minmax(280px, 0.38fr) minmax(620px, 1fr);
        align-items: stretch;
        gap: clamp(34px, 4vw, 64px);
      }

      .game-copy {
        align-self: center;
      }

      .eyebrow {
        padding: 7px 10px;
        font-size: 0.37rem;
      }

      .game-copy h1 {
        margin: 20px 0 16px;
        font-size: clamp(1.72rem, 2.75vw, 2.85rem);
        line-height: 1.25;
      }

      .game-copy > p {
        max-width: 350px;
        font-size: 0.86rem;
        line-height: 1.58;
      }

      .mini-stats {
        max-width: 310px;
        margin-top: 24px;
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .mini-stats div {
        min-height: 72px;
        padding: 13px 15px;
        gap: 7px;
      }

      .mini-stats strong {
        font-size: 0.68rem;
      }

      .game-frame {
        min-height: 0;
        height: 100%;
        display: grid;
        grid-template-rows: 36px minmax(0, 1fr) 36px;
      }

      .frame-top,
      .frame-bottom {
        min-height: 36px;
        padding-inline: 14px;
        font-size: 0.32rem;
      }

      .canvas-wrap {
        min-height: 0;
        height: 100%;
        aspect-ratio: auto;
      }

      .overlay {
        padding: 14px;
      }

      .overlay-card {
        width: min(88%, 470px);
        padding: 22px;
      }

      .overlay-card h2 {
        margin: 14px 0;
        font-size: clamp(1.25rem, 2.4vw, 2rem);
        line-height: 1.32;
      }

      .overlay-card p {
        font-size: 0.8rem;
        line-height: 1.5;
      }

      .result-grid {
        margin: 18px 0 2px;
        gap: 8px;
      }

      .result-grid div {
        padding: 12px 8px;
        gap: 7px;
      }

      .result-grid strong {
        font-size: 0.62rem;
      }

      .overlay-card .button {
        min-height: 44px;
        margin-top: 18px;
      }

      .new-record {
        margin-top: 12px;
      }

      .game-footer {
        display: none;
      }
    }

    @media (min-width: 1101px) and (max-height: 720px) {
      body {
        grid-template-rows: 58px minmax(0, 1fr);
      }

      .game-header {
        min-height: 58px;
      }

      .game-shell {
        height: calc(100dvh - 66px);
        padding-bottom: 8px;
      }

      .game-copy h1 {
        margin: 14px 0 12px;
        font-size: clamp(1.55rem, 2.45vw, 2.5rem);
      }

      .mini-stats {
        margin-top: 18px;
      }

      .mini-stats div {
        min-height: 64px;
      }

      .overlay-card {
        padding: 18px 20px;
      }

      .overlay-card h2 {
        margin: 10px 0;
      }

      .result-grid {
        margin-top: 14px;
      }

      .overlay-card .button {
        min-height: 40px;
        margin-top: 14px;
      }
    }
  `;
  document.head.appendChild(viewportStyles);

  const brachiosaurusRenderer = `  function dino() {
    const phase = player.frame;
    const step = Math.floor(phase) % 2;
    const bob = player.grounded ? Math.sin(phase * Math.PI) * 0.28 : 0;
    const x = player.x;
    const y = player.y + bob;
    const p = player.w / 22;

    const R = (a, b, c, d, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x + a * p),
        Math.round(y + b * p),
        Math.ceil(c * p),
        Math.ceil(d * p)
      );
    };

    const cyan = "#65d8ff";
    const light = "#3ec6ff";
    const blue = "#2f8ff0";
    const dark = "#195ec3";
    const violet = "#8347ff";
    const violetDark = "#5d2acb";
    const magenta = "#ff35c7";

    ctx.save();

    ctx.shadowBlur = 2;
    ctx.shadowColor = cyan;

    R(0, 12, 4, 2, blue);
    R(3, 11, 4, 3, blue);
    R(6, 10, 4, 4, light);

    R(7, 9, 7, 6, cyan);
    R(6, 11, 9, 4, light);
    R(8, 14, 6, 2, blue);
    R(7, 15, 7, 1, dark);

    R(12, 7, 3, 7, light);
    R(13, 4, 3, 6, light);
    R(14, 1, 3, 6, cyan);
    R(15, 0, 4, 4, cyan);

    R(16, 0, 4, 4, cyan);
    R(19, 1, 3, 3, cyan);
    R(20, 3, 2, 1, magenta);
    R(18, 1, 1, 1, "#04040d");

    R(10, 11, 4, 4, violet);
    R(12, 8, 2, 5, violet);
    R(13, 5, 2, 4, violet);
    R(13, 11, 1, 4, violetDark);

    if (!player.grounded) {
      R(8, 15, 2, 5, light);
      R(7, 19, 4, 2, dark);
      R(13, 15, 2, 5, light);
      R(13, 19, 4, 2, dark);
    } else if (step === 0) {
      R(8, 15, 2, 6, light);
      R(7, 20, 4, 1, dark);
      R(13, 15, 2, 5, light);
      R(13, 19, 4, 2, dark);
    } else {
      R(8, 15, 2, 5, light);
      R(7, 19, 4, 2, dark);
      R(13, 15, 2, 6, light);
      R(13, 20, 4, 1, dark);
    }

    ctx.shadowBlur = 0;
    R(1, 12, 6, 1, "#8ce7ff");
    R(7, 9, 6, 1, "#8ce7ff");
    R(14, 1, 2, 5, "#8ce7ff");
    R(16, 0, 3, 1, "#8ce7ff");

    ctx.restore();
  }

`;

  async function boot() {
    const response = await fetch(`${ORIGINAL_SCRIPT}?v=brachiosaurio-3`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`No se pudo cargar ${ORIGINAL_SCRIPT}`);
    }

    const source = await response.text();
    const startIndex = source.indexOf(START_MARKER);
    const endIndex = source.indexOf(END_MARKER, startIndex);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No se encontró la función del dinosaurio para reemplazar.");
    }

    const patchedSource =
      source.slice(0, startIndex) +
      brachiosaurusRenderer +
      source.slice(endIndex);

    new Function(`${patchedSource}\n//# sourceURL=meteorito-run-brachiosaurio.js`)();
  }

  boot().catch((error) => {
    console.error("No se pudo aplicar el brachiosaurio:", error);

    const fallback = document.createElement("script");
    fallback.src = ORIGINAL_SCRIPT;
    document.body.appendChild(fallback);
  });
})();
