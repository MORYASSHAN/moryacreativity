import * as THREE from 'three';

// All metal surface detail is painted procedurally on canvases at startup.

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Pebbled leatherette body covering, seamless.
function pebbleCanvas() {
  const S = 1024;
  const [c, g] = makeCanvas(S, S);
  const r = rng(11);
  g.fillStyle = '#c9c9c6';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 16000; i++) {
    const x = r() * S, y = r() * S;
    const rad = 1.5 + r() * 5.5;
    const ry = rad * (0.55 + r() * 0.5);
    const rot = r() * Math.PI;
    const l = Math.round(150 + r() * 100);
    const a = 0.16 + r() * 0.26;
    g.fillStyle = `rgba(${l},${l},${l - 2},${a})`;
    for (const dx of [-S, 0, S]) {
      if (x + dx < -8 || x + dx > S + 8) continue;
      for (const dy of [-S, 0, S]) {
        if (y + dy < -8 || y + dy > S + 8) continue;
        g.beginPath();
        g.ellipse(x + dx, y + dy, rad, ry, rot, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  // fine scratches
  g.lineCap = 'round';
  for (let i = 0; i < 280; i++) {
    const x = r() * S, y = r() * S, len = 10 + r() * 60, ang = r() * Math.PI;
    g.strokeStyle = `rgba(${r() > 0.5 ? '255,255,255' : '70,70,70'},${0.08 + r() * 0.14})`;
    g.lineWidth = 0.5 + r() * 0.6;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + r() * 6, y + Math.sin(ang) * len * 0.5 + r() * 6, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.stroke();
  }
  return c;
}

// Linear brushed steel.
function brushedCanvas() {
  const S = 1024;
  const [c, g] = makeCanvas(S, S);
  const r = rng(5);
  g.fillStyle = '#bdbdba';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 10400; i++) {
    const y = r() * S, x = r() * S, len = 80 + r() * 800;
    const l = r() > 0.5 ? 235 : 120;
    g.strokeStyle = `rgba(${l},${l},${l},${0.04 + r() * 0.1})`;
    g.lineWidth = 0.6 + r() * 0.8;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + len, y + (r() - 0.5) * 0.8);
    g.stroke();
    if (x + len > S) {
      g.beginPath();
      g.moveTo(x - S, y);
      g.lineTo(x + len - S, y);
      g.stroke();
    }
  }
  return c;
}

// Diamond knurling: a grid of tiny pyramids, shaded from the top-left.
function knurlCanvases() {
  const S = 256, P = 32;
  const [c, g] = makeCanvas(S, S);
  const [hc, hg] = makeCanvas(S, S);
  const img = g.createImageData(S, S);
  const himg = hg.createImageData(S, S);
  const fr = (x) => x - Math.floor(x);
  const height = (x, y) => {
    const a = fr((x + y) / P), b = fr((x - y) / P);
    return Math.min(Math.min(a, 1 - a), Math.min(b, 1 - b)) * 2;
  };
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const h = height(x, y);
      const shade = 0.6 + (height(x - 1, y - 1) - height(x + 1, y + 1)) * 9;
      const v = Math.max(0, Math.min(255, shade * 200 + h * 30));
      const i = (y * S + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
      himg.data[i] = himg.data[i + 1] = himg.data[i + 2] = h * 255;
      himg.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  hg.putImageData(himg, 0, 0);
  return [c, hc];
}

// The frame: dark enamel inlaid with an engraved grey floral band — two
// ribbon vines crossing between petal-lace edges, layered rosettes in their
// loops, veined leaves, tendrils and berries, over a crosshatched ground, with
// a twelve-petal rosette block at each corner. Each canvas comes as
// [colour, mask] (mask: white where the raised grey inlay is). The side tile
// repeats seamlessly along its length; the vines cross on the centre line at
// the tile ends, so they run straight into the corner blocks.
export const FRAME_ASPECT = 2; // side tile length / band width
const FRAME_BG = '#0c0c0e';

function petal(g, x, y, ang, len, wid, vein = false) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const P = (a, b) => [x + a * c - b * s, y + a * s + b * c];
  g.beginPath();
  g.moveTo(...P(0, 0));
  g.bezierCurveTo(...P(len * 0.25, wid * 0.62), ...P(len * 0.72, wid * 0.55), ...P(len, 0));
  g.bezierCurveTo(...P(len * 0.72, -wid * 0.55), ...P(len * 0.25, -wid * 0.62), ...P(0, 0));
  g.fill();
  g.stroke();
  if (vein) {
    // engraved midrib
    g.beginPath();
    g.moveTo(...P(len * 0.14, 0));
    g.quadraticCurveTo(...P(len * 0.5, wid * 0.08), ...P(len * 0.84, 0));
    g.stroke();
  }
}

function dot(g, x, y, r) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

// paint(kind, x, y, r) returns the fill for a part: the mask pass gives the
// inlay white (and the hatched ground a faint grey), the colour pass shades
// each petal from a dark heart to a light grey tip

// a small flower / bud
function flower(g, paint, x, y, r, n, turn = 0) {
  g.strokeStyle = paint('bg');
  g.lineWidth = Math.max(1.5, r * 0.06);
  for (let k = 0; k < n; k++) {
    g.fillStyle = paint('petal', x, y, r);
    petal(g, x, y, turn + (k / n) * Math.PI * 2, r, r * 0.55);
  }
  g.fillStyle = paint('bg');
  dot(g, x, y, r * 0.26);
  g.fillStyle = paint('heart');
  dot(g, x, y, r * 0.18);
}

// a layered rosette: a halo of seed dots, veined outer petals, a second row
// between them, a light inner crown and a ringed heart
function rosette(g, paint, x, y, r, n, turn = 0) {
  g.fillStyle = paint('bead');
  for (let k = 0; k < n * 2; k++) {
    const a = turn + ((k + 0.5) / (n * 2)) * Math.PI * 2;
    dot(g, x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1, r * 0.045);
  }
  g.strokeStyle = paint('bg');
  g.lineWidth = Math.max(1.5, r * 0.035);
  for (let k = 0; k < n; k++) {
    g.fillStyle = paint('petal', x, y, r);
    petal(g, x, y, turn + (k / n) * Math.PI * 2, r, r * 0.4, true);
  }
  for (let k = 0; k < n; k++) {
    g.fillStyle = paint('petal', x, y, r * 0.72);
    petal(g, x, y, turn + ((k + 0.5) / n) * Math.PI * 2, r * 0.72, r * 0.36);
  }
  for (let k = 0; k < n; k++) {
    g.fillStyle = paint('inner', x, y, r * 0.46);
    petal(g, x, y, turn + (k / n) * Math.PI * 2, r * 0.46, r * 0.3);
  }
  g.fillStyle = paint('bg');
  dot(g, x, y, r * 0.22);
  g.fillStyle = paint('heart');
  dot(g, x, y, r * 0.17);
  g.fillStyle = paint('bg');
  dot(g, x, y, r * 0.07);
}

// an engraved crosshatch over the whole ground (spacing divides every tile size)
function hatch(g, paint, w, h) {
  g.strokeStyle = paint('hatch');
  g.lineWidth = 1;
  g.beginPath();
  for (let x = -h; x <= w + h; x += 8) {
    g.moveTo(x, 0);
    g.lineTo(x + h, h);
    g.moveTo(x, h);
    g.lineTo(x + h, 0);
  }
  g.stroke();
}

// petal lace along an edge: a hairline, then a row of open arches each
// holding a seed, with a pearl where neighbours meet. Drawn along the top
// edge of a `len`-long strip; laceEdges rotates it onto the other edges.
function lace(g, paint, len, h, skipEnds) {
  const step = h / 7, R = step * 0.42, base = h * 0.05;
  const n = Math.round(len / step), st = len / n;
  g.fillStyle = paint('rule');
  g.fillRect(skipEnds ? base : 0, h * 0.022, skipEnds ? len - 2 * base : len, Math.max(2, h * 0.007));
  for (let i = skipEnds ? 1 : 0; i < (skipEnds ? n - 1 : n); i++) {
    const cx = (i + 0.5) * st;
    g.fillStyle = paint('bead');
    g.beginPath();
    g.arc(cx, base, R, 0, Math.PI);
    g.fill();
    g.fillStyle = paint('bg');
    g.beginPath();
    g.arc(cx, base, R * 0.64, 0, Math.PI);
    g.fill();
    g.fillStyle = paint('heart');
    dot(g, cx, base + R * 0.28, R * 0.2);
    g.fillStyle = paint('bead');
    if (!skipEnds || i > 1) dot(g, i * st, base + R * 0.2, R * 0.17);
  }
}

function laceEdges(g, paint, w, h, square) {
  lace(g, paint, w, h, square);
  const turn = (tx, ty, a, len) => {
    g.save();
    g.translate(tx, ty);
    g.rotate(a);
    lace(g, paint, len, h, square);
    g.restore();
  };
  turn(w, h, Math.PI, w);
  if (square) {
    turn(0, h, -Math.PI / 2, h);
    turn(w, 0, Math.PI / 2, h);
  }
}

// a tendril: a tightening spiral from (x, y), heading `ang`, turning `dir`
function tendril(g, paint, x, y, ang, len, dir) {
  g.strokeStyle = paint('vine');
  g.lineWidth = len * 0.07;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x, y);
  let a = ang, step = len / 18;
  for (let i = 0; i < 30; i++) {
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    a += dir * (0.12 + i * 0.022);
    step *= 0.95;
    g.lineTo(x, y);
  }
  g.stroke();
}

