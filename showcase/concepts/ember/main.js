/* EMBER — hand-drawn wildfire. Concept by Moryasshan. */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------------
   * 1. Crumpled black paper (generated once per size)
   * ------------------------------------------------------------------ */
  const paper = document.getElementById('paper');
  let paperW = 0, paperH = 0;
  function drawPaper() {
    const w = innerWidth, h = Math.max(innerHeight, screen.height || 0, 600);
    if (Math.abs(w - paperW) < 2 && h <= paperH) return;
    paperW = w; paperH = h;
    const d = Math.min(DPR, 1.5);
    paper.width = Math.round(w * d); paper.height = Math.round(h * d);
    paper.style.height = h + 'px';
    const x = paper.getContext('2d');
    x.setTransform(d, 0, 0, d, 0, 0);
    const R = mulberry(1337);
    x.fillStyle = '#141212'; x.fillRect(0, 0, w, h);

    // faceted crumple: jittered grid of triangles with random "normals"
    const cell = clamp(Math.min(w, h) / 5.5, 90, 200);
    const cols = Math.ceil(w / cell) + 3, rows = Math.ceil(h / cell) + 3;
    const P = [];
    for (let r = 0; r < rows; r++) {
      P[r] = [];
      for (let c = 0; c < cols; c++) {
        P[r][c] = { x: (c - 1) * cell + (R() - 0.5) * cell * 0.95, y: (r - 1) * cell + (R() - 0.5) * cell * 0.95 };
      }
    }
    const tris = [];
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = P[r][c], b = P[r][c + 1], cc = P[r + 1][c + 1], dd = P[r + 1][c];
      if (R() < 0.5) { tris.push([a, b, cc], [a, cc, dd]); } else { tris.push([a, b, dd], [b, cc, dd]); }
    }
    const lx = -0.55, ly = -0.8; // light from top-left
    x.save();
    x.filter = 'blur(2.5px)';
    for (const t of tris) {
      const nx = R() * 2 - 1, ny = R() * 2 - 1;
      const lit = (nx * lx + ny * ly); // -1.4..1.4
      const L = 20 + lit * 5.6;
      const [p0, p1, p2] = t;
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      const g = x.createLinearGradient(p0.x, p0.y, mx, my);
      const l0 = L + (R() - 0.5) * 5, l1 = L + (R() - 0.5) * 7;
      g.addColorStop(0, `rgb(${l0 | 0},${(l0 * 0.95) | 0},${(l0 * 0.91) | 0})`);
      g.addColorStop(1, `rgb(${l1 | 0},${(l1 * 0.95) | 0},${(l1 * 0.91) | 0})`);
      x.fillStyle = g;
      x.beginPath(); x.moveTo(p0.x, p0.y); x.lineTo(p1.x, p1.y); x.lineTo(p2.x, p2.y); x.closePath();
      x.fill(); x.stroke && (x.strokeStyle = g, x.lineWidth = 1, x.stroke());
    }
    x.restore();
    // crease lines
    x.lineCap = 'round';
    for (const t of tris) {
      for (let e = 0; e < 3; e++) {
        if (R() > 0.3) continue;
        const a = t[e], b = t[(e + 1) % 3];
        const segs = 4;
        const path = [];
        for (let s = 0; s <= segs; s++) {
          const f = s / segs;
          path.push([lerp(a.x, b.x, f) + (s && s < segs ? (R() - 0.5) * 6 : 0), lerp(a.y, b.y, f) + (s && s < segs ? (R() - 0.5) * 6 : 0)]);
        }
        const stroke = (col, lw, ox, oy) => {
          x.strokeStyle = col; x.lineWidth = lw; x.beginPath();
          path.forEach((p, i) => (i ? x.lineTo(p[0] + ox, p[1] + oy) : x.moveTo(p[0] + ox, p[1] + oy)));
          x.stroke();
        };
        stroke('rgba(0,0,0,.26)', 1.2, 0.8, 0.8);
        stroke(`rgba(255,240,222,${0.025 + R() * 0.04})`, 0.8, 0, 0);
      }
    }
    // fine wrinkles
    for (let i = 0; i < 700; i++) {
      const sx = R() * w, sy = R() * h, a = R() * Math.PI, len = 8 + R() * 40;
      x.strokeStyle = R() < 0.5 ? 'rgba(255,240,222,.035)' : 'rgba(0,0,0,.22)';
      x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(sx, sy);
      x.quadraticCurveTo(sx + Math.cos(a) * len * 0.5 + (R() - 0.5) * 6, sy + Math.sin(a) * len * 0.5 + (R() - 0.5) * 6, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
      x.stroke();
    }
    // grain
    const id = x.getImageData(0, 0, paper.width, paper.height);
    const D = id.data;
    for (let i = 0; i < D.length; i += 4) {
      const n = (R() - 0.5) * 16;
      D[i] += n; D[i + 1] += n; D[i + 2] += n;
    }
    x.putImageData(id, 0, 0);
    // vignette
    x.setTransform(d, 0, 0, d, 0, 0);
    const vg = x.createRadialGradient(w * 0.5, h * 0.45, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    x.fillStyle = vg; x.fillRect(0, 0, w, h);
  }
  drawPaper();

  /* ------------------------------------------------------------------
   * 2. The fire scene
   * ------------------------------------------------------------------ */
  const hero = document.getElementById('hero');
  const cv = document.getElementById('fire');
  const ctx = cv.getContext('2d');
  const capTime = document.querySelector('.cap-time');
  const capText = document.querySelector('.cap-text');
  const distEl = document.getElementById('dist');
  const heldEl = document.getElementById('held');
  const annot = document.querySelector('.annot');
  cv.tabIndex = 0;

  const C = { red: '#ff1a0e', orange: '#ff8a00', yellow: '#ffc93c', pale: '#ffe9a0' };
  const GREENS = ['#1e4527', '#2a5a30', '#17361f', '#335f2c'];
  const WATER = ['#3d8bff', '#7cc4ff', '#2b62d9', '#a8dcff'];
  let W = 0, H = 0, groundY = 0, houseX = 0, maxH = 0, mobile = false;
  let roots = [], trees = [], grass = [], ridge = [];
  let drops = [], smokes = [], plumes = [], sparks = [], splashes = [];
  let front = 0, frontTarget = 0, progress = 0;
  let mx = -9999, my = -9999, inside = false, raining = false, keyRain = false;
  let t = 0, boil = 0, held = 0, rainedOnce = false;

  // crayon tooth: a speckle pattern punched out of every stroke
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = grainCanvas.height = 220;
  (() => {
    const g = grainCanvas.getContext('2d');
    const im = g.createImageData(220, 220);
    const R = mulberry(99);
    for (let i = 0; i < im.data.length; i += 4) {
      const r = R();
      im.data[i + 3] = r < 0.11 ? 150 + R() * 105 : r < 0.27 ? 60 : 0;
    }
    g.putImageData(im, 0, 0);
    // a few long horizontal skips like paper ridges
    g.globalAlpha = 0.5; g.fillStyle = '#000';
    for (let i = 0; i < 40; i++) g.fillRect(R() * 220, R() * 220, 4 + R() * 14, 1);
  })();
  const grainPat = ctx.createPattern(grainCanvas, 'repeat');

  function layout() {
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    mobile = W < 720;
    groundY = Math.round(H * (mobile ? 0.735 : 0.79));
    houseX = W * (mobile ? 0.80 : 0.87);
    maxH = Math.min(H * (mobile ? 0.19 : 0.29), 300);
    const R = mulberry(2024);
    roots = [];
    for (let x = -30; x < W + 30; x += (mobile ? 12 : 15) + R() * 16) {
      roots.push({ x, b: 0.35 + R() * 0.65, w: mobile ? 18 + R() * 24 : 34 + R() * 38, ph: R() * 6.28, sp: 0.7 + R() * 1.5, heat: 1 });
    }
    trees = [];
    for (let x = 6 + R() * 20; x < W - 10; x += (mobile ? 26 : 30) + R() * 64) {
      if (Math.abs(x - houseX) < (mobile ? 46 : 64)) continue;
      const back = R() < 0.42;
      const s = mobile ? 0.68 : 1;
      trees.push({ x, back, h: (back ? 50 + R() * 70 : 70 + R() * 110) * s, wf: 0.36 + R() * 0.12, c: (R() * GREENS.length) | 0, tiers: 3 + ((R() * 3) | 0) });
    }
    trees.sort((a, b) => (b.back - a.back));
    grass = [];
    for (let x = 0; x < W; x += 4 + R() * 6) grass.push({ x, h: 5 + R() * 15, lean: (R() - 0.35) * 7, c: R() < 0.5 ? '#3f7a3a' : '#5c8f3e' });
    ridge = [];
    const rTop = groundY - H * 0.2;
    for (let x = -20, i = 0; x < W + 40; x += 28, i++) {
      ridge.push([x, rTop + Math.sin(x * 0.006) * H * 0.05 + Math.sin(x * 0.017 + 1) * H * 0.025 + (R() - 0.5) * 8]);
    }
    onScroll();
    front = frontTarget;
    render();
  }

  function onScroll() {
    const r = hero.getBoundingClientRect();
    progress = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
    const e = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    frontTarget = lerp(W * (mobile ? 0.28 : 0.24), houseX - (mobile ? 6 : 10), e);
    if (RM) { front = frontTarget; needs = true; }
    // captions
    const caps = [[0, '06:12', 'A spark on the ridge.'], [0.28, '06:31', 'The wind turns. Forty kilometres an hour.'], [0.6, '06:47', 'It reaches the first fence line.'], [0.9, '06:58', 'Eleven minutes. That is all the warning anyone gets.']];
    let cap = caps[0];
    for (const c of caps) if (progress >= c[0]) cap = c;
    if (capTime.textContent !== cap[1]) { capTime.textContent = cap[1]; capText.textContent = cap[2]; }
    distEl.textContent = Math.max(0.1, 2.4 * (1 - e)).toFixed(1);
  }

  /* ---------- crayon helpers ---------- */
  let r = mulberry(1);
  const J = 1.7;
  function poly(pts, col, lw, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0] + (r() - 0.5) * J, py = pts[i][1] + (r() - 0.5) * J;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function crayonLine(pts, col, lw, alpha = 1) {
    poly(pts, col, lw, alpha);
    poly(pts, col, lw * 0.45, alpha * 0.7);
  }
  function seg(x1, y1, x2, y2, n = 3) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push([lerp(x1, x2, i / n), lerp(y1, y2, i / n)]);
    return out;
  }

  /* ---------- scene pieces ---------- */
  function heightAt(root) {
    const d = front + Math.sin(root.x * 0.045) * 16 - root.x;
    if (d < -6) return 0;
    const lead = clamp((d + 6) / 80, 0, 1);
    const far = clamp(1 - (d - 200) / (W * 0.62), 0.1, 1);
    const breathe = 0.82 + 0.18 * Math.sin(t * root.sp * 2.2 + root.ph);
    return maxH * root.b * lead * far * root.heat * breathe;
  }

  function drawRidge() {
    crayonLine(ridge, 'rgba(160,150,138,.20)', 1.6);
    // a few hatch marks under the ridge
    for (let i = 1; i < ridge.length - 1; i += 2) {
      const [x, y] = ridge[i];
      poly([[x, y + 6], [x + 10, y + 18]], 'rgba(160,150,138,.09)', 1.2);
    }
  }

  function drawGround() {
    const pts = [];
    for (let x = -10; x <= W + 10; x += 22) pts.push([x, groundY + Math.sin(x * 0.02) * 1.5]);
    crayonLine(pts, '#5a4632', 2.4);
    // burnt earth hatching behind the front
    const burnEnd = front - 30;
    for (let x = 0; x < burnEnd; x += 7) {
      poly([[x, groundY + 4], [x + 6, groundY + 12 + r() * 6]], 'rgba(70,62,58,.55)', 1.4);
    }
  }

  function drawGrass() {
    for (const g of grass) {
      const d = front - g.x;
      if (d > 40) {
        // ash stubble
        if (g.h > 9) poly([[g.x, groundY], [g.x + g.lean * 0.3, groundY - g.h * 0.35]], '#3a3532', 1);
        continue;
      }
      const sway = Math.sin(t * 1.6 + g.x * 0.05) * 1.5;
      let lean = g.lean + sway;
      if (inside) lean += clamp((mx - g.x) / 200, -1, 1) * 3 * Math.exp(-Math.abs(mx - g.x) / 260);
      poly([[g.x, groundY + 1], [g.x + lean * 0.5, groundY - g.h * 0.5], [g.x + lean, groundY - g.h]], d > -30 ? '#8a6a2a' : g.c, 1.1);
    }
  }

  function drawTree(tr) {
    const base = groundY - (tr.back ? 7 : 0);
    const h = tr.h, w = h * tr.wf, x = tr.x;
    const d = front - x;
    const charred = d > 110;
    const scorched = d > 30 && !charred;
    if (charred) {
      poly(seg(x, base, x + (r() - 0.5) * 2, base - h * 0.92, 4), '#0e0c0b', 3.2);
      poly(seg(x, base, x, base - h * 0.9, 4), '#3b3430', 1.2);
      for (let i = 0; i < tr.tiers + 1; i++) {
        const y = base - h * (0.25 + i * 0.16);
        const bl = w * 0.36 * (1 - i * 0.16);
        poly([[x, y], [x - bl, y + bl * 0.45]], '#1a1614', 1.6);
        poly([[x, y - 4], [x + bl * 0.9, y + bl * 0.35]], '#1a1614', 1.6);
      }
      return;
    }
    // trunk
    poly(seg(x, base + 1, x, base - h * 0.95, 3), '#2b1e15', 2.6);
    // scribbled foliage, top to bottom zig-zag
    const n = Math.max(10, Math.round(h / 4.2));
    const pts = [];
    const sway = Math.sin(t * 1.1 + x * 0.03) * 2;
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const tier = (s * tr.tiers) % 1;
      const half = (w / 2) * (0.06 + 0.94 * s) * (0.58 + 0.42 * tier);
      const y = base - h + s * h * 0.86;
      pts.push([x + sway * (1 - s) + (i % 2 ? half : -half) * (0.8 + r() * 0.3), y]);
    }
    const col = scorched ? '#3b2a12' : (tr.back ? '#183322' : GREENS[tr.c]);
    poly(pts, col, tr.back ? 2.6 : 3);
    poly(pts.map(p => [p[0] + 1.5, p[1] + 1.2]), scorched ? '#5a3a10' : (tr.back ? '#1f3d26' : '#2f6634'), 1.2, 0.8);
  }

  function drawHouse() {
    const hw = mobile ? 42 : 60, hh = hw * 0.68;
    const x0 = houseX - hw / 2, y0 = groundY - hh;
    const near = clamp(1 - (houseX - front) / 220, 0, 1);
    const col = near > 0.4 ? '#ffe6c8' : '#f3eee6';
    // wall hatching
    for (let i = 0; i < hw; i += 5) poly([[x0 + i, groundY - 2], [x0 + i + 4, y0 + 3]], 'rgba(243,238,230,.22)', 1.2);
    // walls
    crayonLine([[x0, groundY], [x0, y0], [x0 + hw, y0], [x0 + hw, groundY]], col, 2.2);
    // roof
    crayonLine([[x0 - hw * 0.12, y0 + 2], [houseX, y0 - hh * 0.75], [x0 + hw * 1.12, y0 + 2], [x0 - hw * 0.12, y0 + 2]], col, 2.4);
    // chimney
    poly([[x0 + hw * 0.7, y0 - hh * 0.3], [x0 + hw * 0.7, y0 - hh * 0.62], [x0 + hw * 0.82, y0 - hh * 0.62], [x0 + hw * 0.82, y0 - hh * 0.2]], col, 1.8);
    // door + window
    poly([[x0 + hw * 0.2, groundY], [x0 + hw * 0.2, y0 + hh * 0.38], [x0 + hw * 0.4, y0 + hh * 0.38], [x0 + hw * 0.4, groundY]], col, 1.8);
    const wx = x0 + hw * 0.58, wy = y0 + hh * 0.28, ws = hw * 0.24;
    for (let i = 0; i < 4; i++) poly([[wx + 2, wy + 2 + i * ws * 0.22], [wx + ws - 2, wy + 4 + i * ws * 0.22]], C.yellow, 2, 0.9);
    poly([[wx, wy], [wx + ws, wy], [wx + ws, wy + ws * 0.8], [wx, wy + ws * 0.8], [wx, wy]], col, 1.6);
    // a curl of chimney smoke that leans with the wind
    const cx = x0 + hw * 0.76, cy = y0 - hh * 0.68;
    const sm = [];
    for (let i = 0; i < 8; i++) sm.push([cx + i * 3 + Math.sin(i * 1.3 + t * 2) * 4, cy - i * 5]);
    poly(sm, 'rgba(200,192,182,.4)', 1.4);
  }

  function drawFlame(root, Hh) {
    let lean = Hh * 0.14 + Math.sin(t * 1.3 + root.ph) * Hh * 0.06;
    if (inside) {
      const dx = mx - root.x;
      const pull = Math.exp(-Math.abs(dx) / 460) * clamp((groundY - my) / 160 + 0.6, 0.3, 1.2);
      lean += clamp(dx / 220, -1, 1) * Hh * 0.62 * pull;
    }
    const L = [[1, 1, C.red, 3.6], [0.9, 0.86, C.red, 2.4], [0.76, 0.7, C.orange, 3.3], [0.54, 0.5, C.yellow, 2.9], [0.3, 0.3, C.pale, 2.5]];
    for (let k = 0; k < L.length; k++) {
      const [hs, ws, col, lw] = L[k];
      const h = Hh * hs;
      if (h < 5) continue;
      const w = root.w * ws * (0.55 + 0.45 * Math.min(1, Hh / 70));
      const n = Math.max(4, Math.round(h / 8.5));
      const flick = t * root.sp * 3 + root.ph + k;
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.beginPath();
      let px0 = 0, py0 = 0;
      for (let i = 0; i <= n; i++) {
        const s = i / n;
        const side = i % 2 ? 1 : -1;
        const hw = (w / 2) * Math.pow(1 - s, 0.7) * (1 + 1.2 * Math.sin(Math.PI * s) * (1 - s));
        const cx = root.x + lean * hs * Math.pow(s, 1.5) + Math.sin(s * 5 + flick) * h * 0.08 * s;
        const px = cx + side * hw * (0.75 + r() * 0.5) + (r() - 0.5) * J * 2;
        const py = groundY + 2 - s * h + (r() - 0.5) * J * 3 - side * 3;
        if (!i) ctx.moveTo(px, py);
        else ctx.quadraticCurveTo(px, py, (px + px0) / 2 + (r() - 0.5) * 3, (py + py0) / 2 - 2);
        px0 = px; py0 = py;
      }
      ctx.lineTo(px0, py0);
      ctx.stroke();
      // a loose outline flick on the outer layer
      if (k === 0 && r() < 0.5) {
        ctx.lineWidth = 1.4; ctx.beginPath();
        for (let i = 0; i <= 6; i++) {
          const s = 0.35 + i / 6 * 0.65;
          const hw = (w / 2) * Math.pow(1 - s, 0.75) * (1 + 1.15 * Math.sin(Math.PI * s) * (1 - s));
          const cx = root.x + lean * Math.pow(s, 1.5) + Math.sin(s * 5 + flick) * h * 0.07 * s;
          const px = cx - hw * 1.05 + (r() - 0.5) * 2, py = groundY - s * h * 1.04;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
    }
  }

  function loopy(x, y, rad, col, lw, alpha, turns = 7, seedOff = 0) {
    ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.beginPath();
    let a = seedOff;
    const N = turns * 12;
    for (let i = 0; i <= N; i++) {
      a += 0.62 + r() * 0.12;
      const rr = rad * (0.55 + 0.45 * Math.sin(i * 0.23 + seedOff)) * (0.92 + r() * 0.16);
      const px = x + Math.cos(a) * rr + (i / N - 0.5) * rad * 0.9;
      const py = y + Math.sin(a) * rr * 0.75 - (i / N) * rad * 0.5;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function render() {
    r = mulberry(RM ? 7 : boil * 7919 + 13);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // warm sky bloom over the burning zone (beneath the strokes)
    const gx = front - W * 0.12;
    const bloom = ctx.createRadialGradient(gx, groundY - maxH * 0.6, 10, gx, groundY - maxH * 0.4, W * 0.55);
    bloom.addColorStop(0, 'rgba(255,90,20,.16)'); bloom.addColorStop(0.5, 'rgba(255,40,10,.05)'); bloom.addColorStop(1, 'rgba(255,40,10,0)');
    ctx.fillStyle = bloom; ctx.fillRect(0, 0, W, H);

    drawRidge();
    // smoke plumes behind everything
    for (const p of plumes) {
      const a = (1 - p.life / p.max);
      loopy(p.x, p.y, p.r, '#8f8780', 1.5, 0.22 * Math.min(1, p.life * 1.5) * a, 6, p.seed);
    }
    for (const tr of trees) if (tr.back) drawTree(tr);
    drawGround();
    drawGrass();
    for (const tr of trees) if (!tr.back) drawTree(tr);
    drawHouse();

    // flames (back-to-front by height for layering variety)
    for (const root of roots) {
      const hh = heightAt(root);
      if (hh > 3) drawFlame(root, hh);
      else if (front - root.x > 0 && root.x < front && r() < 0.35) {
        // smouldering embers on the ground
        const ex = root.x + (r() - 0.5) * 10;
        poly([[ex, groundY - 1], [ex + 3, groundY - 3]], r() < 0.5 ? C.red : C.orange, 2.2);
      }
    }
    // sparks
    for (const s of sparks) poly([[s.x, s.y], [s.x - s.vx * 0.03, s.y - s.vy * 0.03]], s.c, 1.8, clamp(1 - s.life / s.max, 0, 1));
    // douse smoke
    for (const s of smokes) {
      const a = 1 - s.life / s.max;
      loopy(s.x, s.y, s.r, s.c, 1.5, 0.75 * a, 4, s.seed);
    }
    // rain
    if (raining || keyRain) {
      const cxp = keyRain && !raining ? front - 60 : mx, cyp = keyRain && !raining ? groundY - maxH - 70 : my;
      loopy(cxp - 14, cyp - 26, 26, '#7cc4ff', 2.2, 0.9, 6, boil);
      loopy(cxp + 20, cyp - 22, 20, '#3d8bff', 2, 0.85, 5, boil + 2);
      loopy(cxp, cyp - 40, 18, '#a8dcff', 1.6, 0.7, 4, boil + 4);
    }
    for (const d of drops) poly([[d.x, d.y], [d.x - d.vx * 0.02, d.y - d.len]], d.c, 2.6);
    for (const s of splashes) {
      const a = 1 - s.life / 0.35;
      poly([[s.x, groundY - 1], [s.x - 5, groundY - 7]], '#7cc4ff', 1.4, a);
      poly([[s.x, groundY - 1], [s.x + 5, groundY - 6]], '#7cc4ff', 1.4, a);
    }

    // punch the crayon tooth out of everything drawn so far
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    const ox = RM ? 0 : (boil * 37) % 220, oy = RM ? 0 : (boil * 53) % 220;
    ctx.translate(ox, oy);
    ctx.fillStyle = grainPat;
    ctx.fillRect(-ox, -oy, cv.width, cv.height);
    ctx.restore();

    // heat glow (additive, untextured)
    ctx.globalCompositeOperation = 'lighter';
    const fl = 0.85 + (RM ? 0 : r() * 0.3);
    const g2 = ctx.createRadialGradient(front - 80, groundY - maxH * 0.35, 4, front - 80, groundY - maxH * 0.3, maxH * 2.2);
    g2.addColorStop(0, `rgba(255,120,30,${0.2 * fl})`); g2.addColorStop(0.45, `rgba(255,50,10,${0.07 * fl})`); g2.addColorStop(1, 'rgba(255,40,10,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- simulation ---------- */
  let spawnAcc = 0, plumeAcc = 0, sparkAcc = 0;
  function douse(x, amt) {
    for (const root of roots) {
      const dx = Math.abs(root.x - x);
      if (dx > 24) continue;
      const before = heightAt(root);
      root.heat = Math.max(0, root.heat - amt * (1 - dx / 24));
      if (before > 8 && Math.random() < 0.16 && smokes.length < 70) {
        smokes.push({ x: root.x + (Math.random() - 0.5) * 10, y: groundY - before * 0.5, r: 7 + Math.random() * 8, vx: 8 + Math.random() * 18, vy: -(28 + Math.random() * 34), life: 0, max: 1.6 + Math.random() * 1.4, c: Math.random() < 0.5 ? '#9a948e' : '#6d6863', seed: Math.random() * 6 });
      }
    }
  }
  function update(dt) {
    front += (frontTarget - front) * Math.min(1, dt * 3.2);
    // recover heat slowly
    for (const root of roots) if (root.heat < 1) root.heat = Math.min(1, root.heat + dt * 0.04);
    // rain
    const isRain = raining || keyRain;
    if (isRain) {
      const sx = raining ? mx : front - 60, sy = raining ? my : groundY - maxH - 70;
      spawnAcc += dt * 150;
      while (spawnAcc > 1) {
        spawnAcc--;
        drops.push({ x: sx + (Math.random() - 0.5) * 70, y: sy - 18 + (Math.random() - 0.5) * 16, vx: 40 + Math.random() * 30, vy: 260 + Math.random() * 220, len: 8 + Math.random() * 9, c: WATER[(Math.random() * WATER.length) | 0] });
      }
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 1100 * dt;
      let hit = d.y >= groundY;
      if (!hit && d.y > groundY - maxH) {
        // passing through a flame?
        const near = roots.find(rt => Math.abs(rt.x - d.x) < 10);
        if (near) { const hh = heightAt(near); if (hh > 6 && d.y > groundY - hh * 0.9 && Math.random() < 0.12) hit = true; }
      }
      if (hit) {
        douse(d.x, 0.07);
        if (splashes.length < 50 && Math.random() < 0.4) splashes.push({ x: d.x, life: 0 });
        drops.splice(i, 1);
      } else if (d.y > H + 20) drops.splice(i, 1);
    }
    for (let i = splashes.length - 1; i >= 0; i--) { splashes[i].life += dt; if (splashes[i].life > 0.35) splashes.splice(i, 1); }
    for (let i = smokes.length - 1; i >= 0; i--) {
      const s = smokes[i]; s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += dt * 9;
      if (s.life > s.max) smokes.splice(i, 1);
    }
    // big smoke column from the burning zone
    if (!RM) {
      plumeAcc += dt * 3.2;
      while (plumeAcc > 1 && plumes.length < 30) {
        plumeAcc--;
        const px = front - Math.random() * Math.min(260, W * 0.3);
        plumes.push({ x: px, y: groundY - maxH * (0.75 + Math.random() * 0.4), r: 16 + Math.random() * 14, vx: 14 + Math.random() * 16, vy: -(18 + Math.random() * 20), life: 0, max: 6 + Math.random() * 4, seed: Math.random() * 6 });
      }
      plumeAcc = Math.min(plumeAcc, 2);
      sparkAcc += dt * 26;
      while (sparkAcc > 1) {
        sparkAcc--;
        const root = roots[(Math.random() * roots.length) | 0];
        const hh = heightAt(root);
        if (hh > 30 && sparks.length < 90) sparks.push({ x: root.x, y: groundY - hh * (0.6 + Math.random() * 0.4), vx: 10 + Math.random() * 40, vy: -(70 + Math.random() * 90), life: 0, max: 1 + Math.random() * 1.8, c: Math.random() < 0.6 ? C.yellow : C.orange });
      }
    }
    for (let i = plumes.length - 1; i >= 0; i--) {
      const p = plumes[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 7;
      if (p.life > p.max || p.y < -80) plumes.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.life += dt; s.x += (s.vx + Math.sin(s.life * 6 + i) * 30) * dt; s.y += s.vy * dt;
      if (s.life > s.max) sparks.splice(i, 1);
    }
    // how much line has been held: cooled flames inside the burning zone
    let cooled = 0;
    for (const root of roots) if (root.x < front && root.heat < 0.5) cooled++;
    held = Math.max(held, cooled);
  }

  let running = true, needs = true, acc = 0, last = performance.now(), shownHeld = -1;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!running) return;
    const active = raining || keyRain || drops.length || smokes.length || splashes.length;
    if (RM) {
      if (active) update(dt);
      else front = frontTarget;
      if (active || needs) { acc += dt; if (acc >= 1 / 12 || needs) { acc = 0; render(); needs = false; } }
    } else {
      t += dt; update(dt);
      acc += dt;
      if (acc >= 1 / 12) { acc %= 1 / 12; boil++; render(); }
    }
    const m = held * 4;
    if (m !== shownHeld) { shownHeld = m; heldEl.textContent = m; }
  }
  requestAnimationFrame(frame);
  // watchdog: if rAF is throttled (background tab / capture), still keep the scene in sync
  setInterval(() => {
    if (performance.now() - last > 400 && running) { front = frontTarget; t += 0.25; update(0.05); boil++; render(); }
  }, 250);

  new IntersectionObserver(([e]) => { running = e.isIntersecting; last = performance.now(); }, { rootMargin: '0px' }).observe(hero);

  /* ---------- input ---------- */
  function setPointer(e) {
    const rc = cv.getBoundingClientRect();
    mx = e.clientX - rc.left; my = e.clientY - rc.top;
    inside = mx >= 0 && my >= 0 && mx <= rc.width && my <= rc.height;
  }
  addEventListener('pointermove', setPointer, { passive: true });
  document.addEventListener('pointerleave', () => { inside = false; raining = false; });
  cv.addEventListener('pointerdown', e => {
    setPointer(e); raining = true; needs = true;
    if (!rainedOnce) { rainedOnce = true; annot.classList.add('gone'); }
  });
  const stopRain = () => { raining = false; };
  addEventListener('pointerup', stopRain);
  addEventListener('pointercancel', stopRain);
  addEventListener('blur', stopRain);
  cv.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); keyRain = true; if (!rainedOnce) { rainedOnce = true; annot.classList.add('gone'); } }
  });
  cv.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') keyRain = false; });
  cv.addEventListener('blur', () => { keyRain = false; });

  addEventListener('scroll', onScroll, { passive: true });
  let rzT;
  addEventListener('resize', () => {
    clearTimeout(rzT);
    rzT = setTimeout(() => { drawPaper(); if (Math.abs(cv.clientWidth - W) > 1 || Math.abs(cv.clientHeight - H) > 60) layout(); else onScroll(); buildTimeline(); placeCircle(false); }, 120);
  });
  layout();

  /* ------------------------------------------------------------------
   * 3. Reveals, counters, timeline, donate
   * ------------------------------------------------------------------ */
  const fmt = n => Math.round(n).toLocaleString('en-US');
  function countUp(el) {
    const to = +el.dataset.to;
    if (RM) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1800;
    (function step(now) {
      const k = clamp((now - t0) / dur, 0, 1);
      el.textContent = fmt(to * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  if (!RM) document.querySelectorAll('.count').forEach(el => { el.textContent = '0'; });
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      e.target.querySelectorAll('.count').forEach(countUp);
      io.unobserve(e.target);
    }
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .wordmark').forEach(el => io.observe(el));

  // timeline line drawn with scroll
  const tl = document.querySelector('.tl');
  const tlSvg = document.getElementById('tlLine');
  const tlPath = document.getElementById('tlPath');
  let tlLen = 0;
  function buildTimeline() {
    const h = tl.offsetHeight, w = tlSvg.clientWidth || 60;
    tlSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const R = mulberry(5);
    const cx = w / 2;
    let d = `M ${cx} 0`;
    for (let y = 30; y <= h; y += 30) {
      d += ` L ${(cx + Math.sin(y * 0.013) * (w * 0.12) + (R() - 0.5) * 4).toFixed(1)} ${y}`;
    }
    tlPath.setAttribute('d', d);
    tlLen = tlPath.getTotalLength();
    tlPath.style.strokeDasharray = tlLen;
    tlScroll();
  }
  function tlScroll() {
    if (!tlLen) return;
    const rc = tl.getBoundingClientRect();
    const k = RM ? 1 : clamp((innerHeight * 0.72 - rc.top) / rc.height, 0, 1);
    tlPath.style.strokeDashoffset = tlLen * (1 - k);
  }
  addEventListener('scroll', tlScroll, { passive: true });
  buildTimeline();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { buildTimeline(); placeCircle(false); });

  // donate
  const form = document.getElementById('giveForm');
  const chips = [...form.querySelectorAll('.chip')];
  const circle = form.querySelector('.circle');
  const becomes = form.querySelector('.becomes');
  const ctaLabel = document.getElementById('ctaLabel');
  const other = document.getElementById('otherAmt');
  const freqBtns = [...form.querySelectorAll('.freq button')];
  let amount = 40, monthly = false, current = chips[1];
  function placeCircle(redraw = true) {
    if (!current) { circle.classList.add('hide'); return; }
    circle.classList.remove('hide');
    circle.style.width = current.offsetWidth + 26 + 'px';
    circle.style.height = current.offsetHeight + 22 + 'px';
    circle.style.transform = `translate(${current.offsetLeft - 13}px, ${current.offsetTop - 11}px) rotate(-3deg)`;
    if (redraw && !RM) { circle.classList.remove('redraw'); void circle.getBoundingClientRect(); circle.classList.add('redraw'); }
  }
  function updateCopy() {
    const per = monthly ? ' a month' : '';
    ctaLabel.textContent = `Give $${amount.toLocaleString('en-US')}${monthly ? ' monthly' : ''}`;
    if (current) becomes.innerHTML = `$${amount}${per} becomes <strong>${current.dataset.what}</strong>.`;
    else {
      const tier = [...chips].reverse().find(c => +c.dataset.amt <= amount);
      becomes.innerHTML = amount > 0 ? `$${amount.toLocaleString('en-US')}${per} goes where the fire is. ${tier ? `That's at least <strong>${tier.dataset.what}</strong>.` : '<strong>Every dollar is a bucket.</strong>'}` : 'Choose an amount.';
    }
  }
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
    c.classList.add('on'); c.setAttribute('aria-checked', 'true');
    current = c; amount = +c.dataset.amt; other.value = '';
    placeCircle(); updateCopy();
  }));
  other.addEventListener('input', () => {
    const v = Math.max(0, Math.round(+other.value || 0));
    if (!other.value) { chips[1].click(); return; }
    chips.forEach(x => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
    current = null; amount = v; placeCircle(); updateCopy();
  });
  freqBtns.forEach(b => b.addEventListener('click', () => {
    freqBtns.forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    monthly = b.dataset.freq === 'monthly'; updateCopy();
  }));
  const thanks = form.querySelector('.thanks');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!amount) { other.focus(); return; }
    thanks.hidden = false; thanks.querySelector('.again').focus();
  });
  thanks.querySelector('.again').addEventListener('click', () => { thanks.hidden = true; form.querySelector('.cta').focus(); });
  placeCircle(false); updateCopy();

  // newsletter
  const news = document.getElementById('news');
  news.addEventListener('submit', e => {
    e.preventDefault();
    news.hidden = true; document.querySelector('.news-ok').hidden = false;
  });
})();
