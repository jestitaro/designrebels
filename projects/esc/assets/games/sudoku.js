/* Recreo — Sudoku mini (6×6, cajas de 2×3)
 * Grilla base válida + permutaciones de bandas, filas, columnas y dígitos;
 * después se vacían celdas mientras la solución siga siendo única.
 */
(function (root) {
  const R = (root.Recreo = root.Recreo || {});
  R.games = R.games || {};
  const N = 6, BR = 2, BC = 3;
  const box = i => (((i / N) | 0) / BR | 0) * (N / BC) + ((i % N) / BC | 0);

  function solveCount(g0, cap = 2) {
    const g = g0.slice();
    let count = 0;
    (function bt() {
      if (count >= cap) return;
      const i = g.indexOf(0);
      if (i < 0) { count++; return; }
      const r = (i / N) | 0, c = i % N, b = box(i);
      for (let v = 1; v <= N; v++) {
        let ok = true;
        for (let k = 0; k < N * N && ok; k++) if (g[k] === v && (((k / N) | 0) === r || k % N === c || box(k) === b)) ok = false;
        if (!ok) continue;
        g[i] = v; bt(); g[i] = 0;
        if (count >= cap) return;
      }
    })();
    return count;
  }
  function generate(rng) {
    const rows = rng.shuffle([0, 1, 2]).flatMap(band => rng.shuffle([0, 1]).map(k => band * 2 + k));
    const cols = rng.shuffle([0, 1]).flatMap(st => rng.shuffle([0, 1, 2]).map(k => st * 3 + k));
    const digits = rng.shuffle([1, 2, 3, 4, 5, 6]);
    const solution = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const rr = rows[r], cc = cols[c];
      solution.push(digits[(3 * (rr % 2) + ((rr / 2) | 0) + cc) % 6]);
    }
    const puzzle = solution.slice();
    // Se frena en 13 pistas: un mini sudoku de pausa, no un desafío de 10 minutos.
    for (const i of rng.shuffle([...Array(N * N).keys()])) {
      if (puzzle.filter(Boolean).length <= 13) break;
      const v = puzzle[i]; puzzle[i] = 0;
      if (solveCount(puzzle) !== 1) puzzle[i] = v;
    }
    return { puzzle, solution };
  }

  function mount(ctx) {
    const { el } = ctx;
    const { puzzle } = generate(ctx.rng);
    const g = puzzle.slice();
    let sel = puzzle.findIndex(v => !v), done = false;

    el.innerHTML = `
      <div class="board sudoku" style="--n:${N}" role="grid" aria-label="Sudoku de 6 por 6">${g.map((v, i) => {
        const r = (i / N) | 0, c = i % N;
        return `<button class="cell ${puzzle[i] ? 'given' : ''} ${c === 2 ? 'sr' : ''} ${r % 2 === 1 && r < N - 1 ? 'sb' : ''}" data-i="${i}" role="gridcell" tabindex="${i === sel ? 0 : -1}"></button>`;
      }).join('')}</div>
      <div class="pad" role="group" aria-label="Números">${[1, 2, 3, 4, 5, 6].map(n => `<button class="key" data-n="${n}">${n}</button>`).join('')}<button class="key wide" data-n="0" aria-label="Borrar número">⌫</button></div>`;
    const cells = [...el.querySelectorAll('.cell')];

    function conflicts() {
      const bad = new Set();
      g.forEach((v, i) => { if (!v) return; g.forEach((w, k) => { if (k !== i && w === v && (((k / N) | 0) === ((i / N) | 0) || k % N === i % N || box(k) === box(i))) bad.add(i); }); });
      return bad;
    }
    function render() {
      const bad = conflicts(), sv = g[sel];
      cells.forEach((c, i) => {
        c.textContent = g[i] || '';
        c.classList.toggle('sel', i === sel);
        c.classList.toggle('peer', sel >= 0 && i !== sel && (((i / N) | 0) === ((sel / N) | 0) || i % N === sel % N || box(i) === box(sel)));
        c.classList.toggle('same', !!sv && g[i] === sv && i !== sel);
        c.classList.toggle('bad', bad.has(i));
        c.setAttribute('aria-label', `Fila ${((i / N) | 0) + 1}, columna ${i % N + 1}: ${g[i] || 'vacía'}${puzzle[i] ? ', fija' : ''}`);
      });
      const filled = g.filter(Boolean).length;
      ctx.setProgress(filled / (N * N));
      if (filled === N * N && !bad.size) { done = true; el.querySelector('.board').classList.add('solved'); ctx.win(); }
    }
    function put(n) { if (done || sel < 0 || puzzle[sel]) return; g[sel] = n; render(); }
    function select(i) { if (sel >= 0) cells[sel].tabIndex = -1; sel = i; cells[i].tabIndex = 0; cells[i].focus(); render(); }

    el.addEventListener('click', e => {
      const c = e.target.closest('.cell'); if (c) { select(+c.dataset.i); return; }
      const k = e.target.closest('.key'); if (k) { put(+k.dataset.n); cells[sel] && cells[sel].focus(); }
    });
    el.addEventListener('keydown', e => {
      if (/^[1-6]$/.test(e.key)) { put(+e.key); return; }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { put(0); return; }
      const d = { ArrowUp: -N, ArrowDown: N, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!d) return;
      e.preventDefault();
      if ((e.key === 'ArrowLeft' && sel % N === 0) || (e.key === 'ArrowRight' && sel % N === N - 1)) return;
      const nx = sel + d; if (nx >= 0 && nx < N * N) select(nx);
    });

    ctx.setActions([{ label: 'Borrar', icon: 'trash', onClick: () => { if (!done) { g.forEach((_, i) => { if (!puzzle[i]) g[i] = 0; }); render(); } } }]);
    render();
    setTimeout(() => cells[sel] && cells[sel].focus({ preventScroll: true }), 50);
    return { destroy() {} };
  }

  R.games.sudoku = {
    card: '#3b82f6', id: 'sudoku', name: 'Sudoku', kind: 'time', color: '#7025E0', c1: '#4c18b0', c2: '#7f4ef0', light: '#c6a6ff', tag: 'Mini, del 1 al 6',
    help: ['Completá con números del <b>1 al 6</b>.', 'Sin repetir en cada <b>fila</b>, <b>columna</b> y <b>caja</b> de 2×3.', 'Elegí una celda y tocá un número (o tipealo).'],
    generate, solveCount, mount
  };
})(typeof window !== 'undefined' ? window : globalThis);