function berries(g, paint, x, y, r) {
  g.fillStyle = paint('heart');
  for (const [dx, dy] of [[0, 0], [1.9, 0.6], [0.7, 1.9]]) dot(g, x + dx * r, y + dy * r, r);
}

function frameSide(g, paint, TW, TH) {
  g.fillStyle = paint('bg');
  g.fillRect(0, 0, TW, TH);
  hatch(g, paint, TW, TH);
  laceEdges(g, paint, TW, TH, false);
  const mid = TH / 2, A = TH * 0.22;
  // two vines in opposite phase, crossing at the tile ends and in the middle;
  // each is a ribbon with an engraved groove down its centre
  const vy = (x, k) => mid + k * A * Math.sin((x / TW) * Math.PI * 2);
  const slope = (x, k) => Math.atan2(vy(x + 1, k) - vy(x - 1, k), 2);
  g.lineCap = 'round';
  for (const [kind, wd] of [['vine', 0.03], ['bg', 0.009]]) {
    g.strokeStyle = paint(kind);
    g.lineWidth = TH * wd;
    for (const k of [1, -1]) {
      g.beginPath();
      g.moveTo(-4, vy(-4, k));
      for (let x = -2; x <= TW + 4; x += 2) g.lineTo(x, vy(x, k));
      g.stroke();
    }
  }
  // outside each loop: a veined leaf spray, a curling tendril and berries
  for (const xc of [TW / 4, (3 * TW) / 4]) {
    for (const k of [1, -1]) {
      const y = vy(xc, k), outward = Math.sign(y - mid);
      g.strokeStyle = paint('bg');
      g.lineWidth = 2;
      for (const [dx, tilt] of [[-0.085, -0.55], [0.085, 0.55]]) {
        const x = xc + dx * TW, yy = vy(x, k);
        g.fillStyle = paint('leaf', x, yy, TH * 0.15);
        petal(g, x, yy, (outward * Math.PI) / 2 + tilt * (k * outward), TH * 0.15, TH * 0.075, true);
      }
      tendril(g, paint, xc, y, (outward * Math.PI) / 2, TH * 0.11, outward);
      berries(g, paint, xc + TW * 0.035, y + outward * TH * 0.05, TH * 0.013);
      berries(g, paint, xc - TW * 0.05, y + outward * TH * 0.035, TH * 0.011);
    }
  }
  // veined leaves either side of each crossing, along the vines
  g.strokeStyle = paint('bg');
  g.lineWidth = 1.6;
  for (const x of [TW * 0.08, TW * 0.42, TW * 0.58, TW * 0.92]) {
    for (const k of [1, -1]) {
      const yy = vy(x, k), a = slope(x, k) + (x % (TW / 2) < TW / 4 ? 0 : Math.PI);
      g.fillStyle = paint('leaf', x, yy, TH * 0.11);
      petal(g, x, yy, a + k * 0.9, TH * 0.11, TH * 0.05, true);
    }
  }
  // a rosette inside each loop, a bud ringed with seeds on every crossing (the end ones wrap)
  rosette(g, paint, TW / 4, mid, TH * 0.17, 8, 0);
  rosette(g, paint, (3 * TW) / 4, mid, TH * 0.17, 8, Math.PI / 8);
  for (const x of [0, TW / 2, TW]) {
    g.fillStyle = paint('bead');
    for (let k = 0; k < 4; k++) dot(g, x + Math.cos((k * Math.PI) / 2) * TH * 0.1, mid + Math.sin((k * Math.PI) / 2) * TH * 0.1, TH * 0.012);
    flower(g, paint, x, mid, TH * 0.075, 4, Math.PI / 4);
  }
}

