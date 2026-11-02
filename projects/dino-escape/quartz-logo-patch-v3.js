(() => {
  'use strict';

  const nativeSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');

  if (nativeSrc?.get && nativeSrc?.set) {
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: nativeSrc.configurable,
      enumerable: nativeSrc.enumerable,
      get: nativeSrc.get,
      set(value) {
        const nextValue = String(value || '').includes('../meteorito-run/assets/dino-player.svg')
          ? '../qs-league/assets/logo-dino-cup.png'
          : value;
        nativeSrc.set.call(this, nextValue);
      }
    });
  }

  const quartzLogo = new Image();
  quartzLogo.decoding = 'async';
  quartzLogo.src = 'https://www.quartzsales.com/images/q-02.svg';

  const originalFillText = CanvasRenderingContext2D.prototype.fillText;

  CanvasRenderingContext2D.prototype.fillText = function patchedFillText(text, x, y, maxWidth) {
    const isPowerUpQ = text === 'Q' && String(this.font || '').includes('Press Start 2P');

    if (!isPowerUpQ || !quartzLogo.complete || !quartzLogo.naturalWidth) {
      return maxWidth === undefined
        ? originalFillText.call(this, text, x, y)
        : originalFillText.call(this, text, x, y, maxWidth);
    }

    this.save();
    this.shadowColor = '#ff35c7';
    this.shadowBlur = 10;
    this.drawImage(quartzLogo, -7, -7, 14, 14);
    this.restore();
  };
})();
