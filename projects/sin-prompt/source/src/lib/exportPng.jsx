import { renderToStaticMarkup } from 'react-dom/server';
import PostcardArt from '../components/PostcardArt.jsx';
import { getEmbeddedFontCss, loadFonts } from './fonts.js';

const W = 1200;
const H = 800;
const PAD = 100;
const GAP = 80;

const loadImage = (src) =>
  new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

async function frontImage(designId) {
  const css = await getEmbeddedFontCss();
  let svg = renderToStaticMarkup(<PostcardArt designId={designId} />);
  svg = svg.replace(/<svg([^>]*)>/, `<svg$1 width="${W}" height="${H}"><defs><style>${css}</style></defs>`);
  return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function wrapLines(ctx, text, maxWidth) {
  const out = [];
  text.split(/\n/).forEach((para) => {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    words.forEach((w) => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = w;
      } else line = test;
    });
    out.push(line);
  });
  return out;
}

function drawBack(ctx, x, y, { body, senderName, recipientName, recipientRole }) {
  ctx.save();
  ctx.translate(x, y);
  roundRect(ctx, 0, 0, W, H, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // divisor central
  ctx.strokeStyle = 'rgba(19,13,93,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(760, 90);
  ctx.lineTo(760, H - 90);
  ctx.stroke();

  // mensaje (ajusta el tamaño a la longitud)
  ctx.fillStyle = '#130D5D';
  let size = 40;
  let lines;
  for (; size >= 22; size -= 2) {
    ctx.font = `400 ${size}px Poppins`;
    lines = wrapLines(ctx, body, 600);
    if (lines.length * size * 1.45 < H - 300) break;
  }
  lines.forEach((l, i) => ctx.fillText(l, 80, 120 + size + i * size * 1.45));
  ctx.font = '600 30px Poppins';
  ctx.fillStyle = '#7025E0';
  ctx.fillText('— ' + senderName, 80, H - 90);

  // estampilla
  const sx = 960;
  const sy = 80;
  const g = ctx.createLinearGradient(sx, sy, sx + 160, sy + 190);
  g.addColorStop(0, '#3C9FF1');
  g.addColorStop(0.5, '#463DE1');
  g.addColorStop(1, '#7025E0');
  ctx.fillStyle = g;
  roundRect(ctx, sx, sy, 160, 190, 10);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 44px Poppins';
  ctx.fillText('2026', sx + 26, sy + 160);
  ctx.beginPath();
  ctx.moveTo(sx + 80, sy + 40);
  ctx.lineTo(sx + 118, sy + 105);
  ctx.lineTo(sx + 42, sy + 105);
  ctx.closePath();
  ctx.fill();

  // matasellos
  ctx.strokeStyle = 'rgba(112,37,224,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(880, 330, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '600 15px "JetBrains Mono"';
  ctx.fillStyle = 'rgba(112,37,224,0.75)';
  ctx.textAlign = 'center';
  ctx.fillText('SIN PROMPT', 880, 326);
  ctx.fillText('QS · 2026', 880, 348);
  ctx.textAlign = 'left';

  // destinatario
  ctx.fillStyle = 'rgba(19,13,93,0.55)';
  ctx.font = '600 18px "JetBrains Mono"';
  ctx.fillText('PARA', 820, 470);
  ctx.fillStyle = '#130D5D';
  ctx.font = '600 40px Poppins';
  wrapLines(ctx, recipientName, 320).forEach((l, i) => ctx.fillText(l, 820, 520 + i * 48));
  ctx.font = '400 24px Poppins';
  ctx.fillStyle = 'rgba(19,13,93,0.6)';
  ctx.fillText(recipientRole || '', 820, 640);
  ctx.strokeStyle = 'rgba(19,13,93,0.15)';
  [540, 600, 660].forEach((ly) => {
    ctx.beginPath();
    ctx.moveTo(820, ly + 14);
    ctx.lineTo(1120, ly + 14);
    ctx.stroke();
  });
  ctx.restore();
}

/** Genera el PNG de la postal completa (frente + dorso) y lo descarga. */
export async function downloadPostcardPng(message, filename = 'postal-sin-prompt.png') {
  await loadFonts();
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = PAD * 2 + W * 2 + GAP;
  canvas.height = PAD * 2 + H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#F3F1FA';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // sombra suave de objeto físico
  ctx.save();
  ctx.shadowColor = 'rgba(19,13,93,0.18)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#fff';
  roundRect(ctx, PAD, PAD, W, H, 28);
  ctx.fill();
  roundRect(ctx, PAD + W + GAP, PAD, W, H, 28);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, PAD, PAD, W, H, 28);
  ctx.clip();
  const img = message.drawing ? await loadImage(message.drawing) : await frontImage(message.designId);
  ctx.drawImage(img, PAD, PAD, W, H);
  ctx.restore();

  drawBack(ctx, PAD + W + GAP, PAD, {
    body: message.body,
    senderName: message.sender?.name || '',
    recipientName: message.recipient?.name || '',
    recipientRole: message.recipient?.role || '',
  });

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
