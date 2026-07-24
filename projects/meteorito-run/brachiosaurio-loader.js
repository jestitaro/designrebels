(() => {
  "use strict";

  const ORIGINAL_SCRIPT = "script.js";
  const START_MARKER = "  function dino() {";
  const END_MARKER = "  function quartz(reward) {";

  const brachiosaurusRenderer = `  function dino() {
    const phase = player.frame;
    const step = Math.floor(phase) % 2;
    const bob = player.grounded ? Math.sin(phase * Math.PI) * 0.38 : 0;
    const x = player.x;
    const y = player.y + bob;
    const p = player.w / 24;

    const R = (a, b, c, d, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x + a * p),
        Math.round(y + b * p),
        Math.ceil(c * p),
        Math.ceil(d * p)
      );
    };

    const cyan = "#15d9ff";
    const blue = "#168dff";
    const dark = "#075ecb";
    const violet = "#8347ff";
    const violetDark = "#5d2acb";

    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = cyan;

    // Cola y lomo escalonados.
    R(0, 13, 4, 2, blue);
    R(3, 12, 4, 3, blue);
    R(6, 11, 5, 5, blue);
    R(9, 10, 7, 7, blue);

    // Cuerpo compacto.
    R(7, 12, 10, 5, blue);
    R(9, 11, 7, 2, cyan);
    R(7, 15, 9, 2, dark);

    // Cuello largo con inclinación suave hacia la cabeza.
    R(14, 8, 4, 7, blue);
    R(15, 5, 4, 7, blue);
    R(16, 2, 4, 6, blue);
    R(17, 1, 5, 4, cyan);

    // Cabeza y hocico.
    R(18, 1, 5, 5, cyan);
    R(21, 3, 3, 3, cyan);
    R(19, 5, 5, 1, dark);
    R(21, 5, 3, 1, "#ff35c7");
    R(21, 2, 1, 1, "#04040d");

    // Panza y franja interna del cuello.
    R(11, 13, 5, 4, violet);
    R(14, 10, 3, 5, violet);
    R(16, 6, 2, 6, violet);
    R(16, 11, 1, 4, violetDark);

    // Patas suaves: cambian apenas entre dos poses.
    if (!player.grounded) {
      R(8, 16, 3, 5, blue);
      R(7, 20, 5, 2, dark);
      R(14, 16, 3, 5, blue);
      R(14, 20, 5, 2, dark);
    } else if (step === 0) {
      R(8, 16, 3, 6, blue);
      R(7, 21, 5, 1, dark);
      R(14, 16, 3, 5, blue);
      R(14, 20, 5, 2, dark);
    } else {
      R(8, 16, 3, 5, blue);
      R(7, 20, 5, 2, dark);
      R(14, 16, 3, 6, blue);
      R(14, 21, 5, 1, dark);
    }

    // Reflejos acotados para conservar el look neon sin tapar el sprite.
    ctx.shadowBlur = 0;
    R(1, 13, 7, 1, "#24e7ff");
    R(9, 10, 6, 1, "#24e7ff");
    R(16, 2, 2, 5, "#24e7ff");
    R(18, 1, 4, 1, "#24e7ff");

    ctx.restore();
  }

`;

  async function boot() {
    const response = await fetch(`${ORIGINAL_SCRIPT}?v=brachiosaurio-1`, {
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

    // Si algo externo falla, conserva el juego original en lugar de dejarlo sin iniciar.
    const fallback = document.createElement("script");
    fallback.src = ORIGINAL_SCRIPT;
    document.body.appendChild(fallback);
  });
})();
