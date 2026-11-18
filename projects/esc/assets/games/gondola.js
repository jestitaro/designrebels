/* Recreo — Góndola (mecánica tipo "Queens" / Star Battle)
 * Un producto por fila, por columna y por sección de góndola, sin que dos
 * productos se toquen (ni en diagonal). Se generan secciones al azar hasta
 * encontrar un tablero con solución única.
 */
(function (root) {
  const R = (root.Recreo = root.Recreo || {});
  R.games = R.games || {};
  const N = 7;
  const COLORS = ['#d9cffd', '#bfe0fd', '#f3d3f6', '#c8cffd', '#cfeef6', '#e6d9ff', '#e2e8f2'];

  function placeQueens(rng) {
    const cols = [];
    const used = new Set();
    (function bt(r) {
      if (r === N) return true;
      for (const c of rng.shuffle([...Array(N).keys()])) {
        if (used.has(c) || (r && Math.abs(cols[r - 1] - c) < 2)) continue;
        cols[r] = c; used.add(c);
        if (bt(r + 1)) return true;
        used.delete(c);
      }
      return false;
    })(0);
    return cols;
  }
  function growRegions(rng, cols) {
    const reg = Array(N * N).fill(-1);
    cols.forEach((c, r) => { reg[r * N + c] = r; });
    let left = N * N - N;
    while (left) {
      const cand = [];
      reg.forEach((g, i) => {
        if (g >= 0) return;
        const r = (i / N) | 0, c = i % N;
        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([a, b]) => { if (a >= 0 && a < N && b >= 0 && b < N && reg[a * N + b] >= 0) cand.push([i, reg[a * N + b]]); });
      });
      const [i, g] = rng.pick(cand);
      reg[i] = g; left--;
    }
    return reg;
  }
  function countSolutions(reg, cap = 2) {
    let count = 0;
    const colUsed = Array(N).fill(false), regUsed = Array(N).fill(false), at = [];
    (function bt(r) {
      if (count >= cap) return;
      if (r === N) { count++; return; }
      for (let c = 0; c < N; c++) {
        const g = reg[r * N + c];
        if (colUsed[c] || regUsed[g] || (r && Math.abs(at[r - 1] - c) < 2)) continue;
        colUsed[c] = regUsed[g] = true; at[r] = c;
        bt(r + 1);
        colUsed[c] = regUsed[g] = false;
      }
    })(0);
    return count;
  }
  function generate(rng) {
    let best = null;
    for (let t = 0; t < 1500; t++) {
      const cols = placeQueens(rng), reg = growRegions(rng, cols);
      best = { reg, cols };
      if (countSolutions(reg) === 1) { best.unique = true; break; }
    }
    return best;
  }

  const PRODUCT = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="1.5" width="6" height="3.2" rx="1.2" fill="currentColor"/><path d="M7.5 7.5c0-1.6 1.2-2.8 2.8-2.8h3.4c1.6 0 2.8 1.2 2.8 2.8V20a2.5 2.5 0 0 1-2.5 2.5h-4A2.5 2.5 0 0 1 7.5 20z" fill="currentColor"/><rect x="7.5" y="11" width="9" height="5" fill="#fff" opacity=".9"/></svg>';

  function mount(ctx) {
    const { el } = ctx;
    const { reg } = generate(ctx.rng);
    const marks = Array(N * N).fill(0);
    let done = false, focus = 0;

    el.innerHTML = `<div class="board gondola" style="--n:${N}" role="grid" aria-label="Tablero de Góndola">${reg.map((g, i) => {
      const r = (i / N) | 0, c = i % N;
      const b = [r === 0 || reg[i - N] !== g ? 't' : '', r === N - 1 || reg[i + N] !== g ? 'b' : '', c === 0 || reg[i - 1] !== g ? 'l' : '', c === N - 1 || reg[i + 1] !== g ? 'r' : ''].join(' ');
      return `<button class="cell ${b}" data-i="${i}" style="--rc:${COLORS[g]}" role="gridcell" tabindex="${i ? -1 : 0}" aria-label="Fila ${r + 1}, columna ${c + 1}, vacía"></button>`;
    }).join('')}</div>`;
    const cells = [...el.querySelectorAll('.cell')];

    function check() {
      const bad = new Set(), q = [];
      marks.forEach((m, i) => { if (m === 2) q.push(i); });
      const groups = {};
      q.forEach(i => { const r = (i / N) | 0, c = i % N; [['r' + r], ['c' + c], ['g' + reg[i]]].forEach(([k]) => (groups[k] = groups[k] || []).push(i)); });
      Object.values(groups).forEach(list => { if (list.length > 1) list.forEach(i => bad.add(i)); });
      q.forEach(a => q.forEach(b => { if (a < b && Math.abs(((a / N) | 0) - ((b / N) | 0)) <= 1 && Math.abs(a % N - b % N) <= 1) { bad.add(a); bad.add(b); } }));
      return { bad, q };
    }
    function render() {
      const { bad, q } = check();
      cells.forEach((c, i) => {
        c.innerHTML = marks[i] === 2 ? `<span class="prod">${PRODUCT}</span>` : marks[i] === 1 ? '<span class="x" aria-hidden="true">×</span>' : '';
        c.classList.toggle('bad', bad.has(i));
        c.setAttribute('aria-label', `Fila ${((i / N) | 0) + 1}, columna ${i % N + 1}, ${['vacía', 'descartada', 'con producto'][marks[i]]}`);
      });
      ctx.setProgress(q.length / N);
      if (q.length === N && !bad.size) { done = true; el.querySelector('.board').classList.add('solved'); ctx.win(); }
    }
    function cycle(i) { if (done) return; marks[i] = (marks[i] + 1) % 3; render(); }

    // Click = ciclo vacío → × → producto. Arrastrar desde una celda vacía marca × en las que recorrés.
    let painting = null;
    el.addEventListener('pointerdown', e => {
      const c = e.target.closest('.cell'); if (!c || done) return;
      const i = +c.dataset.i;
      painting = { start: i, moved: false };
      el.querySelector('.board').setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => {
      if (!painting || done) return;
      const t = document.elementFromPoint(e.clientX, e.clientY), c = t && t.closest('.cell');
      if (!c) return;
      const i = +c.dataset.i;
      if (i !== painting.start || painting.moved) {
        if (!painting.moved) { painting.moved = true; if (marks[painting.start] === 0) marks[painting.start] = 1; }
        if (marks[i] === 0) marks[i] = 1;
        render();
      }
    });
    el.addEventListener('pointerup', () => { if (painting && !painting.moved) cycle(painting.start); painting = null; });
    el.addEventListener('pointercancel', () => { painting = null; });
    el.addEventListener('keydown', e => {
      const d = { ArrowUp: -N, ArrowDown: N, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (d) {
        e.preventDefault();
        if ((e.key === 'ArrowLeft' && focus % N === 0) || (e.key === 'ArrowRight' && focus % N === N - 1)) return;
        const nx = focus + d; if (nx < 0 || nx >= N * N) return;
        cells[focus].tabIndex = -1; focus = nx; cells[focus].tabIndex = 0; cells[focus].focus();
      } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(focus); }
    });
    cells.forEach((c, i) => c.addEventListener('focus', () => { focus = i; }));

    ctx.setActions([{ label: 'Borrar', icon: 'trash', onClick: () => { if (!done) { marks.fill(0); render(); } } }]);
    render();
    return { destroy() {} };
  }

  R.games.gondola = {
    card: '#8b7cf6', id: 'gondola', name: 'Góndola', kind: 'time', color: '#463DE1', c1: '#2f27b8', c2: '#5f6cf2', light: '#a9b0ff', tag: 'Ubicá los productos',
    help: ['Poné <b>un producto</b> en cada fila, cada columna y cada sección de color.', 'Dos productos <b>no se pueden tocar</b>, ni siquiera en diagonal.', 'Tocá una vez para descartar (×) y dos para ubicar el producto. Arrastrá para descartar varias celdas.'],
    generate, countSolutions, mount
  };
})(typeof window !== 'undefined' ? window : globalThis);
