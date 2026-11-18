/* Recreo — Ruta (mecánica tipo "Zip")
 * Unir los números en orden con un solo trazo que pase por todas las celdas.
 * El tablero sale de un camino hamiltoniano aleatorio (algoritmo "backbite")
 * sobre una serpentina; se validan las reglas, no un único recorrido.
 */
(function (root) {
  const R = (root.Recreo = root.Recreo || {});
  R.games = R.games || {};
  const N = 6, K = 8;

  function generate(rng) {
    let path = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) path.push(r * N + (r % 2 ? N - 1 - c : c));
    const nbrs = i => { const r = (i / N) | 0, c = i % N, out = []; if (r) out.push(i - N); if (r < N - 1) out.push(i + N); if (c) out.push(i - 1); if (c < N - 1) out.push(i + 1); return out; };
    for (let it = 0; it < 4000; it++) {
      if (rng() < 0.5) path.reverse();
      const end = path[0], next = path[1];
      const opts = nbrs(end).filter(v => v !== next);
      if (!opts.length) continue;
      const v = rng.pick(opts), i = path.indexOf(v);
      path = path.slice(0, i).reverse().concat(path.slice(i));
    }
    const idx = new Set([0, N * N - 1]);
    while (idx.size < K) idx.add(2 + rng.int(N * N - 4));
    const numbers = {};
    [...idx].sort((a, b) => a - b).forEach((pi, n) => { numbers[path[pi]] = n + 1; });
    return { numbers, solution: path };
  }

  function mount(ctx) {
    const { el } = ctx;
    const { numbers } = generate(ctx.rng);
    const last = K;
    let path = [], dragging = false, done = false;

    el.innerHTML = `
      <div class="board ruta" style="--n:${N}" tabindex="0" role="grid" aria-label="Tablero de Ruta. Usá las flechas para avanzar y Retroceso para deshacer.">
        <svg class="ruta-path" viewBox="0 0 ${N} ${N}" aria-hidden="true"><polyline points=""/></svg>
        ${Array.from({ length: N * N }, (_, i) => `<div class="cell" role="gridcell" data-i="${i}">${numbers[i] ? `<span class="num">${numbers[i]}</span>` : ''}</div>`).join('')}
      </div>`;
    const board = el.querySelector('.board');
    const cells = [...board.querySelectorAll('.cell')];
    const line = board.querySelector('polyline');

    const adj = (a, b) => { const ar = (a / N) | 0, ac = a % N, br = (b / N) | 0, bc = b % N; return Math.abs(ar - br) + Math.abs(ac - bc) === 1; };
    const reached = () => path.reduce((m, i) => numbers[i] ? Math.max(m, numbers[i]) : m, 0);

    function canAdd(i) {
      if (done || i == null) return false;
      if (!path.length) return numbers[i] === 1;
      const end = path[path.length - 1];
      if (numbers[end] === last) return false;
      if (path.includes(i) || !adj(end, i)) return false;
      if (numbers[i] && numbers[i] !== reached() + 1) { ctx.nudge(cells[i]); return false; }
      return true;
    }
    function render() {
      line.setAttribute('points', path.map(i => `${(i % N) + 0.5},${((i / N) | 0) + 0.5}`).join(' '));
      cells.forEach((c, i) => { c.classList.toggle('on', path.includes(i)); c.classList.toggle('head', i === path[path.length - 1]); });
      ctx.setProgress(path.length / (N * N));
      if (path.length === N * N && numbers[path[path.length - 1]] === last) { done = true; board.classList.add('solved'); ctx.win(); }
    }
    function stepToward(target) {
      for (let guard = 0; guard < 2 * N && path.length; guard++) {
        const end = path[path.length - 1];
        if (end === target) break;
        if (path.length > 1 && path[path.length - 2] === target) { path.pop(); break; }
        const tr = (target / N) | 0, tc = target % N, er = (end / N) | 0, ec = end % N;
        const dr = Math.sign(tr - er), dc = Math.sign(tc - ec);
        const tries = Math.abs(tr - er) >= Math.abs(tc - ec) ? [[dr, 0], [0, dc]] : [[0, dc], [dr, 0]];
        let moved = false;
        for (const [a, b] of tries) {
          if (!a && !b) continue;
          const nx = (er + a) * N + (ec + b);
          if (path.length > 1 && path[path.length - 2] === nx) { path.pop(); moved = true; break; }
          if (canAdd(nx)) { path.push(nx); moved = true; break; }
        }
        if (!moved) break;
      }
      render();
    }
    const cellAt = (x, y) => { const t = document.elementFromPoint(x, y); const c = t && t.closest('.cell'); return c && board.contains(c) ? +c.dataset.i : null; };

    board.addEventListener('pointerdown', e => {
      const i = cellAt(e.clientX, e.clientY);
      if (i == null || done) return;
      const at = path.indexOf(i);
      if (at >= 0) path = path.slice(0, at + 1);
      else if (!path.length || !adj(path[path.length - 1], i)) { if (numbers[i] === 1) path = [i]; else if (path.length) { stepToward(i); } else { ctx.nudge(cells[i]); return; } }
      else if (canAdd(i)) path.push(i);
      dragging = true; board.setPointerCapture(e.pointerId); render();
    });
    board.addEventListener('pointermove', e => {
      if (!dragging) return;
      const i = cellAt(e.clientX, e.clientY);
      if (i == null || i === path[path.length - 1]) return;
      const at = path.indexOf(i);
      if (at >= 0 && at !== path.length - 2) { path = path.slice(0, at + 1); render(); return; }
      stepToward(i);
    });
    const stop = () => { dragging = false; };
    board.addEventListener('pointerup', stop); board.addEventListener('pointercancel', stop);
    board.addEventListener('keydown', e => {
      const dirs = { ArrowUp: -N, ArrowDown: N, ArrowLeft: -1, ArrowRight: 1 };
      if (e.key === 'Backspace') { e.preventDefault(); path.pop(); render(); return; }
      if (!(e.key in dirs) || done) return;
      e.preventDefault();
      if (!path.length) { const one = +Object.keys(numbers).find(k => numbers[k] === 1); path = [one]; render(); return; }
      const end = path[path.length - 1], nx = end + dirs[e.key];
      if ((e.key === 'ArrowLeft' && end % N === 0) || (e.key === 'ArrowRight' && end % N === N - 1) || nx < 0 || nx >= N * N) return;
      if (path[path.length - 2] === nx) path.pop(); else if (canAdd(nx)) path.push(nx);
      render();
    });

    ctx.setActions([
      { label: 'Deshacer', icon: 'undo', onClick: () => { if (!done) { path.pop(); render(); } } },
      { label: 'Borrar', icon: 'trash', onClick: () => { if (!done) { path = []; render(); } } }
    ]);
    render();
    setTimeout(() => board.focus({ preventScroll: true }), 50);
    return { destroy() {} };
  }

  R.games.ruta = {
    card: '#ff6b57', id: 'ruta', name: 'Ruta', kind: 'time', color: '#3C9FF1', c1: '#1f5fc4', c2: '#3C9FF1', light: '#8ec8fa', tag: 'Uní los números',
    help: ['Arrastrá desde el <b>1</b> y uní los números <b>en orden</b> hasta el último.', 'El trazo tiene que pasar <b>por todas las celdas</b>, una sola vez.', 'Volvé sobre tu camino para deshacer. Con teclado: flechas y Retroceso.'],
    generate, mount
  };
})(typeof window !== 'undefined' ? window : globalThis);
