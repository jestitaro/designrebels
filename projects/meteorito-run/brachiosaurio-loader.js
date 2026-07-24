(() => {
  "use strict";

  const ORIGINAL_SCRIPT = "script.js";
  const START_MARKER = "  function dino() {";
  const END_MARKER = "  function quartz(reward) {";

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

    // Sin halo grande: apenas un borde suave.
    ctx.shadowBlur = 2;
    ctx.shadowColor = cyan;

    // Cola corta y escalonada.
    R(0, 12, 4, 2, blue);
    R(3, 11, 4, 3, blue);
    R(6, 10, 4, 4, light);

    // Cuerpo compacto.
    R(7, 9, 7, 6, cyan);
    R(6, 11, 9, 4, light);
    R(8, 14, 6, 2, blue);
    R(7, 15, 7, 1, dark);

    // Cuello más largo y angosto.
    R(12, 7, 3, 7, light);
    R(13, 4, 3, 6, light);
    R(14, 1, 3, 6, cyan);
    R(15, 0, 4, 4, cyan);

    // Cabeza pequeña, similar a la referencia.
    R(16, 0, 4, 4, cyan);
    R(19, 1, 3, 3, cyan);
    R(20, 3, 2, 1, magenta);
    R(18, 1, 1, 1, "#04040d");

    // Franja violeta del pecho y panza.
    R(10, 11, 4, 4, violet);
    R(12, 8, 2, 5, violet);
    R(13, 5, 2, 4, violet);
    R(13, 11, 1, 4, violetDark);

    // Patas simples y con movimiento mínimo.
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

    // Reflejos mínimos para conservar el estilo pixel neon.
    ctx.shadowBlur = 0;
    R(1, 12, 6, 1, "#8ce7ff");
    R(7, 9, 6, 1, "#8ce7ff");
    R(14, 1, 2, 5, "#8ce7ff");
    R(16, 0, 3, 1, "#8ce7ff");

    ctx.restore();
  }

`;

  async function boot() {
    const response = await fetch(`${ORIGINAL_SCRIPT}?v=brachiosaurio-2`, {
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
