(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const canvas = $("gameCanvas");
  const ctx = canvas.getContext("2d");
  const area = $("gameArea");
  const start = $("startOverlay");
  const countdown = $("countdownOverlay");
  const countdownValue = $("countdownValue");
  const pauseOverlay = $("pauseOverlay");
  const gameOver = $("gameOverOverlay");
  const pauseBtn = $("pauseButton");
  const soundBtn = $("soundButton");
  const scoreEl = $("scoreValue");
  const quartzEl = $("quartzValue");
  const bestEl = $("bestValue");
  const outsideBest = $("outsideBest");
  const outsideLevel = $("outsideLevel");
  const finalScore = $("finalScore");
  const finalBest = $("finalBest");
  const finalQuartz = $("finalQuartz");
  const newRecord = $("newRecord");
  const message = $("gameOverMessage");

  const KEY = "dinoCupMeteoritoRunBest";
  const G = 2100;
  const BASE = 430;
  const MAX = 920;
  const GROUND = 0.79;

  const state = {
    mode: "idle",
    score: 0,
    best: Number(localStorage.getItem(KEY)) || 0,
    level: 1,
    speed: BASE,
    time: 0,
    last: 0,
    obsTimer: 0,
    nextObs: 1.2,
    rewardTimer: 0,
    nextReward: 2.7,
    sound: false,
    obstacles: [],
    rewards: [],
    particles: [],
    stars: [],
    raf: 0,
    audio: null,
    quarzos: 0
  };

  const player = {
    x: 120,
    y: 0,
    w: 76,
    h: 72,
    vy: 0,
    grounded: true,
    frame: 0
  };

  const qLogo = new Image();
  qLogo.decoding = "async";
  qLogo.src = "https://www.quartzsales.com/images/q-02.svg";

  const messages = [
    "Ese meteorito tenía nombre y apellido.",
    "La extinción llegó antes de tiempo.",
    "Faltó reflejo jurásico.",
    "El Cretácico no perdona.",
    "Sobreviviste menos que el Wi-Fi del Kahoot."
  ];

  const rnd = (a, b) => Math.random() * (b - a) + a;
  const fmt = (n) => Math.floor(Math.max(0, n)).toString().padStart(6, "0");
  const ground = () => area.clientHeight * GROUND;
  const hit = (a, b) =>
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;

  function show(el, on) {
    el.classList.toggle("is-visible", on);
    el.setAttribute("aria-hidden", on ? "false" : "true");
  }

  function resize() {
    const r = area.getBoundingClientRect();
    const d = Math.min(devicePixelRatio || 1, 2);

    canvas.width = r.width * d;
    canvas.height = r.height * d;
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    ctx.setTransform(d, 0, 0, d, 0, 0);

    player.x = Math.max(70, r.width * (r.width < 600 ? 0.18 : 0.14));
    player.w = r.width < 600 ? 60 : 76;
    player.h = r.width < 600 ? 58 : 72;

    if (state.mode === "idle") player.y = ground() - player.h;

    state.stars = Array.from(
      { length: Math.max(35, Math.floor(r.width / 18)) },
      (_, i) => ({
        x: (i * 97) % r.width,
        y: 30 + ((i * 53) % (r.height * 0.5)),
        a: 0.2 + (i % 7) * 0.08,
        s: 1 + (i % 3)
      })
    );

    draw();
  }

  function reset() {
    Object.assign(state, {
      score: 0,
      level: 1,
      speed: BASE,
      time: 0,
      obsTimer: 0,
      nextObs: 1.2,
      rewardTimer: 0,
      nextReward: rnd(2.2, 3.7),
      obstacles: [],
      rewards: [],
      particles: [],
      quarzos: 0
    });

    player.y = ground() - player.h;
    player.vy = 0;
    player.grounded = true;
    player.frame = 0;
    pauseBtn.classList.remove("is-paused");
    hud();
  }

  async function begin() {
    if (["playing", "countdown"].includes(state.mode)) return;

    reset();
    state.mode = "countdown";
    show(start, false);
    show(gameOver, false);
    show(pauseOverlay, false);
    show(countdown, true);
    pauseBtn.disabled = true;

    for (const value of ["3", "2", "1", "RUN_"]) {
      countdownValue.textContent = value;
      tone(value === "RUN_" ? 650 : 350, 0.08);
      await new Promise((resolve) =>
        setTimeout(resolve, value === "RUN_" ? 450 : 600)
      );
    }

    show(countdown, false);
    state.mode = "playing";
    pauseBtn.disabled = false;
    state.last = performance.now();
    cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(loop);
  }

  function loop(time) {
    if (state.mode !== "playing") return;

    const dt = Math.min((time - state.last) / 1000, 0.032);
    state.last = time;
    update(dt);
    draw();
    state.raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    state.time += dt;
    state.score += dt * (72 + state.speed * 0.09);
    state.level = 1 + Math.floor(state.score / 650);
    state.speed = Math.min(MAX, BASE + state.time * 13 + state.level * 5);
    state.obsTimer += dt;
    state.rewardTimer += dt;

    if (state.obsTimer > state.nextObs) {
      spawnMeteor();
      state.obsTimer = 0;
      state.nextObs =
        Math.max(0.68, 1.5 - state.time / 120) + Math.random() * 0.45;
    }

    if (state.rewardTimer > state.nextReward) {
      spawnQuartz();
      state.rewardTimer = 0;
      state.nextReward = rnd(2.3, 4.2);
    }

    player.vy += G * dt;
    player.y += player.vy * dt;

    const floor = ground() - player.h;
    if (player.y >= floor) {
      player.y = floor;
      player.vy = 0;
      player.grounded = true;
      player.frame =
        (player.frame + dt * 3.5 * (state.speed / BASE)) % 4;

      if (Math.random() < dt * 4) {
        burst(player.x + player.w * 0.22, ground() - 3, 1, [
          Math.random() > 0.5 ? "#15d9ff" : "#8347ff"
        ]);
      }
    } else {
      player.grounded = false;
    }

    for (const obstacle of state.obstacles) {
      obstacle.x -= state.speed * dt;
      obstacle.r += obstacle.rs * dt;

      if (!obstacle.passed && obstacle.x + obstacle.w < player.x) {
        obstacle.passed = true;
        state.score += 35;
        tone(720, 0.03);
      }
    }

    for (const reward of state.rewards) {
      reward.x -= state.speed * dt;
      reward.phase += dt * 4;
    }

    state.obstacles = state.obstacles.filter(
      (obstacle) => obstacle.x + obstacle.w > -70
    );
    state.rewards = state.rewards.filter(
      (reward) => !reward.got && reward.x + reward.w > -70
    );

    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 420 * dt;
    }

    state.particles = state.particles.filter((particle) => particle.life > 0);

    hud();
    collisions();
  }

  function spawnMeteor() {
    const mobile = area.clientWidth < 600;
    const large =
      Math.random() < Math.min(0.45, 0.18 + state.time / 160);
    const size = large
      ? rnd(mobile ? 48 : 58, mobile ? 66 : 84)
      : rnd(mobile ? 30 : 38, mobile ? 43 : 55);

    state.obstacles.push({
      x: area.clientWidth + size,
      y: ground() - size * 0.76,
      w: size,
      h: size * 0.76,
      r: 0,
      rs: rnd(-1.2, 1.2),
      passed: false
    });
  }

  function spawnQuartz() {
    const size = area.clientWidth < 600 ? 38 : 46;

    state.rewards.push({
      x: area.clientWidth + size + rnd(30, 120),
      y: rnd(
        ground() - player.h * 2.25,
        ground() - player.h * 1.15
      ),
      w: size,
      h: size,
      phase: rnd(0, Math.PI * 2),
      got: false
    });
  }

  function jump() {
    if (state.mode === "paused") {
      resume();
      return;
    }

    if (state.mode !== "playing" || !player.grounded) return;

    player.vy = -(area.clientWidth < 600 ? 850 : 900);
    player.grounded = false;
    burst(player.x + 20, ground() - 4, 8, ["#15d9ff", "#8347ff"]);
    tone(235, 0.08);
  }

  function collisions() {
    const playerBox = {
      x: player.x + player.w * 0.2,
      y: player.y + player.h * 0.15,
      w: player.w * 0.62,
      h: player.h * 0.72
    };

    for (const reward of state.rewards) {
      const rewardBox = {
        x: reward.x + reward.w * 0.12,
        y: reward.y + reward.h * 0.12,
        w: reward.w * 0.76,
        h: reward.h * 0.76
      };

      if (hit(playerBox, rewardBox)) {
        reward.got = true;
        state.quarzos += 1;
        state.score += 150;
        burst(reward.x + reward.w / 2, reward.y + reward.h / 2, 18, [
          "#8347ff",
          "#15d9ff",
          "#ffffff"
        ]);
        pop(reward);
        tone(840, 0.08);
      }
    }

    for (const obstacle of state.obstacles) {
      const obstacleBox = {
        x: obstacle.x + obstacle.w * 0.16,
        y: obstacle.y + obstacle.h * 0.13,
        w: obstacle.w * 0.68,
        h: obstacle.h * 0.74
      };

      if (hit(playerBox, obstacleBox)) {
        end();
        break;
      }
    }
  }

  function pop(reward) {
    const el = document.createElement("span");
    el.className = "quartz-pop";
    el.textContent = "+150";
    el.style.left = `${reward.x + reward.w / 2}px`;
    el.style.top = `${reward.y}px`;
    area.appendChild(el);
    setTimeout(() => el.remove(), 720);
  }

  function end() {
    if (state.mode !== "playing") return;

    state.mode = "gameover";
    cancelAnimationFrame(state.raf);
    pauseBtn.disabled = true;
    pauseBtn.classList.remove("is-paused");

    burst(player.x + player.w / 2, player.y + player.h / 2, 32, [
      "#15d9ff",
      "#ff35c7",
      "#ffd33d",
      "#8347ff"
    ]);

    const score = Math.floor(state.score);
    const record = score > state.best;

    if (record) {
      state.best = score;
      localStorage.setItem(KEY, String(state.best));
    }

    finalScore.textContent = fmt(score);
    finalQuartz.textContent = String(state.quarzos).padStart(2, "0");
    finalBest.textContent = fmt(state.best);
    newRecord.hidden = !record;
    message.textContent =
      messages[Math.floor(Math.random() * messages.length)];

    hud();
    draw();
    setTimeout(() => show(gameOver, true), 350);
  }

  function pause() {
    if (state.mode !== "playing") return;

    state.mode = "paused";
    cancelAnimationFrame(state.raf);
    show(pauseOverlay, true);
    pauseBtn.classList.add("is-paused");
    pauseBtn.setAttribute("aria-label", "Continuar partida");
  }

  function resume() {
    if (state.mode !== "paused") return;

    state.mode = "playing";
    show(pauseOverlay, false);
    pauseBtn.classList.remove("is-paused");
    pauseBtn.setAttribute("aria-label", "Pausar partida");
    state.last = performance.now();
    state.raf = requestAnimationFrame(loop);
  }

  function hud() {
    scoreEl.textContent = fmt(state.score);
    quartzEl.textContent = String(state.quarzos).padStart(2, "0");
    bestEl.textContent = outsideBest.textContent = fmt(state.best);
    outsideLevel.textContent =
      state.best >= 7500
        ? "JOHN HAMMOND"
        : state.best >= 5000
          ? "ALAN GRANT"
          : state.best >= 3000
            ? "IAN MALCOLM"
            : state.best >= 1500
              ? "ELLIE SATTLER"
              : state.best >= 600
                ? "LEX MURPHY"
                : "TIM MURPHY";
  }

  function burst(x, y, n, colors) {
    for (let i = 0; i < n; i += 1) {
      state.particles.push({
        x,
        y,
        vx: rnd(-260, 260),
        vy: rnd(-360, 50),
        life: rnd(0.3, 0.9),
        max: 0.9,
        size: rnd(2, 8),
        c: colors[i % colors.length]
      });
    }
  }

  function draw() {
    const w = area.clientWidth;
    const h = area.clientHeight;
    const g = ground();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#050515");
    gradient.addColorStop(0.5, "#090727");
    gradient.addColorStop(1, "#160833");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    sun(w, h);

    for (const star of state.stars) {
      ctx.fillStyle = `rgba(190,233,255,${star.a})`;
      ctx.fillRect(
        (star.x - state.time * state.speed * 0.03 + w) % w,
        star.y,
        star.s,
        star.s
      );
    }

    ctx.strokeStyle = "rgba(21,217,255,.12)";
    for (let i = -18; i <= 18; i += 1) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * 4, g);
      ctx.lineTo(w / 2 + (i * w) / 18, h);
      ctx.stroke();
    }

    const offset = (state.time * state.speed * 0.008) % 1;
    for (let i = 0; i < 18; i += 1) {
      const t = ((i + offset) % 18) / 18;
      const y = g + (h - g) * t ** 1.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.shadowBlur = 16;
    ctx.shadowColor = "#15d9ff";
    ctx.strokeStyle = "#15d9ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(w, g);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const dash = (state.time * state.speed * 1.1) % 130;
    for (let x = -dash; x < w + 130; x += 130) {
      ctx.strokeStyle = "rgba(21,217,255,.28)";
      ctx.beginPath();
      ctx.moveTo(x, g + 28);
      ctx.lineTo(x + 48, g + 28);
      ctx.stroke();
    }

    dino();

    for (const reward of state.rewards) quartz(reward);
    for (const obstacle of state.obstacles) meteor(obstacle);

    for (const particle of state.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.max);
      ctx.fillStyle = particle.c;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }

    ctx.globalAlpha = 1;
  }

  function sun(w, h) {
    const x = w * 0.76;
    const y = h * 0.36;
    const r = Math.min(w, h) * 0.1;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();

    const gradient = ctx.createLinearGradient(0, y - r, 0, y + r);
    gradient.addColorStop(0, "#ffd33d");
    gradient.addColorStop(0.5, "#ff7547");
    gradient.addColorStop(1, "#ff35c7");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    ctx.fillStyle = "#090727";
    for (let i = 0; i < 7; i += 1) {
      ctx.fillRect(
        x - r,
        y + r * 0.05 + i * r * 0.19,
        r * 2,
        r * (0.045 + i * 0.012)
      );
    }

    ctx.restore();
  }

  function dino() {
    const phase = player.frame;
    const step = Math.floor(phase) % 2;
    const bob = player.grounded ? Math.sin(phase * Math.PI) * 0.65 : 0;
    const push = player.grounded ? Math.cos(phase * Math.PI * 0.5) * 0.3 : 0;
    const x = player.x + push;
    const y = player.y + bob;
    const p = player.w / 22;

    const R = (a, b, c, d, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x + a * p),
        Math.round(y + b * p),
        Math.ceil(c * p),
        Math.ceil(d * p)
      );
    };

    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#15d9ff";

    R(0, 10, 5, 2, "#15d9ff");
    R(3, 9, 6, 3, "#15d9ff");
    R(7, 8, 5, 4, "#15d9ff");
    R(10, 7, 6, 8, "#168dff");
    R(12, 5, 5, 8, "#168dff");
    R(15, 4, 4, 7, "#168dff");
    R(16, 1, 5, 7, "#168dff");
    R(18, 2, 4, 6, "#168dff");
    R(20, 4, 2, 4, "#168dff");
    R(7, 11, 7, 2, "#075ecb");
    R(11, 13, 5, 3, "#075ecb");
    R(15, 9, 3, 5, "#075ecb");
    R(11, 10, 5, 5, "#6f35ff");
    R(13, 9, 4, 4, "#8347ff");
    R(17, 7, 5, 2, "#168dff");
    R(19, 7, 3, 1, "#04040d");
    R(20, 7, 2, 1, "#ff35c7");
    R(18, 8, 4, 1, "#15d9ff");
    R(18, 3, 1, 1, "#02020a");
    R(16, 11, 2, 1, "#15d9ff");
    R(17, 12, 2, 1, "#15d9ff");
    R(18, 12, 1, 2, "#15d9ff");

    if (!player.grounded) {
      R(11, 15, 2, 4, "#168dff");
      R(10, 18, 4, 2, "#168dff");
      R(15, 14, 2, 4, "#168dff");
      R(16, 17, 4, 2, "#168dff");
    } else if (step === 0) {
      R(11, 15, 2, 5, "#168dff");
      R(9, 19, 5, 2, "#168dff");
      R(15, 14, 2, 4, "#168dff");
      R(16, 17, 4, 2, "#168dff");
    } else {
      R(11, 14, 2, 4, "#168dff");
      R(9, 17, 4, 2, "#168dff");
      R(15, 15, 2, 5, "#168dff");
      R(15, 19, 5, 2, "#168dff");
    }

    ctx.shadowBlur = 0;
    R(3, 9, 7, 1, "#24e7ff");
    R(10, 7, 5, 1, "#24e7ff");
    R(15, 4, 4, 1, "#24e7ff");
    R(16, 1, 5, 1, "#24e7ff");

    ctx.restore();
  }

  function quartz(reward) {
    const bob = Math.sin(reward.phase) * 4;
    const cx = reward.x + reward.w / 2;
    const cy = reward.y + reward.h / 2 + bob;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowBlur = 24;
    ctx.shadowColor = "#8347ff";

    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, reward.w * 0.55);
    aura.addColorStop(0, "rgba(131,71,255,.34)");
    aura.addColorStop(1, "rgba(131,71,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, reward.w * 0.55, 0, Math.PI * 2);
    ctx.fill();

    if (qLogo.complete && qLogo.naturalWidth) {
      ctx.save();
      ctx.filter = "brightness(0) invert(1)";
      ctx.drawImage(
        qLogo,
        -reward.w * 0.42,
        -reward.h * 0.42,
        reward.w * 0.84,
        reward.h * 0.84
      );
      ctx.restore();
    } else {
      ctx.save();
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "rgba(255,255,255,.12)";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.fillRect(
        -reward.w * 0.23,
        -reward.w * 0.23,
        reward.w * 0.46,
        reward.w * 0.46
      );
      ctx.strokeRect(
        -reward.w * 0.23,
        -reward.w * 0.23,
        reward.w * 0.46,
        reward.w * 0.46
      );
      ctx.restore();
    }

    ctx.restore();
  }

  function meteor(obstacle) {
    ctx.save();
    ctx.translate(
      obstacle.x + obstacle.w / 2,
      obstacle.y + obstacle.h / 2
    );
    ctx.rotate(obstacle.r);

    const r = obstacle.w / 2;
    const gradient = ctx.createRadialGradient(
      -r * 0.2,
      -r * 0.25,
      r * 0.08,
      0,
      0,
      r
    );

    gradient.addColorStop(0, "#ffd05d");
    gradient.addColorStop(0.3, "#ff7547");
    gradient.addColorStop(0.7, "#d83575");
    gradient.addColorStop(1, "#7025b7");

    ctx.fillStyle = gradient;
    ctx.shadowBlur = 22;
    ctx.shadowColor = "#ff35c7";
    ctx.beginPath();

    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const radius = r * (0.8 + (i % 4) * 0.04);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius * 0.78;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function tone(frequency, duration) {
    if (!state.sound) return;

    if (!state.audio) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      state.audio = new AudioContextClass();
    }

    const oscillator = state.audio.createOscillator();
    const gain = state.audio.createGain();
    const now = state.audio.currentTime;

    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.025;
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(state.audio.destination);
    oscillator.start();
    oscillator.stop(now + duration);
  }

  $("startButton").addEventListener("click", begin);
  $("restartButton").addEventListener("click", begin);
  $("resumeButton").addEventListener("click", resume);
  pauseBtn.addEventListener("click", () => {
    if (state.mode === "playing") pause();
    else if (state.mode === "paused") resume();
  });

  soundBtn.addEventListener("click", () => {
    state.sound = !state.sound;
    soundBtn.setAttribute("aria-pressed", String(state.sound));
    soundBtn.setAttribute(
      "aria-label",
      state.sound ? "Desactivar sonido" : "Activar sonido"
    );
    if (state.sound) tone(520, 0.08);
  });

  const pressJump = (event) => {
    event.preventDefault();
    jump();
  };

  $("mobileJumpButton").addEventListener("pointerdown", pressJump);
  canvas.addEventListener("pointerdown", pressJump);

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "ArrowUp") {
      if (event.repeat) return;
      event.preventDefault();
      jump();
    }

    if (event.code === "KeyP" || event.code === "Escape") {
      event.preventDefault();
      if (state.mode === "playing") pause();
      else if (state.mode === "paused") resume();
    }

    if (
      event.code === "Enter" &&
      (state.mode === "idle" || state.mode === "gameover")
    ) {
      event.preventDefault();
      begin();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.mode === "playing") pause();
  });

  window.addEventListener("resize", resize);

  hud();
  resize();
})();