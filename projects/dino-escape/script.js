(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const TILE = 32;
  const COLS = 19;
  const ROWS = 21;
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;

  const MAP_TEMPLATE = [
    '###################',
    '#o.......#.......o#',
    '#.###.##.#.##.###.#',
    '#.....##...##.....#',
    '#.###.#.###.#.###.#',
    '#.....#..#..#.....#',
    '#####.##.#.##.#####',
    '#.......   .......#',
    '#.###.# ### #.###.#',
    '#.....#     #.....#',
    '.....## ### ##.....',
    '#.....#     #.....#',
    '#.###.# ### #.###.#',
    '#.......   .......#',
    '#####.##.#.##.#####',
    '#.....#..#..#.....#',
    '#.###.#.###.#.###.#',
    '#.....##...##.....#',
    '#.###.##.#.##.###.#',
    '#o.......#.......o#',
    '###################'
  ];

  const DIR = {
    up: { x: 0, y: -1, angle: -Math.PI / 2 },
    down: { x: 0, y: 1, angle: Math.PI / 2 },
    left: { x: -1, y: 0, angle: Math.PI },
    right: { x: 1, y: 0, angle: 0 }
  };
  const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const meteorColors = ['#ff35c7', '#8347ff', '#15d9ff', '#b8ff3d'];
  const $ = id => document.getElementById(id);

  const ui = {
    score: $('scoreValue'), level: $('levelValue'), lives: $('livesValue'),
    outsideBest: $('outsideBest'), outsideLevel: $('outsideLevel'),
    start: $('startOverlay'), pause: $('pauseOverlay'), gameOver: $('gameOverOverlay'),
    finalScore: $('finalScore'), finalBest: $('finalBest'),
    pauseButton: $('pauseButton'), mobilePause: $('mobilePause'),
    sound: $('soundButton'), mobileSound: $('mobileSound')
  };

  const dinoImg = new Image();
  dinoImg.src = '../meteorito-run/assets/dino-player.svg';

  let map = [];
  let dotsLeft = 0;
  let score = 0;
  let level = 1;
  let lives = 3;
  let state = 'ready';
  let poweredUntil = 0;
  let combo = 0;
  let muted = true;
  let audio = null;
  let last = performance.now();
  let raf = 0;
  let invulnerableUntil = 0;
  let best = Number(localStorage.getItem('dinoEscapeBest') || 0);
  let bestLevel = Number(localStorage.getItem('dinoEscapeBestLevel') || 1);

  const player = { x: 9, y: 15, dir: 'left', next: 'left', speed: 5.15 };
  const enemies = meteorColors.map((color, index) => ({
    x: [8, 10, 8, 10][index], y: [9, 9, 11, 11][index],
    spawnX: [8, 10, 8, 10][index], spawnY: [9, 9, 11, 11][index],
    dir: ['left', 'right', 'up', 'down'][index], next: 'left',
    color, personality: index, safeUntil: 0, speed: 3.2
  }));

  function buildMap() {
    map = MAP_TEMPLATE.map(row => row.split(''));
    dotsLeft = 0;
    map.forEach(row => row.forEach(cell => {
      if (cell === '.' || cell === 'o') dotsLeft += 1;
    }));
  }

  function resetPositions() {
    Object.assign(player, { x: 9, y: 15, dir: 'left', next: 'left' });
    enemies.forEach((enemy, index) => {
      enemy.x = enemy.spawnX;
      enemy.y = enemy.spawnY;
      enemy.dir = ['left', 'right', 'up', 'down'][index];
      enemy.next = enemy.dir;
      enemy.safeUntil = performance.now() + 950;
    });
    invulnerableUntil = performance.now() + 1000;
  }

  function updateHud() {
    ui.score.textContent = String(score).padStart(6, '0');
    ui.level.textContent = String(level).padStart(2, '0');
    ui.lives.textContent = String(lives).padStart(2, '0');
    ui.outsideBest.textContent = String(Math.max(best, score)).padStart(6, '0');
    ui.outsideLevel.textContent = String(bestLevel).padStart(2, '0');
  }

  function setOverlay(element, visible) {
    element.classList.toggle('is-visible', visible);
    element.setAttribute('aria-hidden', String(!visible));
  }

  function hideOverlays() {
    [ui.start, ui.pause, ui.gameOver].forEach(element => setOverlay(element, false));
  }

  function isWall(x, y) {
    const tx = ((Math.round(x) % COLS) + COLS) % COLS;
    const ty = Math.round(y);
    return ty < 0 || ty >= ROWS || map[ty][tx] === '#';
  }

  function centered(entity) {
    return Math.abs(entity.x - Math.round(entity.x)) < 0.055 &&
      Math.abs(entity.y - Math.round(entity.y)) < 0.055;
  }

  function canMove(entity, direction) {
    const vector = DIR[direction];
    if (!vector) return false;
    const x = Math.round(entity.x) + vector.x;
    const y = Math.round(entity.y) + vector.y;
    if (x < 0 || x >= COLS) return y === 10;
    return !isWall(x, y);
  }

  function move(entity, dt) {
    if (centered(entity)) {
      entity.x = Math.round(entity.x);
      entity.y = Math.round(entity.y);
      if (entity.next && canMove(entity, entity.next)) entity.dir = entity.next;
      if (!canMove(entity, entity.dir)) return;
    }
    const vector = DIR[entity.dir];
    entity.x += vector.x * entity.speed * dt;
    entity.y += vector.y * entity.speed * dt;
    if (entity.x < -0.55) entity.x = COLS - 0.45;
    if (entity.x > COLS - 0.45) entity.x = -0.55;
  }

  function availableDirections(enemy) {
    const directions = ['up', 'down', 'left', 'right'].filter(dir => canMove(enemy, dir));
    return directions.length > 1 ? directions.filter(dir => dir !== opposite[enemy.dir]) : directions;
  }

  function targetFor(enemy) {
    if (enemy.personality === 0) return { x: player.x, y: player.y };
    if (enemy.personality === 1) {
      const vector = DIR[player.dir];
      return { x: player.x + vector.x * 4, y: player.y + vector.y * 4 };
    }
    if (enemy.personality === 2) {
      return Math.random() < 0.42
        ? { x: Math.random() * COLS, y: Math.random() * ROWS }
        : { x: player.x, y: player.y };
    }
    return Math.hypot(enemy.x - player.x, enemy.y - player.y) < 5
      ? { x: 1, y: ROWS - 2 }
      : { x: player.x, y: player.y };
  }

  function updateEnemies(dt, now) {
    enemies.forEach(enemy => {
      enemy.speed = now < poweredUntil ? 2.4 : 3.05 + level * 0.13 + enemy.personality * 0.06;
      if (centered(enemy)) {
        const target = now < poweredUntil
          ? { x: COLS - player.x, y: ROWS - player.y }
          : targetFor(enemy);
        const directions = availableDirections(enemy);
        if (directions.length) {
          enemy.next = directions.map(direction => {
            const vector = DIR[direction];
            const distance = Math.abs(target.x - (enemy.x + vector.x)) +
              Math.abs(target.y - (enemy.y + vector.y));
            return { direction, score: distance + Math.random() * (enemy.personality === 2 ? 4 : 1) };
          }).sort((a, b) => a.score - b.score)[0].direction;
        }
      }
      move(enemy, dt);
    });
  }

  function collect(now) {
    const x = ((Math.round(player.x) % COLS) + COLS) % COLS;
    const y = Math.round(player.y);
    const cell = map[y]?.[x];

    if (cell === '.') {
      map[y][x] = ' ';
      dotsLeft -= 1;
      score += 10;
      beep(680, 0.025, 'square', 0.022);
    } else if (cell === 'o') {
      map[y][x] = ' ';
      dotsLeft -= 1;
      score += 100;
      poweredUntil = now + 7600;
      invulnerableUntil = poweredUntil;
      combo = 0;
      beep(190, 0.16, 'sawtooth', 0.07, 520);
    }

    if (dotsLeft === 0 && state === 'playing') nextLevel();
  }

  function collide(now) {
    for (const enemy of enemies) {
      if (now < enemy.safeUntil || Math.hypot(player.x - enemy.x, player.y - enemy.y) > 0.58) continue;

      if (now < poweredUntil) {
        combo += 1;
        score += 200 * (2 ** Math.min(combo - 1, 3));
        enemy.x = enemy.spawnX;
        enemy.y = enemy.spawnY;
        enemy.safeUntil = now + 1100;
        beep(300 + combo * 90, 0.08, 'square', 0.055, 620 + combo * 100);
      } else if (now >= invulnerableUntil) {
        lives -= 1;
        beep(160, 0.35, 'sawtooth', 0.08, 70);
        updateHud();
        if (lives <= 0) {
          endGame();
          return;
        }
        state = 'ready';
        resetPositions();
        window.setTimeout(() => { if (state === 'ready') state = 'playing'; }, 850);
      }
      break;
    }
  }

  function nextLevel() {
    state = 'ready';
    score += 1000 + lives * 250;
    level += 1;
    bestLevel = Math.max(bestLevel, level);
    localStorage.setItem('dinoEscapeBestLevel', String(bestLevel));
    buildMap();
    resetPositions();
    poweredUntil = 0;
    updateHud();
    window.setTimeout(() => { if (state === 'ready') state = 'playing'; }, 900);
  }

  function endGame() {
    state = 'gameover';
    ui.pauseButton.disabled = true;
    ui.mobilePause.disabled = true;
    if (score > best) {
      best = score;
      localStorage.setItem('dinoEscapeBest', String(best));
    }
    ui.finalScore.textContent = String(score).padStart(6, '0');
    ui.finalBest.textContent = String(best).padStart(6, '0');
    setOverlay(ui.gameOver, true);
    updateHud();
  }

  function startGame() {
    score = 0;
    level = 1;
    lives = 3;
    poweredUntil = 0;
    combo = 0;
    buildMap();
    resetPositions();
    hideOverlays();
    state = 'ready';
    updateHud();
    window.setTimeout(() => {
      state = 'playing';
      ui.pauseButton.disabled = false;
      ui.mobilePause.disabled = false;
    }, 650);
    startLoop();
  }

  function togglePause() {
    if (!['playing', 'paused'].includes(state)) return;
    state = state === 'playing' ? 'paused' : 'playing';
    setOverlay(ui.pause, state === 'paused');
    ui.pauseButton.textContent = state === 'paused' ? '▶' : 'Ⅱ';
    ui.mobilePause.textContent = state === 'paused' ? '▶' : 'Ⅱ';
  }

  function setDirection(direction) {
    if (DIR[direction]) player.next = direction;
  }

  function ensureAudio() {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  }

  function beep(startFrequency, duration, type = 'square', volume = 0.04, endFrequency = null) {
    if (muted) return;
    ensureAudio();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, now);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  function toggleSound() {
    muted = !muted;
    [ui.sound, ui.mobileSound].forEach(button => {
      button.setAttribute('aria-pressed', String(!muted));
      button.textContent = muted ? '♪' : '♫';
    });
    if (!muted) beep(520, 0.08, 'square', 0.05, 760);
  }

  function drawBackground(now) {
    ctx.fillStyle = '#050513';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.45, 30, canvas.width / 2, canvas.height * 0.45, canvas.height * 0.75);
    gradient.addColorStop(0, 'rgba(131,71,255,.08)');
    gradient.addColorStop(1, 'rgba(4,4,13,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(21,217,255,.035)';
    for (let x = (now * 0.01) % TILE - TILE; x < canvas.width; x += TILE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
  }

  function drawQuartzSalesLogo(cx, cy, size, now) {
    const pulse = 1 + Math.sin(now * 0.009 + cx) * 0.08;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = '#ff35c7';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#f7f5ff';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#7025e0';
    ctx.font = `${Math.round(size * 0.42)}px "Press Start 2P"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Q', 1, 2);
    ctx.restore();
  }

  function drawMaze(now) {
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cell = map[y][x];
        const px = x * TILE;
        const py = y * TILE;
        if (cell === '#') {
          ctx.fillStyle = 'rgba(12,12,39,.98)';
          ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
          ctx.strokeStyle = (x + y) % 5 === 0 ? '#8347ff' : '#15d9ff';
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
          ctx.globalAlpha = 1;
        } else if (cell === '.') {
          ctx.fillStyle = '#f7f5ff';
          ctx.shadowColor = '#15d9ff';
          ctx.shadowBlur = 7;
          ctx.beginPath();
          ctx.arc(px + TILE / 2, py + TILE / 2, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (cell === 'o') {
          drawQuartzSalesLogo(px + TILE / 2, py + TILE / 2, 18, now);
        }
      }
    }
  }

  function drawDino(now) {
    const x = player.x * TILE + TILE / 2;
    const y = player.y * TILE + TILE / 2;
    const direction = DIR[player.dir];
    const powered = now < poweredUntil;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(direction.angle);
    if (dinoImg.complete && dinoImg.naturalWidth) {
      ctx.translate(-16, -16);
      if (player.dir === 'left') {
        ctx.translate(32, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(dinoImg, 0, 0, 32, 31);
    } else {
      ctx.fillStyle = powered ? '#b8ff3d' : '#79ef42';
      ctx.fillRect(-12, -10, 24, 20);
    }
    if (powered) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(184,255,61,.38)';
      ctx.fillRect(-20, -20, 40, 40);
    }
    ctx.restore();
  }

  function drawMeteor(enemy, now) {
    const x = enemy.x * TILE + TILE / 2;
    const y = enemy.y * TILE + TILE / 2;
    const vulnerable = now < poweredUntil;
    const pulse = Math.sin(now * 0.01 + enemy.personality);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(now * 0.0007 * (enemy.personality % 2 ? -1 : 1));
    ctx.shadowColor = vulnerable ? '#15d9ff' : enemy.color;
    ctx.shadowBlur = vulnerable ? 8 : 14;
    ctx.fillStyle = vulnerable ? '#29264a' : enemy.color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = i * Math.PI / 4;
      const radius = 12 + ((i + enemy.personality) % 3) * 1.8 + pulse;
      const pointX = Math.cos(angle) * radius;
      const pointY = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(pointX, pointY); else ctx.lineTo(pointX, pointY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f7f5ff';
    ctx.fillRect(-7, -4, 5, 6);
    ctx.fillRect(2, -4, 5, 6);
    const look = DIR[enemy.dir];
    ctx.fillStyle = vulnerable ? '#15d9ff' : '#050513';
    ctx.fillRect(-5 + look.x, -2 + look.y, 2, 3);
    ctx.fillRect(4 + look.x, -2 + look.y, 2, 3);
    ctx.restore();
  }

  function draw(now) {
    drawBackground(now);
    drawMaze(now);
    enemies.forEach(enemy => drawMeteor(enemy, now));
    drawDino(now);
  }

  function update(dt, now) {
    if (state !== 'playing') return;
    move(player, dt);
    collect(now);
    updateEnemies(dt, now);
    collide(now);
    updateHud();
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.035);
    last = now;
    update(dt, now);
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  document.addEventListener('keydown', event => {
    const keys = {
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right'
    };
    if (keys[event.key]) {
      event.preventDefault();
      setDirection(keys[event.key]);
    } else if (event.key.toLowerCase() === 'p') {
      togglePause();
    }
  }, { passive: false });

  document.querySelectorAll('[data-dir]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      setDirection(button.dataset.dir);
    });
  });

  let touchStart = null;
  $('gameArea').addEventListener('touchstart', event => {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  $('gameArea').addEventListener('touchend', event => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    setDirection(Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'right' : 'left')
      : (dy > 0 ? 'down' : 'up'));
  }, { passive: true });

  $('startButton').onclick = startGame;
  $('restartButton').onclick = startGame;
  $('resumeButton').onclick = togglePause;
  ui.pauseButton.onclick = togglePause;
  ui.mobilePause.onclick = togglePause;
  ui.sound.onclick = toggleSound;
  ui.mobileSound.onclick = toggleSound;
  $('mobileLaunch').onclick = () => {
    document.body.classList.add('mobile-game-open');
    startLoop();
    window.dispatchEvent(new Event('resize'));
  };
  $('mobileClose').onclick = () => {
    document.body.classList.remove('mobile-game-open');
    if (state === 'playing') togglePause();
  };

  buildMap();
  resetPositions();
  updateHud();
  draw(performance.now());
})();