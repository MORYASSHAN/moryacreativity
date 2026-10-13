/* SCRAMBLE / 渋谷 — interactions */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  /* =========================================================
     1. HERO — photo + crowd scramble + rain + glass droplets
  ========================================================= */
  function hero() {
    const cv = $('#city');
    const ctx = cv.getContext('2d');
    const heroEl = $('.hero');
    const img = new Image();
    img.decoding = 'async';
    img.src = '../../assets/img/shibuya.webp';

    const IW = 1000, IH = 667;
    const M = 26;                            // parallax margin (css px)
    let W = 0, H = 0, dpr = 1, s = 1, ox = 0, oy = 0;
    let bgSharp = null, bgBlur = null;
    const mobile = () => W < 700;

    // crossing geometry in image pixels
    const X = { x: 392, y: 478 };
    const ZONES = [
      { x: 240, y: 400, r: 42 },   // NW
      { x: 462, y: 386, r: 38 },   // N
      { x: 625, y: 492, r: 62 },   // E plaza
      { x: 520, y: 606, r: 46 },   // S
      { x: 185, y: 560, r: 46 }    // SW
    ];
    const ROADS = [
      [{ x: 172, y: 150 }, { x: 335, y: 418 }],
      [{ x: 530, y: 667 }, { x: 468, y: 548 }],
      [{ x: 980, y: 300 }, { x: 640, y: 420 }]
    ];
    const UMB = [
      ['rgba(236,242,255,0.88)', 22], ['rgba(200,225,255,0.7)', 10], ['#1a1a24', 14], ['#2c3d78', 9],
      ['#ff2fa0', 6], ['#22e6ff', 6], ['#ffe14a', 5], ['#e8344a', 5], ['#8fd3ff', 6], ['#f4f4f4', 6], ['#6a4bd6', 3]
    ];
    const UMB_TOTAL = UMB.reduce((a, b) => a + b[1], 0);
    const umbColour = () => { let r = Math.random() * UMB_TOTAL; for (const [c, w] of UMB) { if ((r -= w) < 0) return c; } return UMB[0][0]; };

    function layout() {
      const rect = heroEl.getBoundingClientRect();
      W = rect.width; H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, mobile() ? 2 : 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      // cover-fit, zoomed, with the crossing placed upper-centre
      const cover = Math.max((W + M * 2) / IW, (H + M * 2) / IH);
      s = cover * (mobile() ? 1.12 : 1.22);
      const tx = W * (mobile() ? 0.5 : 0.5), ty = H * (mobile() ? 0.42 : 0.42);
      ox = clamp(tx - X.x * s, W + M - IW * s, -M);
      oy = clamp(ty - X.y * s, H * 0.84 - IH * s, -M);
      if (img.complete && img.naturalWidth) buildBg();
    }

    function buildBg() {
      const w = Math.round((W + M * 2) * dpr), h = Math.round((H + M * 2) * dpr);
      bgSharp = document.createElement('canvas'); bgSharp.width = w; bgSharp.height = h;
      const g = bgSharp.getContext('2d');
      g.fillStyle = '#07070c'; g.fillRect(0, 0, w, h);
      g.filter = 'saturate(1.35) contrast(1.12) brightness(0.8)';
      g.drawImage(img, (ox + M) * dpr, (oy + M) * dpr, IW * s * dpr, IH * s * dpr);
      g.filter = 'none';
      // neon grade
      g.globalCompositeOperation = 'soft-light';
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, 'rgba(255,47,160,0.55)'); gr.addColorStop(0.5, 'rgba(40,20,90,0.4)'); gr.addColorStop(1, 'rgba(34,230,255,0.5)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
      // fade out under the photo edge
      const imgBottom = (oy + M + IH * s) * dpr;
      const fade = g.createLinearGradient(0, imgBottom - 120 * dpr, 0, imgBottom);
      fade.addColorStop(0, 'rgba(7,7,12,0)'); fade.addColorStop(1, 'rgba(7,7,12,1)');
      g.fillStyle = fade; g.fillRect(0, imgBottom - 120 * dpr, w, h);

      bgBlur = document.createElement('canvas'); bgBlur.width = w; bgBlur.height = h;
      const b = bgBlur.getContext('2d');
      b.filter = `blur(${(mobile() ? 1.6 : 2.4) * dpr}px) brightness(0.86)`;
      b.drawImage(bgSharp, 0, 0);
      b.filter = 'none';
    }

    /* ---- crowd ---- */
    const crowd = [];
    function zonePoint(z) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * z.r;
      return { x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d * 0.7 };
    }
    function makeCrowd() {
      crowd.length = 0;
      const n = mobile() ? 200 : 380;
      for (let i = 0; i < n; i++) {
        const zi = (Math.random() * ZONES.length) | 0;
        const p = zonePoint(ZONES[zi]);
        crowd.push({ x: p.x, y: p.y, zi, r: rand(2.7, 4.1), c: umbColour(), moving: false, t: 0, delay: 0, dur: 1, p0: p, p1: p, cp: p, ph: rand(0, 6.28), hl: Math.random() < 0.8 });
      }
    }
    function launch() {
      for (const p of crowd) {
        if (Math.random() < 0.08) continue;      // a few always wait
        let zj = p.zi;
        while (zj === p.zi) zj = (Math.random() * ZONES.length) | 0;
        p.p0 = { x: p.x, y: p.y };
        p.p1 = zonePoint(ZONES[zj]);
        p.cp = { x: X.x + rand(-55, 55), y: X.y + rand(-40, 40) };
        p.zi = zj; p.moving = true; p.t = 0;
        p.delay = rand(0, 1.3) + (Math.random() < 0.1 ? rand(1, 2.4) : 0);
        p.dur = rand(2.3, 3.9);
      }
    }

    /* ---- cars ---- */
    const cars = [];
    function makeCars() {
      cars.length = 0;
      ROADS.forEach((road, ri) => { for (let k = 0; k < 3; k++) cars.push({ road: ri, u: Math.random(), v: rand(0.05, 0.09), dir: Math.random() < 0.5 ? 1 : -1, lane: rand(-6, 6) }); });
    }
    function glowSprite(col, size) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const g = c.getContext('2d'); const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gr.addColorStop(0, col); gr.addColorStop(0.25, col.replace('1)', '0.45)')); gr.addColorStop(1, col.replace('1)', '0)'));
      g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
    }
    const headG = glowSprite('rgba(255,250,230,1)', 48), tailG = glowSprite('rgba(255,60,60,1)', 40);

    /* ---- rain ---- */
    let streaks = [], splashes = [], drops = [];
    const wind = { x: 0.16, target: 0.16 };
    function makeRain() {
      const n = Math.round(clamp((W * H) / 5200, 110, 300));
      streaks = Array.from({ length: n }, () => newStreak(true));
      splashes = [];
      drops = [];
      const dn = mobile() ? 26 : 56;
      for (let i = 0; i < dn; i++) drops.push(newDrop(rand(0, W), rand(0, H)));
    }
    function newStreak(initial) {
      const z = Math.random();
      return { x: rand(-100, W + 100), y: initial ? rand(-H, H) : rand(-200, -20), z, len: 12 + z * 30, v: 14 + z * 16, ground: rand(H * 0.5, H * 1.02) };
    }
    function newDrop(x, y, r) {
      const rr = r || (Math.random() < 0.14 ? rand(9, 16) : rand(2.4, 7.5));
      return { x, y, r: rr, vy: 0, a: 0, born: performance.now(), sliding: rr > 7 && Math.random() < 0.5, trail: 0 };
    }

    /* ---- signal state ---- */
    const RED = 8, GREEN = 5, CYCLE = RED + GREEN;
    let clock = /[?&]cover/.test(location.search) ? RED + 0.4 : RED - 2.6;   // start close to the next green
    let wasGreen = false;
    const sigEl = $('#signal'), sigState = $('#sigState'), sigJp = $('#sigJp'), sigCount = $('#sigCount'), sigCrowd = $('#sigCrowd'), sigBar = $('#sigBar');

    function updateSignal(dt) {
      clock = (clock + dt) % CYCLE;
      const green = clock >= RED;
      const left = green ? CYCLE - clock : RED - clock;
      if (green !== wasGreen) {
        wasGreen = green;
        document.body.classList.toggle('is-walk', green);
        sigState.textContent = green ? 'WALK' : 'STOP';
        sigJp.textContent = green ? '渡れ' : '止まれ';
        if (green) launch();
      }
      document.body.classList.toggle('is-flash', green && left < 1.6);
      sigCount.textContent = String(Math.ceil(left)).padStart(2, '0');
      sigBar.style.transform = `scaleX(${(green ? (clock - RED) / GREEN : clock / RED).toFixed(3)})`;
      const moving = crowd.reduce((a, p) => a + (p.moving && p.t > 0 ? 1 : 0), 0);
      sigCrowd.textContent = (moving * 7).toLocaleString('en-US');
      return green;
    }

    /* ---- pointer ---- */
    const mouse = { x: -999, y: -999, vx: 0, vy: 0, px: 0, py: 0, lx: null, ly: null };
    heroEl.addEventListener('pointermove', (e) => {
      const r = heroEl.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (mouse.lx !== null) { mouse.vx = x - mouse.lx; mouse.vy = y - mouse.ly; }
      mouse.lx = mouse.x = x; mouse.ly = mouse.y = y;
      mouse.px = (x / W - 0.5) * 2; mouse.py = (y / H - 0.5) * 2;
    }, { passive: true });
    heroEl.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; mouse.lx = null; mouse.px = mouse.py = 0; });

    /* ---- draw ---- */
    const par = { x: 0, y: 0 };
    function I2S(x, y) { return [ox + x * s + par.x, oy + y * s + par.y]; }

    function drawFrame(dt, now, raw = dt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#07070c'; ctx.fillRect(0, 0, W, H);
      par.x += (-mouse.px * 14 - par.x) * 0.05;
      par.y += (-mouse.py * 10 - par.y) * 0.05;
      if (bgBlur) ctx.drawImage(bgBlur, 0, 0, bgBlur.width, bgBlur.height, -M + par.x, -M + par.y, W + M * 2, H + M * 2);

      // cars (stop while pedestrians cross)
      const green = wasGreen;
      ctx.globalCompositeOperation = 'lighter';
      for (const c of cars) {
        const [a, b] = ROADS[c.road];
        if (!green || c.u < 0.15 || c.u > 0.85) c.u += c.v * dt * (green ? 0.15 : 1);
        if (c.u > 1) c.u -= 1;
        const u = c.dir > 0 ? c.u : 1 - c.u;
        const ix = a.x + (b.x - a.x) * u, iy = a.y + (b.y - a.y) * u;
        const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny);
        const [sx, sy] = I2S(ix + (nx / nl) * c.lane, iy + (ny / nl) * c.lane);
        const spr = c.dir > 0 ? headG : tailG, sz = spr.width * (s / 1.6);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(spr, sx - sz / 2 - 3 * s, sy - sz / 2, sz, sz);
        ctx.drawImage(spr, sx - sz / 2 + 3 * s, sy - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // crowd umbrellas
      for (const p of crowd) {
        if (p.moving) {
          p.t += raw;
          const tt = (p.t - p.delay) / p.dur;
          if (tt >= 1) { p.moving = false; p.x = p.p1.x; p.y = p.p1.y; }
          else if (tt > 0) {
            const e = easeIO(tt), m = 1 - e;
            p.x = m * m * p.p0.x + 2 * m * e * p.cp.x + e * e * p.p1.x;
            p.y = m * m * p.p0.y + 2 * m * e * p.cp.y + e * e * p.p1.y;
            p.x += Math.sin(now * 0.004 + p.ph) * 0.35;
          }
        } else {
          p.x += Math.sin(now * 0.0013 + p.ph) * 0.03;
          p.y += Math.cos(now * 0.0011 + p.ph) * 0.02;
        }
        const [sx, sy] = I2S(p.x, p.y);
        const r = p.r * s * 0.62;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.arc(sx + r * 0.25, sy + r * 0.35, r, 0, 6.283); ctx.fill();
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.283); ctx.fill();
        if (p.hl) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(sx - r * 0.3, sy - r * 0.32, r * 0.42, 0, 6.283); ctx.fill(); }
      }

      // rain streaks
      wind.target = 0.16 + clamp(mouse.vx * 0.02, -0.5, 0.5);
      wind.x += (wind.target - wind.x) * 0.04;
      mouse.vx *= 0.9; mouse.vy *= 0.9;
      const k = dt * 60;
      for (let layer = 0; layer < 2; layer++) {
        ctx.beginPath();
        for (const r of streaks) {
          if ((r.z > 0.6) !== (layer === 1)) continue;
          const dx = wind.x * r.len, dy = r.len;
          ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - dx, r.y - dy);
        }
        ctx.strokeStyle = layer ? 'rgba(215,238,255,0.5)' : 'rgba(170,200,255,0.24)';
        ctx.lineWidth = layer ? 1.4 : 0.8;
        ctx.stroke();
      }
      for (let i = 0; i < streaks.length; i++) {
        const r = streaks[i];
        r.y += r.v * k; r.x += wind.x * r.v * k;
        if (r.y > r.ground) {
          if (splashes.length < 140 && Math.random() < 0.55) splashes.push({ x: r.x, y: r.y, t: 0, z: r.z });
          streaks[i] = newStreak(false);
        }
      }
      ctx.beginPath();
      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];
        sp.t += dt;
        if (sp.t > 0.32) { splashes.splice(i, 1); continue; }
        const rr = Math.max(0.01, (2 + sp.z * 6) * (sp.t / 0.32));
        ctx.moveTo(sp.x + rr, sp.y); ctx.ellipse(sp.x, sp.y, rr, rr * 0.32, 0, 0, 6.283);
      }
      ctx.strokeStyle = 'rgba(200,230,255,0.35)'; ctx.lineWidth = 0.9; ctx.stroke();

      // droplets on glass — each a tiny inverted lens over the sharp image
      if (Math.random() < dt * (mobile() ? 4 : 9) && drops.length < (mobile() ? 50 : 95)) drops.push(newDrop(rand(0, W), rand(0, H)));
      const wipe = Math.hypot(mouse.vx, mouse.vy) > 6;
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.a = Math.min(1, d.a + dt * 3);
        if (wipe && mouse.x > -900 && Math.hypot(d.x - mouse.x, d.y - mouse.y) < 46 + d.r) { drops.splice(i, 1); continue; }
        if (d.sliding) {
          d.vy = Math.min(d.vy + dt * (12 + d.r * 4), 60 + d.r * 10);
          d.y += d.vy * dt; d.x += Math.sin(now * 0.003 + d.born) * 0.15;
          d.trail += d.vy * dt;
          if (d.trail > 14 && drops.length < 160) { d.trail = 0; drops.push(newDrop(d.x + rand(-1, 1), d.y - d.r * 1.3, rand(1.2, 2.2))); d.r = Math.max(5, d.r - 0.12); }
          if (d.y - d.r > H) { drops.splice(i, 1); continue; }
        } else if (d.r > 7.5 && Math.random() < dt * 0.06) d.sliding = true;
      }
      // merge sliding drops with ones they touch
      for (const d of drops) {
        if (!d.sliding) continue;
        for (let j = drops.length - 1; j >= 0; j--) {
          const o = drops[j]; if (o === d || o.sliding) continue;
          if (Math.abs(o.x - d.x) < d.r && Math.abs(o.y - d.y) < d.r) { d.r = Math.min(18, Math.sqrt(d.r * d.r + o.r * o.r * 0.6)); drops.splice(j, 1); }
        }
      }
      if (bgSharp) {
        const sc = bgSharp.width / (W + M * 2);
        for (const d of drops) {
          const r = d.r, ry = r * 1.12;
          ctx.globalAlpha = d.a;
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.beginPath(); ctx.ellipse(d.x, d.y + r * 0.18, r * 1.02, ry, 0, 0, 6.283); ctx.fill();
          ctx.save();
          ctx.beginPath(); ctx.ellipse(d.x, d.y, r, ry, 0, 0, 6.283); ctx.clip();
          const sr = r * 3.4;
          const bx = (d.x + M - par.x - sr) * sc, by = (d.y + M - par.y - sr) * sc;
          ctx.translate(d.x, d.y); ctx.scale(1, -1);
          ctx.drawImage(bgSharp, bx, by, sr * 2 * sc, sr * 2 * sc, -r * 1.05, -ry * 1.05, r * 2.1, ry * 2.1);
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.ellipse(d.x, d.y, r, ry, 0, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
          if (r > 2.4) {
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.beginPath(); ctx.ellipse(d.x - r * 0.32, d.y - ry * 0.42, r * 0.2, r * 0.13, -0.5, 0, 6.283); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    let running = false, raf = 0, last = 0, visible = true;
    function loop(now) {
      const raw = clamp((now - last) / 1000, 0, 0.5); last = now;
      updateSignal(raw);
      drawFrame(Math.min(0.05, raw), now, raw);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (running || reduce) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    layout(); makeCrowd(); makeCars(); makeRain();
    img.onload = () => { buildBg(); if (reduce) drawFrame(0, 0); };
    if (img.complete && img.naturalWidth) buildBg();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const wasMobile = mobile(); layout(); if (wasMobile !== mobile()) makeCrowd(); makeRain(); if (reduce) drawFrame(0, 0); }, 150); });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible && !document.hidden ? start() : stop(); }, { threshold: 0.02 }).observe(heroEl);
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : visible && start(); });

    if (reduce) {
      // static still frame + a signal that still changes state, without motion
      setInterval(() => updateSignal(1), 1000);
    }

    // periodic headline glitch
    const gl = $('.hero .glitch');
    if (!reduce) {
      const fire = () => { gl.classList.add('is-glitching'); setTimeout(() => gl.classList.remove('is-glitching'), 240 + Math.random() * 200); setTimeout(fire, rand(3500, 7000)); };
      setTimeout(fire, 2600);
    }
  }

  /* =========================================================
     2. CLOCK (JST)
  ========================================================= */
  function clock() {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dfmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const full = $$('.js-clock'), short = $$('.js-clock-short'), big = $$('.js-clock-big'), sec = $$('.js-clock-sec'), date = $('#nowDate');
    const tick = () => {
      const d = new Date();
      const t = fmt.format(d).replace(/^24/, '00');
      const [hh, mm, ss] = t.split(':');
      full.forEach((e) => (e.textContent = t));
      short.forEach((e) => (e.textContent = `${hh}:${mm}`));
      big.forEach((e) => (e.textContent = `${hh}:${mm}`));
      sec.forEach((e) => (e.textContent = `:${ss}`));
      if (date) date.textContent = `${dfmt.format(d)} · JST · UTC+9`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* =========================================================
     3. TONIGHT — split-flap departure board
  ========================================================= */
  function board() {
    const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.-&/@'";
    const COLS = [['time', 5], ['event', 24], ['venue', 14], ['dist', 10], ['stat', 10]];
    const STAT = { on: 'ON TIME', board: 'BOARDING', last: 'LAST CALL', out: 'SOLD OUT', delay: 'DELAY 15', final: 'FINAL' };
    const NEXT = { on: 'board', board: 'last', last: 'out', delay: 'on', final: 'final', out: 'out' };
    const DATA = [
      ['21:00', 'NEON KOI CITY POP NIGHT', 'ORBIT B2', 'SHIBUYA', 'board'],
      ['21:30', 'JAZZ AFTER RAIN', 'BAR TSUYU 4F', 'GOLDEN GAI', 'on'],
      ['22:00', 'VINYL SWAP & SAKE', 'SHELTER 99', 'SHIMOKITA', 'on'],
      ['22:00', 'ROOFTOP SHOCHU FLIGHT', 'SKY 31', 'SHINJUKU', 'last'],
      ['22:30', 'TECHNO: WET ASPHALT', 'VOID HALL', 'ROPPONGI', 'delay'],
      ['23:00', 'KARAOKE CHAMPIONSHIP', 'BOX 808', 'SHIBUYA', 'out'],
      ['23:30', 'LATE RAMEN CRAWL', 'MEET @ EXIT 8', 'SHINJUKU', 'board'],
      ['00:00', 'MIDNIGHT FILM CLUB', 'CINE LOFT', 'SHIMOKITA', 'on'],
      ['00:14', 'LAST TRAIN - GINZA LINE', 'SHIBUYA STN', 'SHIBUYA', 'final'],
      ['01:00', 'DAWN DJ SET', 'VOID HALL', 'ROPPONGI', 'on']
    ];
    const rowsEl = $('#boardRows');
    const tiles = [];      // all active tiles
    const rows = DATA.map((d, ri) => {
      const row = document.createElement('div');
      row.className = 'b-row'; row.setAttribute('role', 'row'); row.dataset.st = d[4] === 'final' ? 'last' : d[4];
      const cells = COLS.map(([key, n], ci) => {
        const cell = document.createElement('span');
        cell.className = `b-cell c-${key}`; cell.setAttribute('role', 'cell');
        const sr = document.createElement('span'); sr.className = 'sr-only';
        const flaps = [];
        const wrap = document.createElement('span'); wrap.style.display = 'contents'; wrap.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < n; i++) {
          const f = document.createElement('span'); f.className = 'flap';
          const b = document.createElement('b'); b.textContent = ' '; f.appendChild(b); wrap.appendChild(f);
          flaps.push({ el: f, b, cur: ' ', target: ' ', left: 0, alt: false });
        }
        cell.append(sr, wrap);
        row.appendChild(cell);
        return { flaps, sr };
      });
      rowsEl.appendChild(row);
      return { row, cells, st: d[4], data: d };
    });

    function setCell(rowObj, ci, text, base = 0) {
      const cell = rowObj.cells[ci];
      const n = cell.flaps.length;
      const t = text.toUpperCase().padEnd(n).slice(0, n);
      cell.sr.textContent = text;
      cell.flaps.forEach((f, i) => {
        if (f.target === t[i] && f.cur === t[i]) return;
        f.target = t[i];
        f.left = reduce ? 1 : Math.round(base + 3 + i * 0.6 + Math.random() * 6);
        if (!tiles.includes(f)) tiles.push(f);
      });
    }
    function step() {
      for (let i = tiles.length - 1; i >= 0; i--) {
        const f = tiles[i];
        f.left--;
        const ch = f.left <= 0 ? f.target : CHARS[(Math.random() * CHARS.length) | 0];
        if (ch !== f.cur || f.left <= 0) {
          f.cur = ch; f.b.textContent = ch;
          if (!reduce) { f.alt = !f.alt; f.el.classList.toggle('ta', f.alt); f.el.classList.toggle('tb', !f.alt); }
        }
        if (f.left <= 0) tiles.splice(i, 1);
      }
    }
    setInterval(step, 55);

    function fill() {
      rows.forEach((r, ri) => {
        r.data.slice(0, 4).forEach((txt, ci) => setCell(r, ci, txt, ri * 3 + ci * 2));
        setCell(r, 4, STAT[r.st], ri * 3 + 8);
      });
    }
    let started = false;
    new IntersectionObserver((es, io) => {
      if (es[0].isIntersecting && !started) { started = true; io.disconnect(); fill(); setInterval(shuffle, 4200); }
    }, { threshold: 0.25 }).observe($('#board'));

    function shuffle() {
      const live = rows.filter((r) => r.st !== 'out' && r.st !== 'final');
      if (!live.length) {
        rows.forEach((r) => { if (r.st === 'out') { r.st = 'on'; r.row.dataset.st = 'on'; setCell(r, 4, STAT.on); } });
        return;
      }
      const r = pick(live);
      r.st = NEXT[r.st];
      r.row.dataset.st = r.st;
      setCell(r, 4, STAT[r.st]);
      // occasionally a sold-out show adds a second set
      const out = rows.filter((x) => x.st === 'out');
      if (out.length > 2) { const o = pick(out); o.st = 'on'; o.row.dataset.st = 'on'; setCell(o, 4, '2ND SET'); }
    }
  }

  /* =========================================================
     4. DISTRICTS — horizontal scroller with drag
  ========================================================= */
  function districts() {
    const sc = $('#distScroller'), bar = $('#distBar');
    const cardW = () => { const c = $('.dcard', sc); return c ? c.getBoundingClientRect().width + 20 : 320; };
    $('#distPrev').addEventListener('click', () => sc.scrollBy({ left: -cardW(), behavior: reduce ? 'auto' : 'smooth' }));
    $('#distNext').addEventListener('click', () => sc.scrollBy({ left: cardW(), behavior: reduce ? 'auto' : 'smooth' }));
    const upd = () => {
      const max = sc.scrollWidth - sc.clientWidth;
      const vis = sc.clientWidth / sc.scrollWidth;
      bar.style.width = (vis * 100).toFixed(1) + '%';
      bar.style.transform = `translateX(${((max ? sc.scrollLeft / max : 0) * (1 / vis - 1) * 100).toFixed(1)}%)`;
    };
    sc.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    let down = false, sx = 0, sl = 0, moved = false;
    sc.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = sc.scrollLeft; });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; sc.classList.add('is-drag'); }
      sc.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { if (!down) return; down = false; sc.classList.remove('is-drag'); });
    sc.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    sc.addEventListener('keydown', (e) => {
      if (e.target !== sc) return;
      if (e.key === 'ArrowRight') { sc.scrollBy({ left: cardW(), behavior: 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { sc.scrollBy({ left: -cardW(), behavior: 'smooth' }); e.preventDefault(); }
    });
  }

  /* =========================================================
     5. PHONE — map streets, route modes, tilt
  ========================================================= */
  function phone() {
    const streets = $('#streets');
    let h = '';
    for (let i = 0; i < 16; i++) {
      const y = rand(-10, 310), a = rand(-0.25, 0.25);
      h += `<path d="M-10 ${y.toFixed(0)} L290 ${(y + a * 300).toFixed(0)}" stroke-width="${rand(1.2, 3.4).toFixed(1)}"/>`;
    }
    for (let i = 0; i < 14; i++) {
      const x = rand(-10, 290), a = rand(-0.3, 0.3);
      h += `<path d="M${x.toFixed(0)} -10 L${(x + a * 320).toFixed(0)} 310" stroke-width="${rand(1.2, 3.2).toFixed(1)}"/>`;
    }
    for (let i = 0; i < 10; i++) {
      const x = rand(0, 280), y = rand(0, 300);
      h += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${rand(8, 26).toFixed(0)}" height="${rand(8, 20).toFixed(0)}" fill="#14141f" stroke="none"/>`;
    }
    streets.innerHTML = h;
    // tiny rain on the map
    const mr = $('#mapRain');
    let r = '';
    for (let x = 0; x < 300; x += 18) for (let y = -40; y < 320; y += 40) { const yy = y + ((x * 7) % 40); r += `<path d="M${x} ${yy} l-3 8"/>`; }
    mr.innerHTML = r;
    if (!reduce) mr.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-15px,40px)' }], { duration: 600, iterations: Infinity });

    const MODES = {
      walk: { chip: '8 MIN · 82% COVERED', col: '#ff2fa0', k: 'NEXT · 21:00 · CITY POP', t: 'Neon Koi · Orbit B2', m: 'Shibuya · queue 6 min · ¥2,000 door' },
      train: { chip: '14 MIN · JY LINE → SHINJUKU', col: '#22e6ff', k: 'NEXT · 21:30 · JAZZ', t: 'Bar Tsuyu 4F', m: 'Golden Gai · 7 seats · ¥800 seat fee' },
      taxi: { chip: '11 MIN · ≈ ¥2,300', col: '#ffe14a', k: 'NEXT · 22:30 · TECHNO', t: 'Void Hall', m: 'Roppongi · queue 25 min · ¥3,000 door' }
    };
    const tabs = $$('.ph-tabs button'), routes = $$('.route'), chip = $('#phChip');
    function setMode(m) {
      tabs.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
      routes.forEach((r) => r.classList.toggle('is-dim', r.dataset.route !== m));
      const d = MODES[m];
      chip.textContent = d.chip; chip.style.color = d.col; chip.style.borderColor = d.col;
      $('#phKicker').textContent = d.k; $('#phKicker').style.color = d.col;
      $('#phTitle').textContent = d.t; $('#phMeta').textContent = d.m;
    }
    let auto = true, idx = 0;
    tabs.forEach((b) => b.addEventListener('click', () => { auto = false; setMode(b.dataset.mode); }));
    setMode('walk');
    const order = ['walk', 'train', 'taxi'];
    let inView = false;
    new IntersectionObserver(([e]) => (inView = e.isIntersecting), { threshold: 0.3 }).observe($('#phone'));
    setInterval(() => { if (auto && inView && !reduce) { idx = (idx + 1) % 3; setMode(order[idx]); } }, 3600);

    // tilt
    const wrap = $('#phoneWrap'), ph = $('#phone');
    if (!reduce && matchMedia('(hover:hover)').matches) {
      wrap.addEventListener('pointermove', (e) => {
        const r = wrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        ph.style.transform = `rotateY(${(x * 16).toFixed(2)}deg) rotateX(${(-y * 12).toFixed(2)}deg)`;
      });
      wrap.addEventListener('pointerleave', () => (ph.style.transform = 'rotateY(-8deg) rotateX(4deg)'));
      ph.style.transform = 'rotateY(-8deg) rotateX(4deg)';
    }
  }

  /* =========================================================
     6. misc: nav, reveals, QR, forms, lang
  ========================================================= */
  function misc() {
    const nav = $('.nav');
    const onS = () => nav.classList.toggle('is-solid', scrollY > 60);
    addEventListener('scroll', onS, { passive: true }); onS();

    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.15 });
    $$('[data-in]').forEach((el) => {
      const sib = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute('data-in')) : [];
      el.style.transitionDelay = (Math.max(0, sib.indexOf(el)) * 0.08) + 's';
      io.observe(el);
    });

    // section titles drift with scroll
    const titles = $$('.sec-title span, .get__outline');
    if (!reduce) {
      let tk = false;
      const drift = () => {
        tk = false;
        titles.forEach((t) => {
          const r = t.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          const p = (r.top + r.height / 2) / innerHeight - 0.5;
          t.style.transform = `translateX(${(p * -6).toFixed(2)}vw)`;
        });
      };
      titles.forEach((t) => (t.style.display = 'inline-block'));
      addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(drift); } }, { passive: true });
      drift();
    }

    // decorative QR
    const q = $('#qr');
    if (q) {
      const g = q.getContext('2d'), N = 28, m = 6;
      g.fillStyle = '#fff'; g.fillRect(0, 0, 168, 168); g.fillStyle = '#07070c';
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const finder = (x, y) => { g.fillRect(x * m, y * m, 7 * m, 7 * m); g.fillStyle = '#fff'; g.fillRect((x + 1) * m, (y + 1) * m, 5 * m, 5 * m); g.fillStyle = '#07070c'; g.fillRect((x + 2) * m, (y + 2) * m, 3 * m, 3 * m); };
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const inF = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
        if (!inF && rnd() < 0.48) g.fillRect(x * m, y * m, m, m);
      }
      finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
      g.fillStyle = '#ff2fa0'; g.fillRect(12 * m, 12 * m, 4 * m, 4 * m);
    }

    // email form
    $('#smsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const i = $('#smsEmail');
      if (!i.value || !i.checkValidity()) { i.classList.add('is-bad'); i.focus(); return; }
      e.target.hidden = true; $('#smsOk').hidden = false;
    });
    $$('.store').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); a.querySelector('small').textContent = 'Demo only ·'; }));
    $$('.lang button').forEach((b) => b.addEventListener('click', () => $$('.lang button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)))));
  }

  clock();
  hero();
  board();
  districts();
  phone();
  misc();
})();
