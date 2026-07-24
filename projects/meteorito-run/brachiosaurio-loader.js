(() => {
  "use strict";

  const ORIGINAL_SCRIPT = "script.js";

  function replaceFunction(source, startMarker, endMarker, replacement) {
    const startIndex = source.indexOf(startMarker);
    const endIndex = source.indexOf(endMarker, startIndex);
    if (startIndex === -1 || endIndex === -1) throw new Error(`No se pudo reemplazar ${startMarker}`);
    return source.slice(0, startIndex) + replacement + source.slice(endIndex);
  }

  const dinoRenderer = `  function dino() {
    const phase = player.frame;
    const step = Math.floor(phase) % 2;
    const bob = player.grounded ? Math.sin(phase * Math.PI) * 0.28 : 0;
    const x = player.x;
    const y = player.y + bob;
    const p = player.w / 22;
    const R = (a, b, c, d, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x + a * p), Math.round(y + b * p), Math.ceil(c * p), Math.ceil(d * p));
    };
    const cyan = "#65d8ff";
    const light = "#3ec6ff";
    const blue = "#2f8ff0";
    const dark = "#195ec3";
    const violet = "#8347ff";
    const violetDark = "#5d2acb";
    ctx.save();
    ctx.shadowBlur = 2;
    ctx.shadowColor = cyan;
    R(0, 13, 4, 1, blue);
    R(3, 12, 4, 2, blue);
    R(6, 11, 4, 3, light);
    R(7, 9, 7, 6, cyan);
    R(6, 11, 9, 4, light);
    R(8, 14, 6, 2, blue);
    R(7, 15, 7, 1, dark);
    R(12, 7, 3, 7, light);
    R(13, 4, 3, 6, light);
    R(14, 1, 3, 6, cyan);
    R(15, 0, 4, 4, cyan);
    R(16, 0, 4, 4, cyan);
    R(19, 1, 3, 3, cyan);
    R(20, 3, 2, 1, "#ff35c7");
    R(18, 1, 1, 1, "#04040d");
    R(10, 11, 4, 4, violet);
    R(12, 8, 2, 5, violet);
    R(13, 5, 2, 4, violet);
    R(13, 11, 1, 4, violetDark);
    if (!player.grounded) {
      R(8, 15, 2, 5, light); R(7, 19, 4, 2, dark);
      R(13, 15, 2, 5, light); R(13, 19, 4, 2, dark);
    } else if (step === 0) {
      R(8, 15, 2, 6, light); R(7, 20, 4, 1, dark);
      R(13, 15, 2, 5, light); R(13, 19, 4, 2, dark);
    } else {
      R(8, 15, 2, 5, light); R(7, 19, 4, 2, dark);
      R(13, 15, 2, 6, light); R(13, 20, 4, 1, dark);
    }
    ctx.shadowBlur = 0;
    R(1, 13, 6, 1, "#8ce7ff");
    R(7, 9, 6, 1, "#8ce7ff");
    R(14, 1, 2, 5, "#8ce7ff");
    R(16, 0, 3, 1, "#8ce7ff");
    ctx.restore();
  }

`;

  const spawnMeteorRenderer = `  function spawnMeteor() {
    const mobile = area.clientWidth < 600;
    const chance = Math.random();
    const type = state.time > 23 && chance < 0.24
      ? "falling"
      : state.time > 11 && chance < 0.58
        ? "rolling"
        : "normal";
    const large = Math.random() < Math.min(0.38, 0.14 + state.time / 190);
    const size = large
      ? rnd(mobile ? 46 : 56, mobile ? 62 : 78)
      : rnd(mobile ? 29 : 36, mobile ? 42 : 52);

    if (type === "falling") {
      const targetX = rnd(Math.max(player.x + player.w * 2.1, area.clientWidth * 0.38), area.clientWidth - size * 1.4);
      state.obstacles.push({
        type, x: targetX, y: -size * 1.4, targetY: ground() - size * 0.76,
        w: size, h: size * 0.76, r: 0, rs: rnd(-3.2, 3.2), vy: 0,
        warning: mobile ? 0.95 : 1.05, impact: 0, active: false,
        expired: false, passed: false
      });
      return;
    }

    state.obstacles.push({
      type, x: area.clientWidth + size, y: ground() - size * 0.76,
      w: size, h: size * 0.76, r: 0,
      rs: type === "rolling" ? rnd(-5.4, -3.8) : rnd(-1.2, 1.2),
      speedFactor: type === "rolling" ? rnd(1.08, 1.18) : 1,
      passed: false
    });
  }

`;

  const collisionsRenderer = `  function collisions() {
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
        burst(reward.x + reward.w / 2, reward.y + reward.h / 2, 18, ["#8347ff", "#15d9ff", "#ffffff"]);
        pop(reward);
        tone(840, 0.08);
      }
    }
    for (const obstacle of state.obstacles) {
      if (obstacle.type === "falling" && !obstacle.active) continue;
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

`;

  const meteorRenderer = `  function meteor(obstacle) {
    if (obstacle.type === "falling" && obstacle.warning > 0) {
      const pulse = 0.55 + Math.sin(performance.now() / 80) * 0.22;
      ctx.save();
      ctx.strokeStyle = \`rgba(255,53,199,\${pulse})\`;
      ctx.fillStyle = \`rgba(131,71,255,\${pulse * 0.18})\`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(obstacle.x + obstacle.w / 2, obstacle.targetY + obstacle.h, obstacle.w * 0.72, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(obstacle.x + obstacle.w / 2, obstacle.targetY - 34);
      ctx.lineTo(obstacle.x + obstacle.w / 2, obstacle.targetY - 12);
      ctx.strokeStyle = "rgba(21,217,255,.72)";
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h / 2);
    ctx.rotate(obstacle.r);
    const r = obstacle.w / 2;
    const gradient = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.08, 0, 0, r);
    gradient.addColorStop(0, "#ffd05d");
    gradient.addColorStop(0.3, "#ff7547");
    gradient.addColorStop(0.7, "#d83575");
    gradient.addColorStop(1, "#7025b7");
    ctx.shadowBlur = obstacle.type === "falling" ? 28 : 20;
    ctx.shadowColor = obstacle.type === "falling" ? "#ff7547" : "#ff35c7";
    ctx.fillStyle = gradient;
    ctx.beginPath();
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const radius = r * (0.78 + ((i * 17) % 5) * 0.045);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius * 0.78;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(62,13,91,.48)";
    ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.08, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.2, r * 0.16, r * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    if (obstacle.type === "rolling") {
      ctx.save();
      ctx.strokeStyle = "rgba(255,53,199,.34)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(obstacle.x + obstacle.w * 0.9, ground() + 8);
      ctx.lineTo(obstacle.x + obstacle.w * 1.7, ground() + 8);
      ctx.stroke();
      ctx.restore();
    }
  }

`;

  async function boot() {
    const response = await fetch(`${ORIGINAL_SCRIPT}?v=meteoritos-3`, { cache: "no-store" });
    if (!response.ok) throw new Error(`No se pudo cargar ${ORIGINAL_SCRIPT}`);
    let source = await response.text();

    source = source.replace(
      "state.speed = Math.min(MAX, BASE + state.time * 13 + state.level * 5);",
      "state.speed = Math.min(760, BASE + state.time * 7.5 + state.level * 3);"
    );

    source = source.replace(
`    for (const obstacle of state.obstacles) {
      obstacle.x -= state.speed * dt;
      obstacle.r += obstacle.rs * dt;

      if (!obstacle.passed && obstacle.x + obstacle.w < player.x) {
        obstacle.passed = true;
        state.score += 35;
        tone(720, 0.03);
      }
    }`,
`    for (const obstacle of state.obstacles) {
      if (obstacle.type === "falling") {
        if (obstacle.warning > 0) {
          obstacle.warning -= dt;
          if (obstacle.warning <= 0) {
            obstacle.active = true;
            obstacle.vy = 180;
          }
          continue;
        }
        if (obstacle.impact > 0) {
          obstacle.impact -= dt;
          if (obstacle.impact <= 0) obstacle.expired = true;
          continue;
        }
        obstacle.vy += 1850 * dt;
        obstacle.y += obstacle.vy * dt;
        obstacle.r += obstacle.rs * dt;
        if (obstacle.y >= obstacle.targetY) {
          obstacle.y = obstacle.targetY;
          obstacle.vy = 0;
          obstacle.impact = 0.48;
          burst(obstacle.x + obstacle.w / 2, ground() - 4, 16, ["#ff7547", "#ff35c7", "#8347ff"]);
          tone(105, 0.11);
        }
        continue;
      }
      obstacle.x -= state.speed * (obstacle.speedFactor || 1) * dt;
      obstacle.r += obstacle.rs * dt;
      if (!obstacle.passed && obstacle.x + obstacle.w < player.x) {
        obstacle.passed = true;
        state.score += obstacle.type === "rolling" ? 55 : 35;
        tone(720, 0.03);
      }
    }`
    );

    source = source.replace(
`    state.obstacles = state.obstacles.filter(
      (obstacle) => obstacle.x + obstacle.w > -70
    );`,
`    state.obstacles = state.obstacles.filter((obstacle) =>
      obstacle.type === "falling" ? !obstacle.expired : obstacle.x + obstacle.w > -70
    );`
    );

    source = replaceFunction(source, "  function spawnMeteor() {", "  function spawnQuartz() {", spawnMeteorRenderer);
    source = replaceFunction(source, "  function collisions() {", "  function pop(reward) {", collisionsRenderer);
    source = replaceFunction(source, "  function dino() {", "  function quartz(reward) {", dinoRenderer);
    source = replaceFunction(source, "  function meteor(obstacle) {", "  function burst(", meteorRenderer);

    new Function(`${source}\n//# sourceURL=meteorito-run-variedad.js`)();
  }

  boot().catch((error) => {
    console.error("No se pudieron aplicar las mejoras:", error);
    const fallback = document.createElement("script");
    fallback.src = ORIGINAL_SCRIPT;
    document.body.appendChild(fallback);
  });
})();
