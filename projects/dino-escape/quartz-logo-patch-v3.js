(() => {
  'use strict';

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
    this.shadowBlur = 16;
    this.clearRect(-12, -12, 24, 24);
    this.drawImage(quartzLogo, -11, -11, 22, 22);
    this.restore();
  };
})();
