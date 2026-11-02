(() => {
  "use strict";

  async function boot() {
    const response = await fetch("brachiosaurio-loader.js?v=svg-6", {
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

    if (loaderSource.includes(brokenMarker)) {
      loaderSource = loaderSource.replace(brokenMarker, fixedMarker);
    }

    const dinoStart = loaderSource.indexOf("  const dinoRenderer = `");
    const dinoEnd = loaderSource.indexOf("  const spawnMeteorRenderer = `", dinoStart);

    if (dinoStart === -1 || dinoEnd === -1) {
      throw new Error("No se encontró el renderer del dinosaurio.");
    }

    const svgRenderer = `  const dinoRenderer = \`  const dinoSprite = new Image();
  dinoSprite.decoding = "async";
  dinoSprite.src = "dinosaurio-pixel-game.svg?v=1";

  function dino() {
    const bob = player.grounded ? Math.sin(player.frame * Math.PI) * 0.45 : 0;
    const x = Math.round(player.x);
    const y = Math.round(player.y + bob);
    const width = Math.round(player.w);
    const height = Math.round(player.h);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (dinoSprite.complete && dinoSprite.naturalWidth) {
      ctx.drawImage(dinoSprite, x, y, width, height);
    } else {
      ctx.fillStyle = "#18aefd";
      ctx.fillRect(x, y, width, height);
    }

    ctx.restore();
  }

\`;

`;

    loaderSource =
      loaderSource.slice(0, dinoStart) +
      svgRenderer +
      loaderSource.slice(dinoEnd);

    new Function(
      `${loaderSource}\n//# sourceURL=meteorito-run-loader-v6.js`
    )();
  }

  boot().catch((error) => {
    console.error("No se pudo iniciar Meteorito Run:", error);

    const fallback = document.createElement("script");
    fallback.src = "script.js?v=fallback-6";
    document.body.appendChild(fallback);
  });
})();
