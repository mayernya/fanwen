/* ==========================================================
   合成大肥鱼 —— 2D 圆形物理合成小游戏（零外部依赖）
   换皮方法：把下面 LEVELS 里的 img 填成图片路径（如 "img/game/0.webp"）即可
   ========================================================== */
(function () {
  const W = 360, H = 520;
  const WALL = 0, DANGER_Y = 86, DROP_Y = 44;
  const GRAVITY = 1550, RESTITUTION = 0.22, FRICTION = 0.985, AIR_DRAG = 0.996;
  const SUBSTEPS = 8, DROP_COOLDOWN = 420, DANGER_TIME = 2.2;
  const BEST_KEY = "fanwen_bigfatfish_best";

  /* 10 级合成阶梯（Lv0/Lv1 暂用占位图标，Lv2~Lv9 为 AI 角色圆章图） */
  const LEVELS = [
    { name: "小水泡",   r: 16,  score: 2,    bg: "#d8f0ff", rim: "#7ec8f8", text: "#0b2a58", icon: "🫧", img: "" },
    { name: "星光糖",   r: 22,  score: 4,    bg: "#fff1b8", rim: "#f6d57a", text: "#5a3d06", icon: "⭐", img: "" },
    { name: "文心一言", r: 28,  score: 8,    bg: "#d6e6ff", rim: "#5b8ef5", text: "#0e2a66", icon: "🐾", img: "img/game/lv2.jpg" },
    { name: "捷米奈",   r: 35,  score: 16,   bg: "#dfd0ff", rim: "#b794f6", text: "#2b1b54", icon: "🐱", img: "img/game/lv3.jpg" },
    { name: "智谱",     r: 43,  score: 32,   bg: "#d4ddf8", rim: "#5e77c9", text: "#16204a", icon: "💤", img: "img/game/lv4.jpg" },
    { name: "Kimi",     r: 52,  score: 64,   bg: "#e6e2ff", rim: "#a9a2f5", text: "#26205a", icon: "🌙", img: "img/game/lv5.jpg" },
    { name: "千问",     r: 62,  score: 128,  bg: "#dfd4ff", rim: "#8b6df2", text: "#28145e", icon: "🪭", img: "img/game/lv6.jpg" },
    { name: "ChatGPT",  r: 73,  score: 256,  bg: "#d8f3ee", rim: "#74c7b8", text: "#103b36", icon: "🌀", img: "img/game/lv7.jpg" },
    { name: "Claude",   r: 85,  score: 512,  bg: "#ffe7cf", rim: "#e69c5c", text: "#542a0a", icon: "🌼", img: "img/game/lv8.jpg" },
    { name: "大肥鱼",   r: 98,  score: 1024, bg: "#a9bdf6", rim: "#5b82ea", text: "#0b1846", icon: "🐋", img: "img/game/lv9.jpg" }
  ];

  /* 预加载图片 */
  const sprites = LEVELS.map((lv) => {
    if (!lv.img) return null;
    const im = new Image();
    im.src = lv.img;
    return im;
  });

  /* 极简 Web Audio 音效 */
  let audioCtx = null;
  let muted = false;
  function beep(freq, dur = 0.09, type = "sine", vol = 0.08) {
    if (muted) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 1.28, audioCtx.currentTime + dur);
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch { /* ignore */ }
  }

  /* DOM 元素 */
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("gScore");
  const bestEl = document.getElementById("gBest");
  const nextEl = document.getElementById("gNext");
  const evoEl = document.getElementById("gEvo");
  const overEl = document.getElementById("gOver");
  const overScoreEl = document.getElementById("gOverScore");
  const overBestEl = document.getElementById("gOverBest");
  const overTitleEl = document.getElementById("gOverTitle");
  const muteBtn = document.getElementById("gMute");
  const restartBtn = document.getElementById("gRestart");
  const againBtn = document.getElementById("gAgain");

  /* 高清缩放 */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  /* 游戏状态 */
  let balls = [];
  let particles = [];
  let floats = [];
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let maxLvUnlocked = 0;
  let curLv = 0;
  let nextLv = 1;
  let aimX = W / 2;
  let lastDropAt = 0;
  let dangerTimer = 0;
  let gameOver = false;
  let wonFish = false;
  let nextId = 1;
  let dragging = false;

  /* 装饰背景气泡 */
  const bgBubbles = Array.from({ length: 10 }, () => ({
    x: 20 + Math.random() * (W - 40),
    y: Math.random() * H,
    r: 3 + Math.random() * 7,
    vy: 12 + Math.random() * 18,
    phase: Math.random() * Math.PI * 2
  }));

  function pickDropLevel() {
    const cap = Math.min(4, Math.max(2, maxLvUnlocked));
    const weights = [34, 28, 20, 12, 6].slice(0, cap + 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return 0;
  }

  function renderEvo() {
    evoEl.innerHTML = LEVELS.map((lv, i) => {
      const unlocked = i <= maxLvUnlocked;
      const thumb = lv.img
        ? `<img src="${lv.img}" alt="${lv.name}">`
        : `<span>${lv.icon}</span>`;
      return `<div class="evo-item${unlocked ? " on" : ""}" style="--ebg:${lv.bg};--erim:${lv.rim}" title="${lv.name}（+${lv.score}分）">
        <div class="evo-dot">${thumb}</div>
        <small>${lv.name}</small>
      </div>`;
    }).join("");
  }

  function renderNext() {
    const lv = LEVELS[nextLv];
    nextEl.style.setProperty("--ebg", lv.bg);
    nextEl.style.setProperty("--erim", lv.rim);
    nextEl.innerHTML = lv.img
      ? `<img src="${lv.img}" alt="${lv.name}">`
      : `<span>${lv.icon}</span>`;
    nextEl.title = `下一个：${lv.name}`;
  }

  function updateScore(add = 0) {
    score += add;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
    }
    bestEl.textContent = best;
  }

  function spawnParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const sp = 55 + Math.random() * 130;
      particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        r: 2.5 + Math.random() * 4, color, life: 0.55 + Math.random() * 0.3, maxLife: 0.85
      });
    }
  }

  function spawnFloat(x, y, text, color = "#f6d57a") {
    floats.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
  }

  function clampAim(x) {
    const r = LEVELS[curLv].r;
    return Math.max(WALL + r, Math.min(W - WALL - r, x));
  }

  function dropBall() {
    if (gameOver) return;
    const now = performance.now();
    if (now - lastDropAt < DROP_COOLDOWN) return;
    lastDropAt = now;

    const lv = curLv;
    const r = LEVELS[lv].r;
    const x = clampAim(aimX);
    balls.push({
      id: nextId++, lv, r, x, y: DROP_Y,
      vx: (Math.random() - 0.5) * 10, vy: 20,
      angle: 0, omega: 0,
      scale: 0.88, bornAt: now, merged: false
    });
    beep(300 + lv * 35, 0.06, "triangle", 0.06);

    curLv = nextLv;
    nextLv = pickDropLevel();
    aimX = clampAim(aimX);
    renderNext();
  }

  function resetGame() {
    balls = [];
    particles = [];
    floats = [];
    score = 0;
    maxLvUnlocked = 0;
    curLv = 0;
    nextLv = 1;
    aimX = W / 2;
    dangerTimer = 0;
    gameOver = false;
    wonFish = false;
    lastDropAt = 0;
    overEl.hidden = true;
    updateScore(0);
    renderNext();
    renderEvo();
  }

  /* 纯位置分离（合成变大时温和推开周围的球，不产生弹飞速度） */
  function settlePositions(iters = 6) {
    for (let iter = 0; iter < iters; iter++) {
      for (let i = 0; i < balls.length; i++) {
        const a = balls[i];
        if (a.merged) continue;
        for (let j = i + 1; j < balls.length; j++) {
          const b = balls[j];
          if (b.merged) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const distSq = dx * dx + dy * dy;
          const minDist = a.r + b.r;
          if (distSq >= minDist * minDist) continue;
          const dist = Math.sqrt(distSq) || 0.001;
          const nx = dx / dist, ny = dy / dist;
          const overlap = minDist - dist;
          const wa = 1 / Math.pow(a.r, 1.5), wb = 1 / Math.pow(b.r, 1.5);
          const invW = 1 / (wa + wb);
          a.x -= nx * overlap * (wa * invW);
          a.y -= ny * overlap * (wa * invW);
          b.x += nx * overlap * (wb * invW);
          b.y += ny * overlap * (wb * invW);
        }
      }
      for (const b of balls) {
        if (b.merged) continue;
        if (b.x - b.r < WALL) b.x = WALL + b.r;
        else if (b.x + b.r > W - WALL) b.x = W - WALL - b.r;
        if (b.y + b.r > H - WALL) b.y = H - WALL - b.r;
      }
    }
  }

  /* 物理步进（PBD 迭代约束求解：重球不碾压小球、边缘不穿模、停稳不空转） */
  function stepPhysics(dt) {
    const subDt = dt / SUBSTEPS;
    const now = performance.now();
    const merges = [];

    for (let s = 0; s < SUBSTEPS; s++) {
      // 1. 保存上一子步位置并积分重力
      for (const b of balls) {
        if (b.merged) continue;
        b.px = b.x;
        b.py = b.y;
        b.vy += GRAVITY * subDt;
        b.x += b.vx * subDt;
        b.y += b.vy * subDt;
      }

      // 2. 迭代投影球-球与球-墙约束（4 次迭代即可将最大穿透压到 <0.05px）
      for (let iter = 0; iter < 4; iter++) {
        for (let i = 0; i < balls.length; i++) {
          const a = balls[i];
          if (a.merged) continue;
          for (let j = i + 1; j < balls.length; j++) {
            const b = balls[j];
            if (b.merged) continue;
            const dx = b.x - a.x, dy = b.y - a.y;
            const distSq = dx * dx + dy * dy;
            const minDist = a.r + b.r;
            if (distSq >= minDist * minDist) continue;

            // 同级合成！
            if (a.lv === b.lv) {
              a.merged = true;
              b.merged = true;
              merges.push({
                lv: a.lv,
                x: (a.x + b.x) * 0.5,
                y: (a.y + b.y) * 0.5,
                vx: (a.vx + b.vx) * 0.35,
                vy: Math.min(0, (a.vy + b.vy) * 0.35) - 40
              });
              continue;
            }

            const dist = Math.sqrt(distSq) || 0.001;
            const nx = dx / dist, ny = dy / dist;
            const overlap = minDist - dist;
            const wa = 1 / Math.pow(a.r, 1.5), wb = 1 / Math.pow(b.r, 1.5);
            const invW = 1 / (wa + wb);
            a.x -= nx * overlap * (wa * invW);
            a.y -= ny * overlap * (wa * invW);
            b.x += nx * overlap * (wb * invW);
            b.y += ny * overlap * (wb * invW);
          }
        }
        // 每次分离后立刻锁回墙内，保证墙角小球能把大球稳稳顶开
        for (const b of balls) {
          if (b.merged) continue;
          if (b.x - b.r < WALL) b.x = WALL + b.r;
          else if (b.x + b.r > W - WALL) b.x = W - WALL - b.r;
          if (b.y + b.r > H - WALL) b.y = H - WALL - b.r;
        }
      }

      // 3. 由投影后位移反推速度，并更新自然滚动角速度
      for (const b of balls) {
        if (b.merged) continue;
        const oldVx = b.vx, oldVy = b.vy;
        let nvx = ((b.x - b.px) / subDt) * AIR_DRAG;
        let nvy = ((b.y - b.py) / subDt) * AIR_DRAG;

        const onFloor = b.y + b.r >= H - WALL - 0.5;
        if (onFloor) {
          nvx *= FRICTION;
          if (oldVy > 90 && nvy < 20) nvy = -oldVy * RESTITUTION;
          else if (Math.abs(nvy) < 18) nvy = 0;
        }
        if ((b.x - b.r <= WALL + 0.5 && oldVx < -70) || (b.x + b.r >= W - WALL - 0.5 && oldVx > 70)) {
          nvx = -oldVx * RESTITUTION;
        }
        if (Math.abs(nvx) < 3) nvx = 0;
        // 限制约束反推的异常爆发速度，杜绝挤压/合成把球弹飞
        b.vx = Math.max(-320, Math.min(320, nvx));
        b.vy = Math.max(-220, Math.min(900, nvy));

        // 仅按真实水平滚动驱动旋转，停稳立即归零，绝不卡住空转
        const speed = Math.hypot(b.vx, b.vy);
        if (speed < 8) {
          b.omega *= Math.pow(0.75, subDt * 60);
          if (Math.abs(b.omega) < 0.04) b.omega = 0;
        } else {
          const targetOmega = Math.max(-4.5, Math.min(4.5, b.vx / Math.max(14, b.r)));
          b.omega += (targetOmega - b.omega) * Math.min(1, subDt * 14);
        }
        b.angle += b.omega * subDt;
      }
    }

    // 执行合成
    if (merges.length) {
      balls = balls.filter((b) => !b.merged);
      for (const m of merges) {
        const nextLevel = m.lv + 1;
        if (nextLevel < LEVELS.length) {
          const cfg = LEVELS[nextLevel];
          const nx = Math.max(WALL + cfg.r, Math.min(W - WALL - cfg.r, m.x));
          const ny = Math.max(DROP_Y, Math.min(H - WALL - cfg.r, m.y));
          balls.push({
            id: nextId++, lv: nextLevel, r: cfg.r, x: nx, y: ny,
            vx: m.vx * 0.4, vy: Math.max(-30, m.vy * 0.4), angle: 0, omega: 0,
            scale: 0.65, bornAt: now, merged: false
          });
          updateScore(cfg.score);
          spawnParticles(nx, ny, cfg.rim, 14 + nextLevel * 2);
          spawnFloat(nx, ny - cfg.r * 0.4, `+${cfg.score}`);
          beep(380 + nextLevel * 65, 0.12, "sine", 0.09);

          if (nextLevel > maxLvUnlocked) {
            maxLvUnlocked = nextLevel;
            renderEvo();
          }
          if (nextLevel === LEVELS.length - 1 && !wonFish) {
            wonFish = true;
            spawnParticles(nx, ny, "#f6d57a", 32);
            spawnFloat(W / 2, H * 0.35, "🎉 合成大肥鱼啦！", "#f6d57a");
            beep(660, 0.25, "triangle", 0.12);
          }
        } else {
          // 两条大肥鱼相撞：终极加分烟花
          updateScore(2048);
          spawnParticles(m.x, m.y, "#f6d57a", 36);
          spawnFloat(m.x, m.y, "🐋 双倍大肥鱼 +2048！", "#f6d57a");
          beep(780, 0.28, "triangle", 0.12);
        }
      }
      // 合成新球后先做纯位置排开，再进下一帧物理，避免新球瞬间膨胀把邻球弹飞
      settlePositions(6);
    }

    // 弹性缩放动画 & 警戒线检测
    let inDanger = false;
    for (const b of balls) {
      if (b.scale < 1) b.scale = Math.min(1, b.scale + dt * 3.8);
      if (now - b.bornAt > 1200 && b.y - b.r < DANGER_Y) {
        inDanger = true;
      }
    }
    if (inDanger) {
      dangerTimer += dt;
      if (dangerTimer >= DANGER_TIME) {
        gameOver = true;
        overTitleEl.textContent = wonFish ? "🎉 鱼缸装满大肥鱼啦！" : "🫧 鱼缸满出来啦！";
        overScoreEl.textContent = score;
        overBestEl.textContent = best;
        overEl.hidden = false;
        beep(220, 0.22, "sawtooth", 0.06);
      }
    } else {
      dangerTimer = Math.max(0, dangerTimer - dt * 2);
    }

    // 粒子与漂浮分数
    for (const p of particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const f of floats) { f.y -= 38 * dt; f.life -= dt; }
    floats = floats.filter((f) => f.life > 0);
    for (const bb of bgBubbles) {
      bb.y -= bb.vy * dt;
      if (bb.y < -20) { bb.y = H + 20; bb.x = 20 + Math.random() * (W - 40); }
    }
  }

  /* 绘制单个圆球 */
  function drawOrb(x, y, lv, angle = 0, scale = 1, alpha = 1) {
    const cfg = LEVELS[lv];
    const r = cfg.r * scale;
    const im = sprites[lv];

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (angle) ctx.rotate(angle);

    // 底部柔和阴影
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = cfg.bg;
    ctx.fill();

    if (im && im.complete && im.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      ctx.clip();
      const s = (r - 1.5) * 2;
      ctx.drawImage(im, -s / 2, -s / 2, s, s);
      ctx.restore();
    } else {
      // 柔和内渐变 + 图标
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
      grad.addColorStop(0, "rgba(255,255,255,.72)");
      grad.addColorStop(0.55, "rgba(255,255,255,0)");
      grad.addColorStop(1, "rgba(11,24,70,.16)");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.font = `${Math.round(r * 1.05)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cfg.icon, 0, r * 0.06);
    }

    // 玻璃气泡高光 + 边框（有插画时高光更柔和，不遮挡五官）
    if (!im || !im.complete || !im.naturalWidth) {
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.32, r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,.38)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = cfg.rim;
    ctx.stroke();

    ctx.restore();
  }

  /* 渲染整帧 */
  function render() {
    ctx.clearRect(0, 0, W, H);

    // 鱼缸水色渐变
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1c3c8c");
    bg.addColorStop(0.65, "#153078");
    bg.addColorStop(1, "#0f225c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 顶部微光
    const light = ctx.createRadialGradient(W * 0.5, 0, 10, W * 0.5, 0, W * 0.85);
    light.addColorStop(0, "rgba(147, 171, 242, .22)");
    light.addColorStop(1, "transparent");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H * 0.5);

    // 慢漂背景水泡
    ctx.strokeStyle = "rgba(248, 241, 224, .18)";
    ctx.lineWidth = 1.2;
    for (const bb of bgBubbles) {
      ctx.beginPath();
      ctx.arc(bb.x + Math.sin(bb.y * 0.03 + bb.phase) * 5, bb.y, bb.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 警戒水位线
    const pulse = dangerTimer > 0 ? 0.45 + 0.55 * Math.abs(Math.sin(performance.now() * 0.012)) : 0.35;
    ctx.save();
    ctx.setLineDash([7, 6]);
    ctx.lineWidth = dangerTimer > 0 ? 2.5 : 1.6;
    ctx.strokeStyle = dangerTimer > 0 ? `rgba(255, 130, 150, ${pulse})` : "rgba(246, 213, 122, .45)";
    ctx.beginPath();
    ctx.moveTo(WALL, DANGER_Y);
    ctx.lineTo(W - WALL, DANGER_Y);
    ctx.stroke();
    ctx.restore();

    if (dangerTimer > 0.3 && !gameOver) {
      ctx.fillStyle = "#ff9bb0";
      ctx.font = '13px "LXGW WenKai Lite", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(`快溢出来啦 ${(DANGER_TIME - dangerTimer).toFixed(1)}s`, W - 14, DANGER_Y - 8);
    }

    // 待下落瞄准线与预览球
    if (!gameOver) {
      const ready = performance.now() - lastDropAt >= DROP_COOLDOWN;
      const x = clampAim(aimX);
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = "rgba(248, 241, 224, .28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, DROP_Y + LEVELS[curLv].r);
      ctx.lineTo(x, H - WALL);
      ctx.stroke();
      ctx.restore();

      drawOrb(x, DROP_Y, curLv, 0, ready ? 1 : 0.72, ready ? 0.96 : 0.45);
    }

    // 全部圆球
    for (const b of balls) drawOrb(b.x, b.y, b.lv, b.angle, b.scale);

    // 粒子
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 漂浮分数
    for (const f of floats) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
      ctx.font = '700 18px "LXGW WenKai Lite", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = f.color;
      ctx.strokeStyle = "rgba(8, 18, 56, .85)";
      ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  /* 输入事件（支持鼠标全屏跟随瞄准 & 触屏拖拽） */
  function clientToX(clientX) {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * W;
  }

  document.addEventListener("pointerdown", (e) => {
    if (gameOver) return;
    if (e.pointerType === "mouse") {
      if (e.button !== 0) return;
      if (e.target.closest("header, footer, button, a, .game-hud, .evo-panel, .game-over")) return;
    } else if (e.target !== canvas) {
      return;
    }
    dragging = true;
    aimX = clampAim(clientToX(e.clientX));
  });
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse" || dragging) {
      aimX = clampAim(clientToX(e.clientX));
    }
  });
  window.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    aimX = clampAim(clientToX(e.clientX));
    dropBall();
  });
  window.addEventListener("pointercancel", () => (dragging = false));

  muteBtn.addEventListener("click", () => {
    muted = !muted;
    muteBtn.textContent = muted ? "🔇 静音" : "🔊 音效";
  });
  restartBtn.addEventListener("click", resetGame);
  againBtn.addEventListener("click", resetGame);

  /* 主循环 */
  let lastT = performance.now();
  function loop(t) {
    const dt = Math.min(0.033, (t - lastT) / 1000);
    lastT = t;
    if (!gameOver) stepPhysics(dt);
    render();
    requestAnimationFrame(loop);
  }

  resetGame();
  requestAnimationFrame(loop);
})();
