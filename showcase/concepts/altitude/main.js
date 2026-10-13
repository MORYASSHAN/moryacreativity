/* ALTITUDE — concept landing page interactions */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const fmt = n => Math.round(n).toLocaleString('en-US');

  /* =========================================================
     HERO — layered "text behind the mountain" parallax
     ========================================================= */
  const hero = $('#hero');
  const sky = $('.layer-sky', hero);
  const ridge = $('.layer-ridge', hero);
  const title = $('#heroTitle');
  const IMG_W = 1330, IMG_H = 749, POS_Y = 0.62;
  let geo = { s: 1, ox: 0, oy: 0, W: 0, H: 0 };
  let heroVisible = true;

  function layoutHero() {
    const W = hero.clientWidth, H = hero.clientHeight;
    // the layer box is inset -4% / -5% (see CSS) — replicate object-fit: cover maths
    const lw = W * 1.08, lh = H * 1.10, lx = -W * 0.04, ly = -H * 0.05;
    const s = Math.max(lw / IMG_W, lh / IMG_H);
    const dw = IMG_W * s, dh = IMG_H * s;
    geo = { s, ox: lx + (lw - dw) * 0.5, oy: ly + (lh - dh) * POS_Y, W, H };

    // title: one line on wide screens, two lines on tall ones
    const stacked = W / H < 0.95;
    title.style.flexDirection = stacked ? 'column' : 'row';
    title.style.fontSize = '100px';
    const spans = $$('.t-line', title);
    const tw = (stacked ? Math.max(...spans.map(s => s.getBoundingClientRect().width)) : spans.reduce((a, s) => a + s.getBoundingClientRect().width, 0)) || 1;
    const target = W * (stacked ? 0.9 : 0.94);
    const fs = Math.min(100 * target / tw, stacked ? 240 : 340);
    title.style.fontSize = fs.toFixed(1) + 'px';
    // baseline sits where the central summits are: image y≈300 (stacked: a bit lower)
    const anchorY = geo.oy + (stacked ? 292 : 316) * s;
    const th = title.offsetHeight;
    title.style.top = (anchorY - th).toFixed(1) + 'px';
  }

  // pointer + scroll state
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollY = window.scrollY;
  const introStart = performance.now();
  const INTRO = reduce ? 1 : 1900;

  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    ptr.tx = (e.clientX / innerWidth) * 2 - 1;
    ptr.ty = (e.clientY / innerHeight) * 2 - 1;
  });
  hero.addEventListener('pointerleave', () => { ptr.tx = 0; ptr.ty = 0; });

  let ridgeOffset = { x: 0, y: 0 };
  function renderHero(now) {
    ptr.x = lerp(ptr.x, ptr.tx, 0.06);
    ptr.y = lerp(ptr.y, ptr.ty, 0.06);
    const intro = easeOut(clamp((now - introStart) / INTRO, 0, 1));
    const y = reduce ? 0 : Math.min(scrollY, geo.H * 1.2);
    const mx = reduce ? 0 : ptr.x, my = reduce ? 0 : ptr.y;
    const rise = (1 - intro);
    sky.style.transform = `translate3d(${(mx * -8).toFixed(2)}px, ${(my * -5 + y * 0.62).toFixed(2)}px, 0) scale(${(1.06 - intro * 0.06).toFixed(4)})`;
    title.style.transform = `translate3d(${(mx * -18).toFixed(2)}px, ${(my * -9 + y * 0.4 + rise * geo.H * 0.22).toFixed(2)}px, 0)`;
    ridgeOffset = { x: mx * -30, y: my * -12 + rise * 40 };
    ridge.style.transform = `translate3d(${ridgeOffset.x.toFixed(2)}px, ${ridgeOffset.y.toFixed(2)}px, 0)`;
  }

  /* =========================================================
     SNOWFALL + SPINDRIFT canvas
     ========================================================= */
  const cvs = $('#snow');
  const ctx = cvs.getContext('2d');
  let dpr = 1, flakes = [], drift = [], peaks = [];
  const sprite = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.35, 'rgba(240,248,255,.55)');
    rg.addColorStop(1, 'rgba(230,244,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return c;
  })();

  function findPeaks() {
    const R = window.RIDGE; if (!R) return [];
    const ys = R.y, out = [];
    for (let i = 4; i < ys.length - 4; i++) {
      let isMin = true;
      for (let k = -6; k <= 6; k++) { const j = i + k; if (j < 0 || j >= ys.length || k === 0) continue; if (ys[j] < ys[i]) { isMin = false; break; } }
      if (isMin && ys[i] < 330 && (!out.length || i * R.step - out[out.length - 1].x > 40)) out.push({ x: i * R.step, y: ys[i], strength: clamp((330 - ys[i]) / 75, 0.25, 1) });
    }
    return out;
  }

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = Math.round(geo.W * dpr); cvs.height = Math.round(geo.H * dpr);
    const n = Math.round(clamp(geo.W * geo.H / 9000, 50, 190));
    flakes = Array.from({ length: n }, () => newFlake(true));
  }
  function newFlake(anywhere) {
    const z = Math.random() * 0.75 + 0.25;
    return { x: Math.random() * geo.W, y: anywhere ? Math.random() * geo.H : -10, z, r: 0.6 + z * z * 2.4, ph: Math.random() * 6.28, sp: 18 + z * 46 };
  }
  const toScreen = (ix, iy) => ({ x: geo.ox + ix * geo.s + ridgeOffset.x, y: geo.oy + iy * geo.s + ridgeOffset.y });

  let wind = 1, last = performance.now(), emitAcc = 0;
  function renderSnow(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const t = now / 1000;
    const gust = 0.55 + 0.45 * Math.sin(t * 0.37) * Math.sin(t * 0.11 + 1.3) + 0.25 * Math.sin(t * 1.7);
    wind = lerp(wind, 30 + gust * 70 + ptr.x * 60, 0.05);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, geo.W, geo.H);

    // spindrift plumes from the summits
    emitAcc += dt * 60;
    while (emitAcc > 1) {
      emitAcc -= 1;
      for (const p of peaks) {
        if (Math.random() > 0.38 * p.strength * clamp(gust + 0.2, 0.2, 1.2)) continue;
        const s = toScreen(p.x + (Math.random() - 0.3) * 14, p.y + Math.random() * 10);
        drift.push({ x: s.x, y: s.y, vx: wind * (0.8 + Math.random() * 0.9), vy: -2 - Math.random() * 8, life: 0, max: 1.8 + Math.random() * 2.4, r: 3 + Math.random() * 5, a: 0.22 + Math.random() * 0.25 * p.strength });
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = drift.length - 1; i >= 0; i--) {
      const d = drift[i];
      d.life += dt;
      if (d.life > d.max) { drift.splice(i, 1); continue; }
      d.vx = lerp(d.vx, wind * 1.4, 0.02);
      d.vy += 9 * dt;
      d.x += d.vx * dt; d.y += d.vy * dt;
      const k = d.life / d.max;
      const a = d.a * (k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88);
      const r = d.r + k * 30;
      ctx.globalAlpha = Math.min(1, a * 0.95);
      ctx.drawImage(sprite, d.x - r * 1.3, d.y - r * 0.42, r * 2.6, r * 0.84);
    }
    ctx.globalCompositeOperation = 'source-over';

    // snowfall
    for (const f of flakes) {
      f.ph += dt * (0.8 + f.z);
      f.y += f.sp * dt;
      f.x += (wind * 0.55 * f.z + Math.sin(f.ph) * 10 * f.z) * dt;
      if (f.y > geo.H + 10) Object.assign(f, newFlake(false));
      if (f.x > geo.W + 10) f.x = -10; else if (f.x < -10) f.x = geo.W + 10;
      ctx.globalAlpha = 0.35 + f.z * 0.6;
      const r = f.r * 3;
      ctx.drawImage(sprite, f.x - r, f.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }

  // master hero loop (paused offscreen)
  let heroRaf = 0;
  function heroLoop(now) {
    renderHero(now);
    if (!reduce) renderSnow(now);
    heroRaf = heroVisible && !document.hidden ? requestAnimationFrame(heroLoop) : 0;
  }
  function startHero() { if (!heroRaf) { last = performance.now(); heroRaf = requestAnimationFrame(heroLoop); } }
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; if (heroVisible) startHero(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && heroVisible) startHero(); });

  function onResize() { layoutHero(); sizeCanvas(); if (reduce) renderHero(performance.now()); }
  peaks = findPeaks();
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => {
    onResize();
    requestAnimationFrame(() => document.body.classList.add('ready'));
    startHero();
  });
  onResize();
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(onResize, 120); });

  /* =========================================================
     NAV + ALTITUDE METER
     ========================================================= */
  const nav = $('#nav');
  const meterVal = $('#meterVal'), meterZone = $('#meterZone'), meterTemp = $('#meterTemp'), meterO2 = $('#meterO2'), meterFill = $('#meterFill');
  const ZONES = [[1400, 'Valley floor'], [1900, 'Larch forest'], [2500, 'Treeline'], [3100, 'Moraine & ice'], [3800, 'Glacier'], [4400, 'Summit ridge'], [1e9, 'Summit — Matterhorn']];
  let altShown = 1050, altTarget = 1050, meterRaf = 0;
  function meterTick() {
    altShown = Math.abs(altTarget - altShown) < 0.6 ? altTarget : lerp(altShown, altTarget, reduce ? 1 : 0.12);
    meterVal.textContent = fmt(altShown);
    meterZone.textContent = ZONES.find(z => altShown < z[0])[1];
    meterTemp.textContent = (12 - 0.0065 * (altShown - 1050)).toFixed(1);
    meterO2.textContent = Math.round(Math.exp(-altShown / 8434) * 100);
    meterFill.style.height = ((altShown - 1050) / 3428 * 100).toFixed(2) + '%';
    meterRaf = altShown !== altTarget ? requestAnimationFrame(meterTick) : 0;
  }
  function onScroll() {
    scrollY = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
    altTarget = 1050 + 3428 * p;
    if (!meterRaf) meterRaf = requestAnimationFrame(meterTick);
    nav.classList.toggle('solid', scrollY > geo.H * 0.8);
    if (reduce && heroVisible) renderHero(performance.now());
    wordsTick();
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* =========================================================
     MANIFESTO — word-by-word reveal tied to scroll
     ========================================================= */
  const statement = $('.reveal-words');
  const words = [];
  if (statement) {
    const text = statement.textContent.trim();
    statement.textContent = '';
    text.split(/\s+/).forEach((w, i) => {
      const s = document.createElement('span'); s.className = 'w'; s.textContent = w;
      statement.appendChild(s); statement.appendChild(document.createTextNode(' ')); words.push(s);
    });
  }
  function wordsTick() {
    if (!statement || reduce) return;
    const r = statement.getBoundingClientRect();
    const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0, 1);
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  }

  /* =========================================================
     EXPEDITIONS — routes & elevation profile
     ========================================================= */
  const ROUTES = [
    {
      name: 'The Haute Route', path: 'Chamonix → Zermatt · Ski-touring',
      desc: 'The classic glacier traverse between the two great alpine towns. Seven days, six huts, a dawn on the Pigne d’Arolla and a final ski down past the north face of the Matterhorn.',
      dist: 108, asc: '7,850 m', grade: 'PD+ · ski III', price: 'CHF 3,950', seed: 11,
      wps: [[0, 1252, 'Argentière', 1], [8, 3323, 'Col du Chardonnet'], [14, 3170, 'Cabane du Trient', 1], [25, 1466, 'Champex'], [44, 2662, 'Cabane de Prafleuri'], [50, 3336, 'Col de la Rosablanche', 1], [60, 2928, 'Cabane des Dix'], [70, 3790, 'Pigne d’Arolla', 1], [73, 3160, 'Cabane des Vignettes'], [81, 3392, 'Col de l’Évêque'], [87, 3213, 'Col du Mont Brulé'], [95, 3568, 'Col de Valpelline', 1], [108, 1608, 'Zermatt', 1]]
    },
    {
      name: 'Monte Rosa 4000s', path: 'Klein Matterhorn → Monte Rosa Hut · Mountaineering',
      desc: 'Ten summits above 4,000 metres strung along the Italian–Swiss border, sleeping in the highest hut in Europe. Big days on the glacier, short sharp ridges, unforgettable sunrises.',
      dist: 38, asc: '4,120 m', grade: 'PD · F to AD-', price: 'CHF 3,200', seed: 23,
      wps: [[0, 3883, 'Klein Matterhorn', 1], [3, 4164, 'Breithorn', 1], [8.5, 3420, 'Rif. Guide d’Ayas'], [13, 4228, 'Castor', 1], [16, 3585, 'Rif. Q. Sella'], [21.5, 4178, 'Vincent Pyramid'], [24, 4341, 'Ludwigshöhe'], [27, 4554, 'Capanna Margherita', 1], [28.2, 4563, 'Zumsteinspitze'], [31, 3990, 'Lisjoch'], [38, 2883, 'Monte Rosa Hut', 1]]
    },
    {
      name: 'Matterhorn, Hörnli Ridge', path: 'Zermatt → Summit · Alpine rock',
      desc: 'Two days of acclimatisation and rope-work on the Riffelhorn, a night in the Hörnli Hut, then the ridge itself — 1,200 metres of rock and ice to the cross at 4,478 metres. One guide, one climber.',
      dist: 11.4, asc: '2,870 m', grade: 'AD · III', price: 'CHF 4,600', seed: 37,
      wps: [[0, 1608, 'Zermatt', 1], [3.4, 2222, 'Furi'], [6, 2583, 'Schwarzsee', 1], [8.9, 3260, 'Hörnli Hut', 1], [9.6, 3640, 'Lower Moseley Slab'], [10.2, 4003, 'Solvay Hut', 1], [10.8, 4250, 'The Shoulder'], [11.4, 4478, 'Summit', 1]]
    }
  ];

  // deterministic noise so profiles look like real GPS tracks
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function buildProfile(r) {
    const N = 360, rand = rng(r.seed), pts = [];
    const n1 = Array.from({ length: 40 }, () => rand() * 2 - 1), n2 = Array.from({ length: 120 }, () => rand() * 2 - 1);
    const smooth = (arr, u) => { const f = u * (arr.length - 1), i = Math.floor(f), t = f - i, a = arr[i], b = arr[Math.min(arr.length - 1, i + 1)]; const s = t * t * (3 - 2 * t); return a + (b - a) * s; };
    for (let i = 0; i <= N; i++) {
      const d = r.dist * i / N;
      let k = 0; while (k < r.wps.length - 2 && r.wps[k + 1][0] < d) k++;
      const [d0, e0] = r.wps[k], [d1, e1] = r.wps[k + 1];
      const t = clamp((d - d0) / (d1 - d0), 0, 1);
      const s = t * t * (3 - 2 * t);
      // pinch the noise to zero at waypoints so huts/summits stay exact
      const pinch = Math.sin(Math.PI * t);
      const span = Math.abs(e1 - e0) * 0.08 + 60;
      const e = e0 + (e1 - e0) * s + pinch * (smooth(n1, i / N) * span + smooth(n2, i / N) * 22);
      pts.push([d, e]);
    }
    return pts;
  }
  ROUTES.forEach(r => { r.pts = buildProfile(r); r.high = Math.max(...r.pts.map(p => p[1]), ...r.wps.map(w => w[1])); });

  const VB_W = 1000, VB_H = 360, E_MIN = 1000, E_MAX = 4900, PAD_T = 16, PAD_B = 6;
  const xOf = (d, r) => d / r.dist * VB_W;
  const yOf = e => PAD_T + (1 - (e - E_MIN) / (E_MAX - E_MIN)) * (VB_H - PAD_T - PAD_B);
  const svg = $('#profileSvg'), fig = $('#profile');
  const pLine = $('#pLine'), pArea = $('#pArea'), pHatch = $('#pHatch'), pGrid = $('#pGrid'), pWps = $('#pWps');
  const pmLine = $('#pmLine'), pmDot = $('#pmDot'), pAxis = $('#pAxis');
  const prAlt = $('#prAlt'), prKm = $('#prKm'), prWp = $('#prWp');
  const NS = 'http://www.w3.org/2000/svg';
  // clip rect drives the left-to-right "drawing" of the trace
  const clip = document.createElementNS(NS, 'clipPath'); clip.id = 'drawClip';
  const clipRect = document.createElementNS(NS, 'rect');
  clipRect.setAttribute('x', '-5'); clipRect.setAttribute('y', '-20'); clipRect.setAttribute('height', String(VB_H + 40)); clipRect.setAttribute('width', '0');
  clip.appendChild(clipRect); $('defs', svg).appendChild(clip);
  [pLine, pArea, pHatch, pWps].forEach(el => el.setAttribute('clip-path', 'url(#drawClip)'));

  // altitude gridlines
  for (let e = 1500; e <= 4500; e += 500) {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', 0); l.setAttribute('x2', VB_W); l.setAttribute('y1', yOf(e)); l.setAttribute('y2', yOf(e));
    if (e === 4000) l.setAttribute('stroke-dasharray', '4 4');
    pGrid.appendChild(l);
  }
  const altLabels = [];
  for (let e = 1500; e <= 4500; e += 500) {
    const s = document.createElement('span'); s.className = 'profile-alt-lbl'; s.textContent = fmt(e) + ' m'; s.dataset.e = e;
    fig.appendChild(s); altLabels.push(s);
  }

  let cur = 0, drawT = 1, drawRaf = 0, hoverD = null, wpLabels = [];
  function svgBox() { const a = svg.getBoundingClientRect(), b = fig.getBoundingClientRect(); return { left: a.left - b.left, top: a.top - b.top, w: a.width, h: a.height }; }
  function placeOverlays() {
    const r = ROUTES[cur], b = svgBox();
    altLabels.forEach(l => { l.style.top = (b.top + yOf(+l.dataset.e) / VB_H * b.h) + 'px'; });
    wpLabels.forEach(({ el, d, e }) => { el.style.left = clamp(b.left + xOf(d, r) / VB_W * b.w, 60, b.w - 60) + 'px'; el.style.top = (b.top + yOf(e) / VB_H * b.h) + 'px'; });
  }
  function elevAt(r, d) {
    const f = d / r.dist * (r.pts.length - 1), i = Math.floor(f), t = f - i;
    const a = r.pts[clamp(i, 0, r.pts.length - 1)][1], b = r.pts[clamp(i + 1, 0, r.pts.length - 1)][1];
    return a + (b - a) * t;
  }

  function renderRoute(idx, animate) {
    cur = idx; const r = ROUTES[idx];
    const line = r.pts.map((p, i) => (i ? 'L' : 'M') + xOf(p[0], r).toFixed(2) + ' ' + yOf(p[1]).toFixed(2)).join(' ');
    pLine.setAttribute('d', line);
    const area = line + ` L ${VB_W} ${VB_H} L 0 ${VB_H} Z`;
    pArea.setAttribute('d', area); pHatch.setAttribute('d', area);
    // waypoints
    pWps.textContent = '';
    wpLabels.forEach(w => w.el.remove()); wpLabels = [];
    r.wps.forEach(([d, e, name, key], i) => {
      const c = document.createElementNS(NS, 'ellipse');
      c.setAttribute('cx', xOf(d, r)); c.setAttribute('cy', yOf(e)); c.setAttribute('class', 'wp-dot');
      // compensate for the non-uniform stretch so dots stay round-ish
      const b = svgBox(); const sx = VB_W / Math.max(1, b.w), sy = VB_H / Math.max(1, b.h);
      c.setAttribute('rx', (4 * sx).toFixed(2)); c.setAttribute('ry', (4 * sy).toFixed(2));
      pWps.appendChild(c);
      if (key && innerWidth > 560) {
        const el = document.createElement('span'); el.className = 'wp-lbl';
        el.innerHTML = `${name}<small>${fmt(e)} m</small>`;
        fig.appendChild(el); wpLabels.push({ el, d, e, i });
      }
    });
    // km axis
    pAxis.textContent = '';
    const step = r.dist > 60 ? 20 : r.dist > 20 ? 5 : 2;
    for (let d = 0; d <= r.dist + 0.001; d += step) {
      const s = document.createElement('span'); s.textContent = d + ' km'; s.style.left = clamp(d / r.dist * 100, 5, 95) + '%'; pAxis.appendChild(s);
    }
    placeOverlays();
    // info panel
    const info = $('.route-info');
    const fill = () => {
      $('#rPath').textContent = r.path; $('#rTitle').textContent = r.name; $('#rDesc').textContent = r.desc;
      $('#rDist').textContent = r.dist + ' km'; $('#rAsc').textContent = r.asc; $('#rHigh').textContent = fmt(r.high) + ' m';
      $('#rGrade').textContent = r.grade; $('#rPrice').textContent = r.price;
      $('#pCaption').textContent = `${r.name}: ${r.dist} km, high point ${fmt(r.high)} m.`;
    };
    if (animate && !reduce) { info.classList.add('swap'); setTimeout(() => { fill(); info.classList.remove('swap'); }, 260); } else fill();
    prAlt.textContent = fmt(r.wps[0][1]) + ' m'; prKm.textContent = 'km 0 · start'; prWp.textContent = r.wps[0][2];
    drawIn(animate);
  }

  function drawIn(animate) {
    cancelAnimationFrame(drawRaf);
    const r = ROUTES[cur];
    if (reduce || !animate) { drawT = 1; clipRect.setAttribute('width', VB_W + 10); wpLabels.forEach(w => w.el.classList.add('on')); return; }
    const t0 = performance.now(), dur = 1700;
    wpLabels.forEach(w => w.el.classList.remove('on'));
    fig.classList.remove('hovering');
    const step = now => {
      drawT = clamp((now - t0) / dur, 0, 1);
      const k = 1 - Math.pow(1 - drawT, 2.2);
      clipRect.setAttribute('width', (k * (VB_W + 10)).toFixed(1));
      const d = k * r.dist;
      wpLabels.forEach(w => { if (w.d <= d + 0.01) w.el.classList.add('on'); });
      if (hoverD === null) {
        // the readout counts along with the drawing head
        const e = elevAt(r, Math.min(d, r.dist));
        prAlt.textContent = fmt(e) + ' m'; prKm.textContent = 'km ' + d.toFixed(1);
        const b = svgBox();
        pmDot.style.transform = `translate(${b.left + k * b.w}px, ${b.top + yOf(e) / VB_H * b.h}px)`;
        pmDot.style.opacity = drawT < 1 ? 1 : '';
      }
      if (drawT < 1) drawRaf = requestAnimationFrame(step);
      else if (hoverD === null) { pmDot.style.opacity = ''; prAlt.textContent = fmt(r.high) + ' m'; prKm.textContent = 'high point · ' + r.dist + ' km route'; prWp.textContent = r.wps.reduce((a, w) => w[1] > a[1] ? w : a)[2]; }
    };
    drawRaf = requestAnimationFrame(step);
  }

  function setHover(d) {
    const r = ROUTES[cur];
    hoverD = clamp(d, 0, r.dist);
    const e = elevAt(r, hoverD);
    const x = xOf(hoverD, r);
    pmLine.setAttribute('x1', x); pmLine.setAttribute('x2', x);
    const b = svgBox();
    pmDot.style.transform = `translate(${b.left + x / VB_W * b.w}px, ${b.top + yOf(e) / VB_H * b.h}px)`;
    fig.classList.add('hovering');
    prAlt.textContent = fmt(e) + ' m';
    prKm.textContent = `km ${hoverD.toFixed(1)} of ${r.dist}`;
    const near = r.wps.reduce((a, w) => Math.abs(w[0] - hoverD) < Math.abs(a[0] - hoverD) ? w : a);
    prWp.textContent = Math.abs(near[0] - hoverD) < r.dist * 0.035 ? near[2] : '';
  }
  svg.addEventListener('pointermove', e => { const b = svg.getBoundingClientRect(); setHover((e.clientX - b.left) / b.width * ROUTES[cur].dist); });
  svg.addEventListener('pointerleave', () => { hoverD = null; fig.classList.remove('hovering'); });
  svg.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const r = ROUTES[cur];
    setHover((hoverD ?? 0) + (e.key === 'ArrowRight' ? 1 : -1) * r.dist / 60);
  });
  svg.addEventListener('blur', () => { hoverD = null; fig.classList.remove('hovering'); });

  const tabs = $$('.route-tab');
  function selectTab(i, focus) {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
    if (focus) tabs[i].focus();
    if (i !== cur || focus === 'init') renderRoute(i, true);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(i));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); selectTab((i + 1) % tabs.length, true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); selectTab((i + tabs.length - 1) % tabs.length, true); }
    });
  });
  renderRoute(0, false);
  clipRect.setAttribute('width', '0');
  wpLabels.forEach(w => w.el.classList.remove('on'));
  let profileSeen = false;
  new IntersectionObserver(([e], o) => { if (e.isIntersecting && !profileSeen) { profileSeen = true; drawIn(true); o.disconnect(); } }, { threshold: 0.35 }).observe(fig);
  if (reduce) drawIn(false);
  addEventListener('resize', () => { placeOverlays(); });

  /* =========================================================
     GEAR LIST
     ========================================================= */
  const GEAR = [
    ['Avalanche safety', 'non-negotiable', [
      ['Transceiver, 3-antenna', 210, 'ess', 'rent'], ['Shovel, aluminium blade', 590, 'ess', 'rent'], ['Probe, 240 cm', 270, 'ess', 'rent'], ['Airbag pack, 30 L', 2650, '', 'rent']]],
    ['Technical', 'glacier & rock', [
      ['Boot crampons, 12-point', 820, 'ess', 'rent'], ['Ice axe, 55 cm', 380, 'ess', 'rent'], ['Harness, alpine light', 290, 'ess', 'rent'], ['2 lockers + Prusik loops', 190, 'ess'], ['Helmet', 330, 'ess', 'rent'], ['Ski crampons', 300, '', 'rent']]],
    ['Clothing', 'layer for −20°C', [
      ['Hardshell jacket', 420, 'ess'], ['Insulated belay jacket', 480, 'ess'], ['Merino base layer', 220], ['Softshell trousers', 560], ['Gloves — light & warm', 310, 'ess'], ['Buff & warm hat', 120]]],
    ['Personal', 'small, important', [
      ['Glacier glasses, cat. 4', 60, 'ess'], ['SPF 50+ & lip balm', 80, 'ess'], ['Headlamp + spare cells', 90, 'ess'], ['Hut sleeping liner', 160, 'ess'], ['Thermos, 1 L', 450], ['Blister kit', 70], ['Three days of snacks', 900]]]
  ];
  const gearCols = $('#gearCols');
  const check = '<svg viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5"/></svg>';
  let gid = 0;
  GEAR.forEach(([name, note, items]) => {
    const g = document.createElement('div'); g.className = 'gear-group'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', name);
    g.innerHTML = `<h3>${name}<small>${note}</small></h3>`;
    items.forEach(([n, w, ess, rent]) => {
      const id = 'g' + (gid++);
      const l = document.createElement('label'); l.className = 'gear-item';
      l.innerHTML = `<input type="checkbox" id="${id}" data-w="${w}" ${ess ? 'data-ess="1"' : ''}><span class="gear-box">${check}</span><span class="gear-name">${n}${ess ? '<em class="tag-ess">Essential</em>' : ''}${rent ? '<em class="tag-rent">We rent</em>' : ''}</span><span class="gear-w">${w >= 1000 ? (w / 1000).toFixed(2) + ' kg' : w + ' g'}</span>`;
      g.appendChild(l);
    });
    gearCols.appendChild(g);
  });
  const boxes = $$('input[type=checkbox]', gearCols);
  const ringFg = $('#ringFg'), pack = $('.pack');
  const CIRC = 2 * Math.PI * 52;
  function updatePack(save) {
    const on = boxes.filter(b => b.checked);
    const kg = on.reduce((s, b) => s + +b.dataset.w, 0) / 1000;
    const pct = Math.round(on.length / boxes.length * 100);
    const essMissing = boxes.filter(b => b.dataset.ess && !b.checked).length;
    $('#packPct').textContent = pct + '%';
    $('#packKg').textContent = kg.toFixed(1) + ' kg';
    $('#packCount').textContent = `${on.length} / ${boxes.length}`;
    $('#packEss').textContent = essMissing ? essMissing + ' missing' : 'all packed';
    ringFg.style.strokeDashoffset = (CIRC * (1 - pct / 100)).toFixed(1);
    pack.classList.toggle('full', pct === 100);
    const avy = boxes.slice(0, 3).every(b => b.checked);
    $('#packMsg').textContent = pct === 100 ? 'Fully loaded. See you at the trailhead at 05:30.'
      : !avy ? 'Start with the avalanche kit. It’s not optional.'
      : essMissing ? `Good. ${essMissing} essential${essMissing > 1 ? 's' : ''} to go — the Hörnli Hut doesn’t sell sunglasses.`
      : kg > 9 ? `Essentials done. At ${kg.toFixed(1)} kg, consider leaving the extras in the valley.` : 'Essentials done. Anything else is comfort.';
    if (save) try { localStorage.setItem('altitude-gear', JSON.stringify(boxes.map(b => b.checked ? 1 : 0))); } catch (e) { /* storage unavailable */ }
  }
  try { const saved = JSON.parse(localStorage.getItem('altitude-gear') || 'null'); if (Array.isArray(saved)) boxes.forEach((b, i) => b.checked = !!saved[i]); } catch (e) { /* ignore */ }
  ringFg.style.strokeDasharray = CIRC.toFixed(1);
  boxes.forEach(b => b.addEventListener('change', () => updatePack(true)));
  $('#packAll').addEventListener('click', () => { boxes.forEach(b => { if (b.dataset.ess) b.checked = true; }); updatePack(true); });
  $('#packReset').addEventListener('click', () => { boxes.forEach(b => b.checked = false); updatePack(true); });
  updatePack(false);

  /* =========================================================
     GUIDES — generative contour maps (marching squares)
     ========================================================= */
  const GUIDES = [
    { name: 'Anouk Perren', mono: 'AP', role: 'Lead guide · Zermatt', peak: 'Matterhorn', alt: 4478, tags: ['Matterhorn ×212', 'IFMGA 2008', 'DE · FR · EN'], seed: 4 },
    { name: 'Matteo Lanti', mono: 'ML', role: 'High-altitude lead · Courmayeur', peak: 'Dent du Géant', alt: 4013, tags: ['Monte Rosa ×140', 'IFMGA 2012', 'IT · EN'], seed: 9 },
    { name: 'Sina Imboden', mono: 'SI', role: 'Ski-touring lead · Saas-Fee', peak: 'Weissmies', alt: 4017, tags: ['Haute Route ×64', 'SLF observer', 'DE · EN'], seed: 15 },
    { name: 'Jonas Biner', mono: 'JB', role: 'Alpine rock & rescue · Täsch', peak: 'Weisshorn', alt: 4506, tags: ['Heli-rescue', 'IFMGA 2015', 'DE · FR'], seed: 21 }
  ];
  function contourSvg(seed) {
    const rand = rng(seed * 7919 + 13);
    const GW = 46, GH = 50, field = new Float32Array((GW + 1) * (GH + 1));
    // a few gaussian massifs + value noise ridges
    const hills = Array.from({ length: 4 }, (_, i) => ({ x: 0.25 + rand() * 0.5, y: 0.25 + rand() * 0.5, r: i ? 0.12 + rand() * 0.18 : 0.26 + rand() * 0.08, h: i ? 0.35 + rand() * 0.45 : 1 }));
    const nz = Array.from({ length: 12 * 12 }, () => rand());
    const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), tx = x - xi, ty = y - yi; const g = (a, b) => nz[((a % 12) + 12) % 12 + (((b % 12) + 12) % 12) * 12]; const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty); return lerp(lerp(g(xi, yi), g(xi + 1, yi), sx), lerp(g(xi, yi + 1), g(xi + 1, yi + 1), sx), sy); };
    let max = -1, mx = 0, my = 0;
    for (let j = 0; j <= GH; j++) for (let i = 0; i <= GW; i++) {
      const u = i / GW, v = j / GH;
      let h = 0; for (const k of hills) h += k.h * Math.exp(-((u - k.x) ** 2 + (v - k.y) ** 2) / (2 * k.r * k.r));
      h += (vn(u * 5, v * 5) - 0.5) * 0.22 + (vn(u * 11 + 3, v * 11) - 0.5) * 0.08;
      field[j * (GW + 1) + i] = h;
      if (h > max) { max = h; mx = u; my = v; }
    }
    const levels = 16, segsByLevel = [];
    for (let L = 1; L <= levels; L++) {
      const iso = max * L / (levels + 1); let d = '';
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
        const a = field[j * (GW + 1) + i], b = field[j * (GW + 1) + i + 1], c = field[(j + 1) * (GW + 1) + i + 1], e = field[(j + 1) * (GW + 1) + i];
        const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (e > iso ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const X = (i + 0) * 100 / GW, Y = j * 100 / GH, sx = 100 / GW, sy = 100 / GH;
        const t = (p, q) => (iso - p) / (q - p);
        const top = [X + sx * t(a, b), Y], right = [X + sx, Y + sy * t(b, c)], bot = [X + sx * t(e, c), Y + sy], left = [X, Y + sy * t(a, e)];
        const seg = (p, q) => { d += `M${p[0].toFixed(2)} ${p[1].toFixed(2)}L${q[0].toFixed(2)} ${q[1].toFixed(2)}`; };
        switch (idx) {
          case 1: case 14: seg(left, bot); break;
          case 2: case 13: seg(bot, right); break;
          case 3: case 12: seg(left, right); break;
          case 4: case 11: seg(top, right); break;
          case 5: seg(left, top); seg(bot, right); break;
          case 6: case 9: seg(top, bot); break;
          case 7: case 8: seg(left, top); break;
          case 10: seg(left, bot); seg(top, right); break;
        }
      }
      segsByLevel.push(`<path class="c${L % 4 === 0 ? ' major' : ''}" d="${d}"/>`);
    }
    return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${segsByLevel.join('')}<circle class="summit-ring" cx="${(mx * 100).toFixed(1)}" cy="${(my * 100).toFixed(1)}" r="2.6"/><circle class="summit-dot" cx="${(mx * 100).toFixed(1)}" cy="${(my * 100).toFixed(1)}" r="1.5"/></svg>`, mx, my };
  }
  const guideGrid = $('#guideGrid');
  GUIDES.forEach((g, i) => {
    const c = contourSvg(g.seed);
    const el = document.createElement('article'); el.className = 'guide reveal-up'; el.style.transitionDelay = (i * 0.08) + 's';
    el.innerHTML = `<div class="guide-map" style="--cx:${(c.mx * 100).toFixed(1)}%;--cy:${(c.my * 100).toFixed(1)}%">${c.svg}<span class="guide-peak">HOME PEAK<br>${g.peak}<br>${fmt(g.alt)} M</span><span class="guide-mono" aria-hidden="true">${g.mono}</span></div>
      <div class="guide-body"><h3>${g.name}</h3><p class="guide-role">${g.role}</p><div class="guide-tags">${g.tags.map(t => `<span>${t}</span>`).join('')}</div></div>`;
    guideGrid.appendChild(el);
  });

  /* =========================================================
     REVEALS, SEASON, FORMS
     ========================================================= */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.18 });
  $$('.reveal-up, .season').forEach(el => io.observe(el));

  const party = $('#bfParty');
  $$('.stepper button').forEach(b => b.addEventListener('click', () => { party.textContent = clamp(+party.textContent + +b.dataset.step, 1, 6); }));
  $('#bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const em = $('#bfEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)) { em.classList.add('bad'); em.focus(); return; }
    em.classList.remove('bad');
    const done = $('#bfDone'); done.hidden = false; done.setAttribute('tabindex', '-1'); done.focus();
  });
  $('#newsForm').addEventListener('submit', e => { e.preventDefault(); e.target.hidden = true; $('#newsDone').hidden = false; });

  onScroll();
})();
