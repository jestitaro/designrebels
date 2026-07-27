(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const TILE = 32;
  const COLS = 19;
  const ROWS = 21;
  const WIDTH = COLS * TILE;
  const HEIGHT = ROWS * TILE;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

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

  const DIRECTIONS = {
    up: { x: 0, y: -1, angle: -Math.PI / 2 },
    down: { x: 0, y: 1, angle: Math.PI / 2 },
    left: { x: -1, y: 0, angle: Math.PI },
    right: { x: 1, y: 0, angle: 0 },
    none: { x: 0, y: 0, angle: 0 }
  };

  const opposite = { up: 'down', down: 'up', left: 'right', right: 'left', none: 'none' };
  const colors = ['#ff35c7', '#8347ff', '#15d9ff', '#b8ff3d'];

  const dom = {
    score: document.getElementById('scoreValue'),
    level: document.getElementById('levelValue'),
    lives: document.getElementById('livesValue'),
    outsideBest: document.getElementById('outsideBest'),
    outsideLevel: document.getElementById('outsideLevel'),
    startOverlay: document.getElementById('startOverlay'),
    countdownOverlay: document.getElementById('countdownOverlay'),
    countdown: document.getElementById('countdownValue'),
    pauseOverlay: document.getElementById('pauseOverlay'),
    levelOverlay: document.getElementById('levelOverlay'),
    nextLevel: document.getElementById('nextLevelValue'),
    gameOverOverlay: document.getElementById('gameOverOverlay'),
    finalScore: document.getElementById('finalScore'),
    finalBest: document.getElementById('finalBest'),
    newRecord: document.getElementById('newRecord'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    resumeButton: document.getElementById('resumeButton'),
    pauseButton: document.getElementById('pauseButton'),
    soundButton: document.getElementById('soundButton'),
    mobileLaunch: document.getElementById('mobileGameLaunch'),
    mobileClose: document.getElementById('mobileGameClose'),
    mobilePause: document.getElementById('mobilePauseProxy'),
    mobileSound: document.getElementById('mobileSoundProxy'),
    gameArea: document.getElementById('gameArea')
  };

  let map = [];
  let pelletsLeft = 0;
  let score = 0;
  let level = 1;
  let lives = 3;
  let best = Number(localStorage.getItem('dinoChompBest') || 0);
  let bestLevel = Number(localStorage.getItem('dinoChompBestLevel') || 1);
  let gameState = 'ready';
  let poweredUntil = 0;
  let combo = 0;
  let bonus = null;
  let collected = 0;
  let totalPellets = 0;
  let lastTime = performance.now();
  let countdownTimer = null;
  let audioContext = null;
  let muted = true;
  let animationId = 0;

  const player = { x: 9, y: 15, dir: 'left', nextDir: 'left', speed: 5.25 };
  const enemies = colors.map((color, index) => ({
    x: [8, 10, 8, 10][index],
    y: [9, 9, 11, 11][index],
    spawnX: [8, 10, 8, 10][index],
    spawnY: [9, 9, 11, 11][index],
    dir: ['left', 'right', 'up', 'down'][index],
    color,
    speed: 3.35 + index * 0.08,
    personality: index,
    safeUntil: 0
  }));

  function createMap() {
    map = MAP_TEMPLATE.map(row => row.split(''));
    pelletsLeft = 0;
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (map[y][x] === '.' || map[y][x] === 'o') pelletsLeft += 1;
      }
    }
    totalPellets = pelletsLeft;
    collected = 0;
    bonus = null;
  }

  function resetPositions() {
    player.x = 9;
    player.y = 15;
    player.dir = 'left';
    player.nextDir = 'left';
    enemies.forEach((enemy, index) => {
      enemy.x = enemy.spawnX;
      enemy.y = enemy.spawnY;
      enemy.dir = ['left', 'right', 'up', 'down'][index];
      enemy.safeUntil = performance.now() + 900;
    });
  }

  function updateHud() {
    dom.score.textContent = String(score).padStart(6, '0');
    dom.level.textContent = String(level).padStart(2, '0');
    dom.lives.textContent = String(lives).padStart(2, '0');
    dom.outsideBest.textContent = String(Math.max(best, score)).padStart(6, '0');
    dom.outsideLevel.textContent = String(bestLevel).padStart(2, '0');
  }

  function setOverlay(element, visible) {
    element.classList.toggle('is-visible', visible);
    element.setAttribute('aria-hidden', String(!visible));
  }

  function hideAllOverlays() {
    [dom.startOverlay, dom.countdownOverlay, dom.pauseOverlay, dom.levelOverlay, dom.gameOverOverlay].forEach(el => setOverlay(el, false));
  }

  function isWall(x, y) {
    const tx = ((Math.round(x) % COLS) + COLS) % COLS;
    const ty = Math.round(y);
    if (ty < 0 || ty >= ROWS) return true;
    return map[ty][tx] === '#';
  }

  function atCenter(entity) {
    return Math.abs(entity.x - Math.round(entity.x)) < 0.055 && Math.abs(entity.y - Math.round(entity.y)) < 0.055;
  }

  function canMove(entity, direction) {
    const d = DIRECTIONS[direction];
    const x = Math.round(entity.x) + d.x;
    const y = Math.round(entity.y) + d.y;
    if (x < 0 || x >= COLS) return y === 10;
    return !isWall(x, y);
  }

  function moveEntity(entity, dt) {
    if (atCenter(entity)) {
      entity.x = Math.round(entity.x);
      entity.y = Math.round(entity.y);
      if (entity.nextDir && canMove(entity, entity.nextDir)) entity.dir = entity.nextDir;
      if (!canMove(entity, entity.dir)) return;
    }
    const d = DIRECTIONS[entity.dir];
    entity.x += d.x * entity.speed * dt;
    entity.y += d.y * entity.speed * dt;
    if (entity.x < -0.55) entity.x = COLS - 0.45;
    if (entity.x > COLS - 0.45) entity.x = -0.55;
  }

  function availableDirections(enemy) {
    const dirs = ['up', 'down', 'left', 'right'].filter(dir => canMove(enemy, dir));
    if (dirs.length > 1) return dirs.filter(dir => dir !== opposite[enemy.dir]);
    return dirs;
  }

  function ghostTarget(enemy) {
    if (enemy.personality === 0) return { x: player.x, y: player.y };
    if (enemy.personality === 1) {
      const d = DIRECTIONS[player.dir];
      return { x: player.x + d.x * 4, y: player.y + d.y * 4 };
    }
    if (enemy.personality === 2) {
      if (Math.random() < .45) return { x: Math.random() * COLS, y: Math.random() * ROWS };
      return { x: player.x, y: player.y };
    }
    const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    return distance < 5 ? { x: 1, y: ROWS - 2 } : { x: player.x, y: player.y };
  }

  function chooseEnemyDirection(enemy, now) {
    const dirs = availableDirections(enemy);
    if (!dirs.length) return opposite[enemy.dir];
    const powered = now < poweredUntil;
    const target = powered ? { x: COLS - player.x, y: ROWS - player.y } : ghostTarget(enemy);
    return dirs.map(dir => {
      const d = DIRECTIONS[dir];
      const distance = Math.abs(target.x - (enemy.x + d.x)) + Math.abs(target.y - (enemy.y + d.y));
      return { dir, score: distance + Math.random() * (enemy.personality === 2 ? 5 : 1.2) };
    }).sort((a, b) => a.score - b.score)[0].dir;
  }

  function updateEnemies(dt, now) {
    enemies.forEach(enemy => {
      enemy.speed = now < poweredUntil ? 2.45 : 3.35 + level * .13 + enemy.personality * .07;
      if (atCenter(enemy)) enemy.nextDir = chooseEnemyDirection(enemy, now);
      moveEntity(enemy, dt);
    });
  }

  function collectTile(now) {
    const x = ((Math.round(player.x) % COLS) + COLS) % COLS;
    const y = Math.round(player.y);
    const cell = map[y]?.[x];
    if (cell === '.') {
      map[y][x] = ' ';
      pelletsLeft -= 1;
      collected += 1;
      score += 10;
      beep(680, .025, 'square', .025);
    } else if (cell === 'o') {
      map[y][x] = ' ';
      pelletsLeft -= 1;
      collected += 1;
      score += 50;
      poweredUntil = now + 7600;
      combo = 0;
      beep(180, .16, 'sawtooth', .07, 520);
    }
    if (!bonus && collected > totalPellets * .48) bonus = { x: 9, y: 10, active: true };
    if (bonus?.active && Math.hypot(player.x - bonus.x, player.y - bonus.y) < .65) {
      bonus.active = false;
      score += 1000;
      beep(420, .2, 'triangle', .08, 980);
    }
    if (pelletsLeft === 0 && gameState === 'playing') completeLevel();
  }

  function checkCollisions(now) {
    for (const enemy of enemies) {
      if (now < enemy.safeUntil || Math.hypot(player.x - enemy.x, player.y - enemy.y) > .58) continue;
      if (now < poweredUntil) {
        combo += 1;
        score += 200 * (2 ** Math.min(combo - 1, 3));
        enemy.x = enemy.spawnX;
        enemy.y = enemy.spawnY;
        enemy.safeUntil = now + 1000;
        beep(260 + combo * 100, .09, 'square', .06, 620 + combo * 120);
      } else {
        loseLife();
      }
      break;
    }
  }

  function loseLife() {
    if (gameState !== 'playing') return;
    lives -= 1;
    beep(180, .42, 'sawtooth', .09, 60);
    updateHud();
    if (lives <= 0) return endGame();
    gameState = 'countdown';
    dom.pauseButton.disabled = true;
    dom.mobilePause.disabled = true;
    resetPositions();
    startCountdown();
  }

  function completeLevel() {
    gameState = 'level';
    score += 1000 + lives * 250;
    level += 1;
    bestLevel = Math.max(bestLevel, level);
    localStorage.setItem('dinoChompBestLevel', String(bestLevel));
    dom.nextLevel.textContent = String(level).padStart(2, '0');
    updateHud();
    setOverlay(dom.levelOverlay, true);
    beep(340, .38, 'triangle', .08, 880);
    window.setTimeout(() => {
      createMap();
      resetPositions();
      poweredUntil = 0;
      setOverlay(dom.levelOverlay, false);
      gameState = 'countdown';
      startCountdown();
    }, 1600);
  }

  function endGame() {
    gameState = 'gameover';
    dom.pauseButton.disabled = true;
    dom.mobilePause.disabled = true;
    const newRecord = score > best;
    if (newRecord) {
      best = score;
      localStorage.setItem('dinoChompBest', String(best));
    }
    dom.finalScore.textContent = String(score).padStart(6, '0');
    dom.finalBest.textContent = String(best).padStart(6, '0');
    dom.newRecord.hidden = !newRecord;
    setOverlay(dom.gameOverOverlay, true);
    updateHud();
  }

  function startGame() {
    clearInterval(countdownTimer);
    score = 0;
    level = 1;
    lives = 3;
    poweredUntil = 0;
    combo = 0;
    createMap();
    resetPositions();
    updateHud();
    hideAllOverlays();
    gameState = 'countdown';
    dom.pauseButton.disabled = true;
    dom.mobilePause.disabled = true;
    startCountdown();
    ensureLoop();
  }

  function startCountdown() {
    let value = 3;
    setOverlay(dom.countdownOverlay, true);
    dom.countdown.textContent = value;
    beep(300, .06, 'square', .04);
    clearInterval(countdownTimer);
    countdownTimer = window.setInterval(() => {
      value -= 1;
      if (value > 0) {
        dom.countdown.textContent = value;
        beep(300 + (3 - value) * 70, .06, 'square', .04);
      } else {
        clearInterval(countdownTimer);
        setOverlay(dom.countdownOverlay, false);
        gameState = 'playing';
        dom.pauseButton.disabled = false;
        dom.mobilePause.disabled = false;
        beep(620, .1, 'square', .05);
      }
    }, 650);
  }

  function togglePause(forceResume = false) {
    if (!['playing', 'paused'].includes(gameState)) return;
    if (forceResume || gameState === 'paused') {
      gameState = 'playing';
      setOverlay(dom.pauseOverlay, false);
      dom.pauseButton.classList.remove('is-paused');
      dom.mobilePause.classList.remove('is-paused');
    } else {
      gameState = 'paused';
      setOverlay(dom.pauseOverlay, true);
      dom.pauseButton.classList.add('is-paused');
      dom.mobilePause.classList.add('is-paused');
    }
  }

  function setDirection(direction) {
    if (DIRECTIONS[direction]) player.nextDir = direction;
  }

  function ensureAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
  }

  function beep(startFrequency, duration, type = 'square', volume = .04, endFrequency = null) {
    if (muted) return;
    ensureAudio();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, now);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  function toggleSound() {
    muted = !muted;
    [dom.soundButton, dom.mobileSound].forEach(button => button.setAttribute('aria-pressed', String(!muted)));
    if (!muted) {
      ensureAudio();
      beep(520, .08, 'square', .05, 760);
    }
  }

  function drawBackground(now) {
    ctx.fillStyle = '#050513';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const gradient = ctx.createRadialGradient(WIDTH * .5, HEIGHT * .45, 20, WIDTH * .5, HEIGHT * .45, HEIGHT * .7);
    gradient.addColorStop(0, 'rgba(131,71,255,.08)');
    gradient.addColorStop(1, 'rgba(4,4,13,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = 'rgba(21,217,255,.035)';
    ctx.lineWidth = 1;
    const offset = (now * .01) % TILE;
    for (let x = -TILE + offset; x < WIDTH; x += TILE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
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
          ctx.globalAlpha = .55;
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
          ctx.globalAlpha = 1;
        } else if (cell === '.') {
          ctx.fillStyle = '#f7f5ff';
          ctx.shadowColor = '#15d9ff';
          ctx.shadowBlur = 7;
          ctx.fillRect(px + TILE / 2 - 2, py + TILE / 2 - 2, 4, 4);
          ctx.shadowBlur = 0;
        } else if (cell === 'o') {
          const pulse = 6 + Math.sin(now * .008) * 2;
          ctx.fillStyle = '#15d9ff';
          ctx.shadowColor = '#15d9ff';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(px + TILE / 2, py + TILE / 2 - pulse);
          ctx.lineTo(px + TILE / 2 + pulse, py + TILE / 2);
          ctx.lineTo(px + TILE / 2, py + TILE / 2 + pulse);
          ctx.lineTo(px + TILE / 2 - pulse, py + TILE / 2);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  function drawBonus(now) {
    if (!bonus?.active) return;
    const x = bonus.x * TILE + TILE / 2;
    const y = bonus.y * TILE + TILE / 2;
    const pulse = 1 + Math.sin(now * .006) * .08;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#8347ff';
    ctx.shadowColor = '#ff35c7';
    ctx.shadowBlur = 20;
    ctx.fillRect(-10, -10, 20, 20);
    ctx.shadowBlur = 0;
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#f7f5ff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QS', 0, 1);
    ctx.restore();
  }

  function drawDino(now) {
    const x = player.x * TILE + TILE / 2;
    const y = player.y * TILE + TILE / 2;
    const direction = DIRECTIONS[player.dir] || DIRECTIONS.right;
    const powered = now < poweredUntil;
    const mouth = .22 + Math.abs(Math.sin(now * .015)) * .34;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(direction.angle);
    ctx.shadowColor = powered ? '#b8ff3d' : '#15d9ff';
    ctx.shadowBlur = powered ? 20 : 10;
    ctx.fillStyle = powered ? '#b8ff3d' : '#79ef42';
    ctx.beginPath();
    ctx.arc(-2, 1, 12, mouth, Math.PI * 2 - mouth);
    ctx.lineTo(13, 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-11, -11, 8, 5);
    ctx.fillRect(-9, 8, 6, 5);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#050513';
    ctx.fillRect(0, -7, 3, 3);
    ctx.fillStyle = '#f7f5ff';
    ctx.fillRect(11, -3, 3, 2);
    ctx.fillRect(8, 0, 3, 2);
    ctx.restore();
  }

  function drawMeteor(enemy, now) {
    const x = enemy.x * TILE + TILE / 2;
    const y = enemy.y * TILE + TILE / 2;
    const powered = now < poweredUntil;
    const pulse = Math.sin(now * .01 + enemy.personality) * 1.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((now * .0006) * (enemy.personality % 2 ? -1 : 1));
    ctx.shadowColor = powered ? '#15d9ff' : enemy.color;
    ctx.shadowBlur = powered ? 9 : 14;
    ctx.fillStyle = powered ? '#29264a' : enemy.color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = i * Math.PI / 4;
      const radius = 12 + ((i + enemy.personality) % 3) * 1.8 + pulse;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f7f5ff';
    ctx.fillRect(-7, -4, 5, 6);
    ctx.fillRect(2, -4, 5, 6);
    const look = DIRECTIONS[enemy.dir];
    ctx.fillStyle = powered ? '#15d9ff' : '#050513';
    ctx.fillRect(-5 + look.x, -2 + look.y, 2, 3);
    ctx.fillRect(4 + look.x, -2 + look.y, 2, 3);
    if (!powered) {
      ctx.fillStyle = 'rgba(247,245,255,.22)';
      ctx.fillRect(-8, 5, 5, 3);
      ctx.fillRect(4, 6, 3, 4);
    }
    ctx.restore();
  }

  function draw(now) {
    drawBackground(now);
    drawMaze(now);
    drawBonus(now);
    enemies.forEach(enemy => drawMeteor(enemy, now));
    drawDino(now);
  }

  function update(dt, now) {
    if (gameState !== 'playing') return;
    moveEntity(player, dt);
    collectTile(now);
    updateEnemies(dt, now);
    checkCollisions(now);
    updateHud();
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, .035);
    lastTime = now;
    update(dt, now);
    draw(now);
    animationId = requestAnimationFrame(loop);
  }

  function ensureLoop() {
    if (!animationId) {
      lastTime = performance.now();
      animationId = requestAnimationFrame(loop);
    }
  }

  function onKeyDown(event) {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    if (keyMap[event.key]) {
      event.preventDefault();
      setDirection(keyMap[event.key]);
    } else if (event.key === 'p' || event.key === 'P') togglePause();
    else if (event.key === 'm' || event.key === 'M') toggleSound();
  }

  let touchStart = null;
  function onTouchStart(event) {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event) {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }

  function openMobileGame() {
    document.body.classList.add('mobile-game-open');
    dom.mobileLaunch.setAttribute('aria-expanded', 'true');
    window.scrollTo(0, 0);
    ensureLoop();
  }

  function closeMobileGame() {
    document.body.classList.remove('mobile-game-open');
    dom.mobileLaunch.setAttribute('aria-expanded', 'false');
    if (gameState === 'playing') togglePause();
  }

  document.addEventListener('keydown', onKeyDown, { passive: false });
  dom.gameArea.addEventListener('touchstart', onTouchStart, { passive: true });
  dom.gameArea.addEventListener('touchend', onTouchEnd, { passive: true });
  document.querySelectorAll('[data-direction]').forEach(button => {
    const direction = button.dataset.direction;
    const activate = event => {
      event.preventDefault();
      button.classList.add('is-active');
      setDirection(direction);
    };
    const deactivate = () => button.classList.remove('is-active');
    button.addEventListener('pointerdown', activate);
    button.addEventListener('pointerup', deactivate);
    button.addEventListener('pointercancel', deactivate);
    button.addEventListener('pointerleave', deactivate);
  });

  dom.startButton.addEventListener('click', startGame);
  dom.restartButton.addEventListener('click', startGame);
  dom.resumeButton.addEventListener('click', () => togglePause(true));
  dom.pauseButton.addEventListener('click', () => togglePause());
  dom.mobilePause.addEventListener('click', () => togglePause());
  dom.soundButton.addEventListener('click', toggleSound);
  dom.mobileSound.addEventListener('click', toggleSound);
  dom.mobileLaunch.addEventListener('click', openMobileGame);
  dom.mobileClose.addEventListener('click', closeMobileGame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState === 'playing') togglePause();
  });

  createMap();
  resetPositions();
  updateHud();
  draw(performance.now());
  ensureLoop();
})();