function frameCorner(g, paint, S) {
  g.fillStyle = paint('bg');
  g.fillRect(0, 0, S, S);
  hatch(g, paint, S, S);
  laceEdges(g, paint, S, S, true);
  const c = S / 2;
  // diagonal leaf pairs with tendrils, buds between them, then a twelve-petal rosette
  g.strokeStyle = paint('bg');
  g.lineWidth = 2;
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    g.fillStyle = paint('leaf', c, c, S * 0.38);
    petal(g, c, c, a - 0.24, S * 0.38, S * 0.1, true);
    petal(g, c, c, a + 0.24, S * 0.38, S * 0.1, true);
    tendril(g, paint, c + Math.cos(a) * S * 0.22, c + Math.sin(a) * S * 0.22, a + Math.PI / 2, S * 0.09, 1);
    const b = a + Math.PI / 4;
    g.strokeStyle = paint('bg');
    g.lineWidth = 2;
    flower(g, paint, c + Math.cos(b) * S * 0.33, c + Math.sin(b) * S * 0.33, S * 0.045, 4, b);
  }
  rosette(g, paint, c, c, S * 0.26, 12, 0);
}

function frameCanvases() {
  const TH = 384, TW = TH * FRAME_ASPECT;
  const out = {};
  for (const [key, w, h, draw] of [
    ['side', TW, TH, (g, paint) => frameSide(g, paint, TW, TH)],
    ['corner', TH, TH, (g, paint) => frameCorner(g, paint, TH)],
  ]) {
    const [mc, mg] = makeCanvas(w, h);
    draw(mg, (kind) => (kind === 'bg' ? '#000' : kind === 'hatch' ? '#262626' : '#fff'));
    const [cc, cg] = makeCanvas(w, h);
    const colour = (kind, x, y, r) => {
      if (kind === 'bg') return FRAME_BG;
      if (kind === 'hatch') return '#18181b';
      if (kind === 'rule') return '#4a4a50';
      if (kind === 'bead') return '#7a7a80';
      if (kind === 'vine') return '#707076';
      if (kind === 'heart') return '#b8b8be';
      // petals and leaves: dark at the heart, light grey towards the tip
      const gr = cg.createRadialGradient(x, y, r * 0.1, x, y, r);
      gr.addColorStop(0, kind === 'leaf' ? '#3a3a3f' : '#46464c');
      gr.addColorStop(1, kind === 'inner' ? '#c4c4ca' : kind === 'leaf' ? '#8e8e94' : '#a8a8ae');
      return gr;
    };
    draw(cg, colour);
    out[key] = [cc, mc];
  }
  return out;
}

