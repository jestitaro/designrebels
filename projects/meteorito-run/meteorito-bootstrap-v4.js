(() => {
  "use strict";

  async function boot() {
    const response = await fetch("brachiosaurio-loader.js?v=fix-4", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("No se pudo cargar el motor de Meteorito Run.");
    }

    let loaderSource = await response.text();

    const brokenMarker =
      'source = replaceFunction(source, "  function meteor(obstacle) {", "  function burst(", meteorRenderer);';
    const fixedMarker =
      'source = replaceFunction(source, "  function meteor(obstacle) {", "  function tone(", meteorRenderer);';

    if (!loaderSource.includes(brokenMarker)) {
      throw new Error("No se encontró el marcador que impedía aplicar las mejoras.");
    }

    loaderSource = loaderSource.replace(brokenMarker, fixedMarker);

    new Function(
      `${loaderSource}\n//# sourceURL=meteorito-run-loader-v4.js`
    )();
  }

  boot().catch((error) => {
    console.error("No se pudo iniciar Meteorito Run:", error);

    const fallback = document.createElement("script");
    fallback.src = "script.js?v=fallback-4";
    document.body.appendChild(fallback);
  });
})();
