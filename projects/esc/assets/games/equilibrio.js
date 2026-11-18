/* Recreo — Equilibrio (mecánica tipo "Tango" / Takuzu)
 * Mate y café, mitad y mitad en cada fila y columna, sin tres iguales
 * seguidos. "=" pide iguales y "×" pide distintos. Se arma la grilla
 * completa y después se quitan pistas mientras la solución siga siendo única.
 */
(function (root) {
  const R = (root.Recreo = root.Recreo || {});
  R.games = R.games || {};
  const N = 6, H = N / 2;

  function okAt(g, i, v) {
    const r = (i / N) | 0, c = i % N;
    let rc = 0, cc = 0;
    for (let k = 0; k < N; k++) { if (g[r * N + k] === v) rc++; if (g[k * N + c] === v) cc++; }
    if (rc >= H || cc >= H) return false;
    if (c >= 2 && g[i - 1] === v && g[i - 2] === v) return false;
    if (c >= 1 && c <= N - 2 && g[i - 1] === v && g[i + 1] === v) return false;
    if (c <= N - 3 && g[i + 1] === v && g[i + 2] === v) return false;
    if (r >= 2 && g[i - N] === v && g[i - 2 * N] === v) return false;
    if (r >= 1 && r <= N - 2 && g[i - N] === v && g[i + N] === v) return false;
    if (r <= N - 3 && g[i + N] === v && g[i + 2 * N] === v) return false;
    return true;
  }
  function solve(givens, edges, cap = 2, rng = null) {
    const g = givens.slice();
    const byCell = Array.from({ length: N * N }, () => []);
    edges.forEach(e => { byCell[e.a].push(e); byCell[e.b].push(e); });
    let count = 0, first = null;
    (function bt(i) {
      if (count >= cap) return;
      if (i === N * N) { count++; if (!first) first = g.slice(); return; }
      if (givens[i]) { bt(i + 1); return; }
      for (const v of rng ? rng.shuffle([1, 2]) : [1, 2]) {
        g[i] = 0;
        if (!okAt(g, i, v)) continue;
        g[i] = v;
        if (byCell[i].every(e => !g[e.a] || !g[e.b] || (e.eq ? g[e.a] === g[e.b] : g[e.a] !== g[e.b]))) bt(i + 1);
        g[i] = 0;
        if (count >= cap) return;
      }
    })(0);
    return { count, first };
  }
  function generate(rng) {
    const sol = solve(Array(N * N).fill(0), [], 1, rng).first;
    const all = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const i = r * N + c;
      if (c < N - 1) all.push({ a: i, b: i + 1, eq: sol[i] === sol[i + 1] });
      if (r < N - 1) all.push({ a: i, b: i + N, eq: sol[i] === sol[i + N] });
    }
    let edges = rng.shuffle(all).slice(0, 10);
    const givens = Array(N * N).fill(0);
    const order = rng.shuffle([...Array(N * N).keys()]);
    for (const i of order) { if (solve(givens, edges).count === 1) break; givens[i] = sol[i]; }
    for (const i of rng.shuffle([...Array(N * N).keys()])) {
      if (!givens[i]) continue;
      const v = givens[i]; givens[i] = 0;
      if (solve(givens, edges).count !== 1) givens[i] = v;
    }
    for (const e of rng.shuffle(edges.slice())) {
      const rest = edges.filter(x => x !== e);
      if (solve(givens, rest).count === 1) edges = rest;
    }
    return { givens, edges, solution: sol };
  }

  const ICON = {
    1: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8.6 12.4c0-2.1 2.6-3.3 7.4-3.3s7.4 1.2 7.4 3.3c2.2 3.2 2 9.4-1.2 12.7-2.2 2.3-10.2 2.3-12.4 0-3.2-3.3-3.4-9.5-1.2-12.7z" fill="#7025E0"/><ellipse cx="16" cy="11.2" rx="6.4" ry="1.9" fill="#4a1599"/><path d="M17.6 12 22.4 3" stroke="#b9c3d6" stroke-width="2.2" stroke-linecap="round"/><path d="M11.5 17.5c.3 2.5 1.4 4.3 3 5.2" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
    2: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5.5 12.5h17v5.8a8.5 8.5 0 0 1-17 0z" fill="#3C9FF1"/><path d="M22.5 14.4h1.6a3.6 3.6 0 0 1 0 7.2h-2.3" fill="none" stroke="#3C9FF1" stroke-width="2.4"/><path d="M10.5 3.5c-1.2 1.9 1.2 3.1 0 5M15 3.5c-1.2 1.9 1.2 3.1 0 5" stroke="#8aa3c4" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M9 17c.4 2.4 1.7 4 3.4 4.8" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>'
  };

  function mount(ctx) {
    const { el } = ctx;
    const { givens, edges } = generate(ctx.rng);
    const g = givens.slice();
    let done = false, focus = givens.findIndex(v => !v);

    el.innerHTML = `<div class="board equilibrio" style="--n:${N}" role="grid" aria-label="Tablero de Equilibrio">${g.map((v, i) => {
      const r = edges.find(e => e.a === i && e.b === i + 1), b = edges.find(e => e.a === i && e.b === i + N);
      return `<button class="cell ${givens[i] ? 'given' : ''}" data-i="${i}" role="gridcell" tabindex="${i === focus ? 0 : -1}" ${givens[i] ? 'aria-disabled="true"' : ''}>
        <span class="sym"></span>
        ${r ? `<i class="edge er ${r.eq ? 'eq' : 'nx'}" data-e="${edges.indexOf(r)}" aria-hidden="true">${r.eq ? '=' : '×'}</i>` : ''}
        ${b ? `<i class="edge eb ${b.eq ? 'eq' : 'nx'}" data-e="${edges.indexOf(b)}" aria-hidden="true">${b.eq ? '=' : '×'}</i>` : ''}
      </button>`;
    }).join('')}</div>`;
    const cells = [...el.querySelectorAll('.cell')];
    const edgeEls = [...el.querySelectorAll('.edge')];

    function errors() {
      const bad = new Set(), badE = new Set();
      for (let k = 0; k < N; k++) {
        const row = [...Array(N).keys()].map(c => k * N + c), col = [...Array(N).keys()].map(r => r * N + k);
        [row, col].forEach(line => {
          [1, 2].forEach(v => { if (line.filter(i => g[i] === v).length > H) line.forEach(i => { if (g[i] === v) bad.add(i); }); });
          for (let j = 0; j + 2 < N; j++) if (g[line[j]] && g[line[j]] === g[line[j + 1]] && g[line[j]] === g[line[j + 2]]) [0, 1, 2].forEach(d => bad.add(line[j + d]));
        });
      }
      edges.forEach((e, k) => { if (g[e.a] && g[e.b] && (e.eq ? g[e.a] !== g[e.b] : g[e.a] === g[e.b])) { badE.add(k); bad.add(e.a); bad.add(e.b); } });
      return { bad, badE };
    }
    function render() {
      const { bad, badE } = errors();
      cells.forEach((c, i) => {
        c.querySelector('.sym').innerHTML = g[i] ? ICON[g[i]] : '';
        c.classList.toggle('bad', bad.has(i));
        c.setAttribute('aria-label', `Fila ${((i / N) | 0) + 1}, columna ${i % N + 1}: ${['vacía', 'mate', 'café'][g[i]]}${givens[i] ? ', fija' : ''}`);
      });
      edgeEls.forEach(e => e.classList.toggle('bad', badE.has(+e.dataset.e)));
      const filled = g.filter(Boolean).length;
      ctx.setProgress(filled / (N * N));
      if (filled === N * N && !bad.size) { done = true; el.querySelector('.board').classList.add('solved'); ctx.win(); }
    }
    function cycle(i) { if (done || givens[i]) return; g[i] = (g[i] + 1) % 3; render(); }

    el.addEventListener('click', e => { const c = e.target.closest('.cell'); if (c) cycle(+c.dataset.i); });
    el.addEventListener('keydown', e => {
      const d = { ArrowUp: -N, ArrowDown: N, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!d) return;
      e.preventDefault();
      if ((e.key === 'ArrowLeft' && focus % N === 0) || (e.key === 'ArrowRight' && focus % N === N - 1)) return;
      const nx = focus + d; if (nx < 0 || nx >= N * N) return;
      cells[focus].tabIndex = -1; focus = nx; cells[focus].tabIndex = 0; cells[focus].focus();
    });
    cells.forEach((c, i) => c.addEventListener('focus', () => { focus = i; }));

    ctx.setActions([{ label: 'Borrar', icon: 'trash', onClick: () => { if (!done) { g.forEach((_, i) => { if (!givens[i]) g[i] = 0; }); render(); } } }]);
    render();
    return { destroy() {} };
  }

  R.games.equilibrio = {
    card: '#17b897', id: 'equilibrio', name: 'Equilibrio', kind: 'time', color: '#5932E0', c1: '#3b1fae', c2: '#3C9FF1', light: '#b6a2ff', tag: 'Mate o café',
    help: [`Completá con <span class="inl">${ICON[1]}</span> mate y <span class="inl">${ICON[2]}</span> café: <b>3 de cada uno</b> por fila y por columna.`, 'No puede haber <b>tres iguales seguidos</b>.', '<b>=</b> une celdas iguales y <b>×</b> celdas distintas. Tocá para alternar.'],
    generate, solve, mount
  };
})(typeof window !== 'undefined' ? window : globalThis);