function tex(canvas, srgb, rx = 1, ry = rx) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 16;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return t;
}

function build() {
  const pebble = pebbleCanvas();
  const brushed = brushedCanvas();
  const [knurl, knurlH] = knurlCanvases();

  // black leatherette body, black enamel trim, polished chrome details
  const body = new THREE.MeshPhysicalMaterial({
    color: '#151516',
    metalness: 0,
    roughness: 0.7,
    specularIntensity: 0.28, // leather barely shines: keep it black under the key light
    envMapIntensity: 0.5,
    map: tex(pebble, true, 0.2),
    bumpMap: tex(pebble, false, 0.2),
    bumpScale: 0.6,
  });
  const steel = new THREE.MeshStandardMaterial({ color: '#e2e2de', metalness: 1, roughness: 0.16 });
  const bezel = new THREE.MeshStandardMaterial({ color: '#0c0c0d', metalness: 0.5, roughness: 0.2 });
  const lip = new THREE.MeshStandardMaterial({ color: '#a9a9a6', metalness: 1, roughness: 0.3 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: '#1a1a1c', metalness: 0.8, roughness: 0.28 });
  const plate = new THREE.MeshStandardMaterial({
    color: '#3c3c3e',
    metalness: 0.9,
    roughness: 0.3,
    map: tex(brushed, true, 0.6),
    roughnessMap: tex(brushed, false, 0.6),
  });
  const knurlMat = (rx, ry) =>
    new THREE.MeshStandardMaterial({
      color: '#9a9a98',
      metalness: 1,
      roughness: 0.26,
      map: tex(knurl, true, rx, ry),
      bumpMap: tex(knurlH, false, rx, ry),
      bumpScale: 1.2,
    });
  const dark = new THREE.MeshStandardMaterial({ color: '#070707', metalness: 0.3, roughness: 0.8 });
  const cavity = new THREE.MeshStandardMaterial({ color: '#0b0b0c', metalness: 0.2, roughness: 0.9, side: THREE.BackSide });
  const anodized = new THREE.MeshStandardMaterial({ color: '#141416', metalness: 0.75, roughness: 0.28 });
  const barrel = new THREE.MeshStandardMaterial({ color: '#101012', metalness: 0.6, roughness: 0.4, side: THREE.BackSide });
  const interior = new THREE.MeshStandardMaterial({
    color: '#262628',
    metalness: 0.7,
    roughness: 0.55,
    map: tex(brushed, true, 0.5),
    side: THREE.BackSide,
  });
  const interiorBack = new THREE.MeshStandardMaterial({ color: '#1f1f21', metalness: 0.75, roughness: 0.5, map: tex(brushed, true, 0.5) });
  const hidden = new THREE.MeshBasicMaterial({ visible: false });

  // the frame: grey floral inlay that glows a deep violet where the cursor rests
  // (uniforms live in `frameGlow`; FrameBorder moves the hotspot)
  const frame = frameCanvases();
  const frameGlow = {
    uPointer: { value: new THREE.Vector2(0, 0) },
    uGlow: { value: 0 },
    uRad: { value: 1 },
    uGlowColor: { value: new THREE.Color('#7a2fd0') },
  };
  const frameMat = ([colour, mask], rx) => {
    const maskTex = tex(mask, false, rx, 1);
    const m = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      metalness: 0.85,
      roughness: 0.34,
      map: tex(colour, true, rx, 1),
      metalnessMap: maskTex, // enamel ~0, inlay metal
      bumpMap: maskTex,
      bumpScale: 1.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, frameGlow, { uMask: { value: maskTex } });
      shader.vertexShader = shader.vertexShader
        .replace('void main() {', 'varying vec2 vFramePos;\nvoid main() {')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFramePos = position.xy;');
      shader.fragmentShader = shader.fragmentShader
        .replace(
          'void main() {',
          'uniform vec2 uPointer;\nuniform float uGlow, uRad;\nuniform vec3 uGlowColor;\nuniform sampler2D uMask;\nvarying vec2 vFramePos;\nvoid main() {',
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          float fd = distance( vFramePos, uPointer ) / uRad;
          float fg = uGlow * exp( -fd * fd * 2.2 );
          float inlay = texture2D( uMask, vMapUv ).r;
          totalEmissiveRadiance += uGlowColor * fg * ( 0.18 + 1.6 * inlay );`,
        );
    };
    return m;
  };
  const frameMats = () => [frameMat(frame.side, 1), frameMat(frame.corner, 1)];

  return { frameMats, frameGlow, body, steel, bezel, lip, darkSteel, plate, knurlMat, dark, cavity, anodized, barrel, interior, interiorBack, hidden };
}

let cache = null;
export const getMaterials = () => (cache ??= build());

// Rounded rectangle path centred on (cx, cy).
export function roundedRect(path, cx, cy, w, h, r) {
  const x = cx - w / 2, y = cy - h / 2;
  r = Math.min(r, w / 2, h / 2);
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

// A bevelled rectangular ring (frame), front face at z = depth + bevel.
export function ringGeometry(ow, oh, or, iw, ih, ir, depth, bevel) {
  const shape = roundedRect(new THREE.Shape(), 0, 0, ow, oh, or);
  shape.holes.push(roundedRect(new THREE.Path(), 0, 0, iw, ih, ir));
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 12,
  });
}
