// Alpine cut-out: separates the sky from the ridge of alps.webp
// Writes showcase/concepts/altitude/{ridge.webp, sky.webp, ridge.js}. Run from the repo root:
//   node scripts/altitude-cutout.cjs
const path = require('path');
const sharp = require(path.resolve('node_modules/sharp'));

const SRC = path.resolve('showcase/assets/img/alps.webp');
const OUT = path.resolve('showcase/concepts/altitude');
const DBG = path.resolve('scripts/.debug'); // debug previews (git-ignored)
const fs = require('fs');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(DBG, { recursive: true });

const T_SKY = +process.env.T_SKY || 30;   // max colour distance to modelled sky
const T_FULL = +process.env.T_FULL || 95; // distance at which a pixel is fully opaque

(async () => {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };

  // ---- 1. fit a smooth sky model  c(x,y) = a0 + a1 x + a2 y + a3 xy + a4 x^2 + a5 y^2 (per channel)
  const samples = [];
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) {
    const okTop = y < 235;
    const okLeft = x < 130 && y < 330;
    const okRight = x > 1150 && y < 350 && !(x > 1215 && y > 360);
    const okMidL = x > 600 && x < 700 && y < 275;
    if (okTop || okLeft || okRight || okMidL) samples.push([x / W, y / H, ...px(x, y)]);
  }
  const terms = (u, v) => [1, u, v, u * v, u * u, v * v];
  const N = 6;
  const coef = [0, 1, 2].map(ch => {
    const A = Array.from({ length: N }, () => new Float64Array(N));
    const b = new Float64Array(N);
    for (const s of samples) {
      const t = terms(s[0], s[1]);
      for (let i = 0; i < N; i++) { b[i] += t[i] * s[2 + ch]; for (let j = 0; j < N; j++) A[i][j] += t[i] * t[j]; }
    }
    // gaussian elimination
    for (let i = 0; i < N; i++) {
      let p = i; for (let r = i + 1; r < N; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
      for (let r = i + 1; r < N; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c < N; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; }
    }
    const x = new Float64Array(N);
    for (let i = N - 1; i >= 0; i--) { let s = b[i]; for (let c = i + 1; c < N; c++) s -= A[i][c] * x[c]; x[i] = s / A[i][i]; }
    return x;
  });
  const sky = (x, y) => { const t = terms(x / W, y / H); return coef.map(c => c.reduce((s, k, i) => s + k * t[i], 0)); };

  // ---- 2. per-pixel distance to modelled sky
  const dist = new Float32Array(W * H);
  const skyRGB = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = sky(x, y), p = px(x, y), k = y * W + x;
    skyRGB.set(s, k * 3);
    const dr = p[0] - s[0], dg = p[1] - s[1], db = p[2] - s[2];
    let d = Math.sqrt(dr * dr + dg * dg + db * db);
    // non blue-dominant pixels are never sky
    if (!(p[2] > p[0] + 25 && p[2] >= p[1])) d = Math.max(d, T_FULL);
    dist[k] = d;
  }

  // ---- 3. region-growing flood fill from the top edge (BFS). A pixel joins the sky when it is
  // close to the colour of the sky pixel it was reached from (follows the gradient) AND
  // loosely close to the global model AND blue-dominant.
  const isSky = new Uint8Array(W * H);
  const ref = new Float32Array(W * H * 3); // running sky colour carried along the fill
  const queue = new Int32Array(W * H); let qh = 0, qt = 0;
  for (let x = 0; x < W; x++) if (dist[x] < T_SKY) { isSky[x] = 1; queue[qt++] = x; ref.set(px(x, 0), x * 3); }
  const T_LOCAL = +process.env.T_LOCAL || 13, T_LOOSE = +process.env.T_LOOSE || 70;
  while (qh < qt) {
    const k = queue[qh++], x = k % W, y = (k / W) | 0;
    const nb = [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1];
    const rr = ref[k * 3], rg = ref[k * 3 + 1], rb = ref[k * 3 + 2];
    for (const n of nb) {
      if (n < 0 || isSky[n]) continue;
      const i = n * 3, p0 = data[i], p1 = data[i + 1], p2 = data[i + 2];
      if (!(p2 > p0 + 25 && p2 >= p1)) continue;
      const d = Math.hypot(p0 - rr, p1 - rg, p2 - rb);
      if (d < T_LOCAL && dist[n] < T_LOOSE) {
        isSky[n] = 1; queue[qt++] = n;
        // smoothed reference colour (EMA) so noise does not drift the fill
        ref[i] = rr * 0.8 + p0 * 0.2; ref[i + 1] = rg * 0.8 + p1 * 0.2; ref[i + 2] = rb * 0.8 + p2 * 0.2;
      }
    }
  }
  // local sky estimate per pixel = carried reference (used for decontamination)
  for (let k = 0; k < W * H; k++) if (isSky[k]) skyRGB.set([ref[k * 3], ref[k * 3 + 1], ref[k * 3 + 2]], k * 3);
  // propagate: for non-sky pixels use the nearest sky pixel above in the same column
  for (let x = 0; x < W; x++) { let last = null; for (let y = 0; y < H; y++) { const k = y * W + x;
    if (isSky[k]) last = [skyRGB[k * 3], skyRGB[k * 3 + 1], skyRGB[k * 3 + 2]]; else if (last) skyRGB.set(last, k * 3); } }
  // recompute distance against the local sky estimate (for the edge matte)
  for (let k = 0; k < W * H; k++) { const i = k * 3;
    dist[k] = Math.hypot(data[i] - skyRGB[i], data[i + 1] - skyRGB[i + 1], data[i + 2] - skyRGB[i + 2]); }
  // fill tiny holes in the mountain mask (isolated non-sky specks inside the sky)
  // and drop isolated sky pixels inside the mountain: majority filter, 2 passes
  for (let pass = 0; pass < 2; pass++) {
    const copy = isSky.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const k = y * W + x; let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += copy[k + dy * W + dx];
      if (s >= 7) isSky[k] = 1; else if (s <= 2) isSky[k] = 0;
    }
  }

  // ---- 4. soft matte along the boundary + colour decontamination
  const alpha = new Float32Array(W * H);
  for (let k = 0; k < W * H; k++) alpha[k] = isSky[k] ? 0 : 1;
  // pixels within 2 px of the sky get a fractional alpha from their colour distance
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x; if (isSky[k]) continue;
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && isSky[yy * W + xx]) { near = true; break; }
    }
    if (near) alpha[k] = Math.min(1, Math.max(0.15, (dist[k] - T_SKY * 0.6) / (T_FULL - T_SKY * 0.6)));
  }
  // feather: small gaussian-ish blur of the alpha (3x3, 1 pass ~ 1px)
  const a2 = alpha.slice();
  const kern = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    let s = 0, i = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += alpha[(y + dy) * W + x + dx] * kern[i++];
    a2[y * W + x] = s / 16;
  }

  const rgba = Buffer.alloc(W * H * 4);
  for (let k = 0; k < W * H; k++) {
    const a = a2[k];
    let r = data[k * 3], g = data[k * 3 + 1], b = data[k * 3 + 2];
    if (a > 0 && a < 0.999) {
      // remove the sky contribution from the blended edge pixel
      const am = Math.max(a, 0.35);
      const sr = skyRGB[k * 3], sg = skyRGB[k * 3 + 1], sb = skyRGB[k * 3 + 2];
      r = (r - (1 - am) * sr) / am; g = (g - (1 - am) * sg) / am; b = (b - (1 - am) * sb) / am;
    }
    rgba[k * 4] = Math.max(0, Math.min(255, r));
    rgba[k * 4 + 1] = Math.max(0, Math.min(255, g));
    rgba[k * 4 + 2] = Math.max(0, Math.min(255, b));
    rgba[k * 4 + 3] = Math.round(Math.max(0, Math.min(1, a)) * 255);
  }
  const fg = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
  await fg.clone().webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(path.join(OUT, 'ridge.webp'));
  await fg.clone().png().toFile(path.join(DBG, 'ridge-debug.png'));

  // ---- 5. clean sky plate: real sky where sky, modelled sky (+ blur) elsewhere
  const plate = Buffer.alloc(W * H * 3);
  // normalised-convolution inpainting: blur(img*mask)/blur(mask) at growing radii
  const mask = new Float32Array(W * H);
  for (let k = 0; k < W * H; k++) mask[k] = isSky[k] && a2[k] < 0.02 ? 1 : 0;
  // erode mask by 3px so edge-contaminated pixels do not leak into the fill
  const er = mask.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = y * W + x; if (!mask[k]) continue;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && !mask[yy * W + xx]) { er[k] = 0; dy = 9; break; } } }
  const boxBlur = (src, r) => { // 3x separable box ~ gaussian
    let a = src.slice(), t = new Float32Array(W * H);
    for (let it = 0; it < 3; it++) {
      for (let y = 0; y < H; y++) { let acc = 0; const row = y * W;
        for (let x = -r; x <= r; x++) acc += a[row + Math.min(W - 1, Math.max(0, x))];
        for (let x = 0; x < W; x++) { t[row + x] = acc / (2 * r + 1);
          acc += a[row + Math.min(W - 1, x + r + 1)] - a[row + Math.max(0, x - r)]; } }
      for (let x = 0; x < W; x++) { let acc = 0;
        for (let y = -r; y <= r; y++) acc += t[Math.min(H - 1, Math.max(0, y)) * W + x];
        for (let y = 0; y < H; y++) { a[y * W + x] = acc / (2 * r + 1);
          acc += t[Math.min(H - 1, y + r + 1) * W + x] - t[Math.max(0, y - r) * W + x]; } }
    }
    return a;
  };
  const chans = [0, 1, 2].map(c => { const f = new Float32Array(W * H); for (let k = 0; k < W * H; k++) f[k] = data[k * 3 + c] * er[k]; return f; });
  const levels = [12, 30, 70, 160].map(r => ({ w: boxBlur(er, r), c: chans.map(ch => boxBlur(ch, r)) }));
  for (let k = 0; k < W * H; k++) {
    if (mask[k]) { for (let c = 0; c < 3; c++) plate[k * 3 + c] = data[k * 3 + c]; continue; }
    // blend levels smoothly from coarse to fine according to local support
    const Lc = levels[levels.length - 1];
    let col = Lc.c.map(ch => ch[k] / Math.max(1e-4, Lc.w[k]));
    for (let li = levels.length - 2; li >= 0; li--) { const L = levels[li]; const w = L.w[k];
      if (w < 1e-4) continue; let t = Math.min(1, Math.max(0, (w - 0.01) / 0.35)); t = t * t * (3 - 2 * t);
      col = col.map((v, c) => v + (L.c[c][k] / w - v) * t); }
    for (let c = 0; c < 3; c++) plate[k * 3 + c] = Math.max(0, Math.min(255, col[c]));
  }
  await sharp(plate, { raw: { width: W, height: H, channels: 3 } })
    .blur(2.5).webp({ quality: 82 }).toFile(path.join(OUT, 'sky.webp'));

  // debug composites over magenta & over black at 2x around the ridge
  for (const [name, bg] of [['dbg-magenta.png', { r: 255, g: 0, b: 200 }], ['dbg-dark.png', { r: 8, g: 20, b: 40 }]]) {
    await sharp({ create: { width: W, height: H, channels: 3, background: bg } })
      .composite([{ input: path.join(DBG, 'ridge-debug.png') }])
      .png().toFile(path.join(DBG, name));
  }

  // ridgeline (top-most opaque pixel per 5px column), used for spindrift emitters
  const line = [];
  for (let x = 0; x < W; x += 5) { let y = 0; while (y < H && a2[y * W + x] < 0.5) y++; line.push(y); }
  fs.writeFileSync(path.join(OUT, 'ridge.js'), 'window.RIDGE=' + JSON.stringify({ w: W, h: H, step: 5, y: line }) + ';\n');
  const skyCount = isSky.reduce((s, v) => s + v, 0);
  console.log('done', W, H, 'sky px', skyCount, 'coef', coef.map(c => Array.from(c).map(v => v.toFixed(1))));
})();
