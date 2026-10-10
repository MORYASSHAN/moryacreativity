// Builds the web textures in public/photos from the images in source/.
//
// The top + bottom panels are cut straight out of the reference collage
// (their scenes were already extended to a wide panorama there). Everything
// outside the clean trapezoid (metal frame, seams, neighbouring panels) is
// replaced by mirroring the valid pixels of the same row, so texture filtering
// at the edges never pulls metal into the photo. The clean trapezoid of each
// panel is written to src/panels.json so the shader samples exactly that region.
//
//   node scripts/prepare-photos.mjs
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SRC = new URL('../source/', import.meta.url);
const OUT = new URL('../public/photos/', import.meta.url);
const file = (base, name) => fileURLToPath(new URL(name, base));
await mkdir(OUT, { recursive: true });

// Collage geometry (px), measured from source/collage.png (1261x1247).
const WIN = { l: 25, r: 1205, t: 65, b: 1163 }; // window opening in the body
const GATE = { t: 365, b: 842 }; // film gate opening (rows)
const SEAM = 20; // horizontal clearance from a seam's centre line (seam is ~15px wide)
const EDGE = 5; // clearance from the outer rim / gate rows

// Seam centre lines as [x at the gate row, x at the window row].
const SEAMS = {
  top: { left: [355, 45], right: [867, 1180] },
  bottom: { left: [355, 32], right: [870, 1192] },
};

const mirror = (i, lo, hi) => {
  const len = hi - lo;
  if (len <= 0) return lo;
  let t = (i - lo) % (2 * len);
  if (t < 0) t += 2 * len;
  return lo + (t < len ? t : 2 * len - 1 - t);
};

const collage = await sharp(file(SRC, 'collage.png')).removeAlpha().raw().toBuffer({ resolveWithObject: true });

async function panel(name, { rows: [y0, y1], gateRow, winRow, seams }) {
  const { data, info } = collage;
  const W = info.width;
  const ch = info.channels;
  const x0 = WIN.l, x1 = WIN.r;
  const w = x1 - x0, h = y1 - y0;
  const out = Buffer.alloc(w * h * 3);

  const at = ([xg, xw], y) => xg + ((y - gateRow) / (winRow - gateRow)) * (xw - xg);
  const span = (y) => [at(seams.left, y) + SEAM, at(seams.right, y) - SEAM];

  for (let j = 0; j < h; j++) {
    const sy = y0 + j;
    const [a, b] = span(sy);
    for (let i = 0; i < w; i++) {
      const sx = mirror(x0 + i, Math.ceil(a), Math.floor(b));
      const si = (sy * W + sx) * ch;
      const di = (j * w + i) * 3;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
    }
  }

  await sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .resize(w * 2, h * 2, { kernel: 'lanczos3' })
    .sharpen({ sigma: 0.8 })
    .webp({ quality: 90 })
    .toFile(file(OUT, `${name}.webp`));

  // Clean quad in normalised image coords (origin top-left, y down).
  const u = (x) => +((x - x0) / w).toFixed(4);
  const v = (y) => +((y - y0) / (h - 1)).toFixed(4);
  const [gl, gr] = span(gateRow), [wl, wr] = span(winRow);
  console.log(`${name}.webp  ${w * 2}x${h * 2}`);
  return {
    // outer = edge along the window rim, inner = edge along the film gate
    outer: { v: v(winRow), l: u(wl), r: u(wr) },
    inner: { v: v(gateRow), l: u(gl), r: u(gr) },
  };
}

const manifest = {};
manifest.mountain = await panel('mountain-panel', {
  rows: [WIN.t + EDGE, GATE.t - 1],
  winRow: WIN.t + EDGE,
  gateRow: GATE.t - 2,
  seams: SEAMS.top,
});
manifest.heart = await panel('heart-panel', {
  rows: [GATE.b + 2, WIN.b - EDGE],
  gateRow: GATE.b + 2,
  winRow: WIN.b - EDGE - 1,
  seams: SEAMS.bottom,
});
await writeFile(fileURLToPath(new URL('../src/panels.json', import.meta.url)), JSON.stringify(manifest, null, 2));

// Side panels + lightbox prints come from the original photos, upscaled once
// offline with lanczos so the GPU never has to magnify them as much.
const prints = { mountain: 1300, city: 1600, runner: 1600, heart: 1500 };
for (const [name, height] of Object.entries(prints)) {
  await sharp(file(SRC, `${name}.png`))
    .removeAlpha()
    .resize({ height, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.9 })
    .webp({ quality: 90 })
    .toFile(file(OUT, `${name}.webp`));
  console.log(`${name}.webp`);
}
