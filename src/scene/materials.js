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

// Engraved guilloché border band: chrome rules and an interlaced rope of
// sine waves, inlaid in black enamel. Tiles seamlessly along its length.
// Returns [colour, mask] canvases (mask: white where the chrome is).
export const BORDER_ASPECT = 8; // tile length / band width
function borderCanvases() {
  const TH = 192, TW = TH * BORDER_ASPECT;
  const [mc, g] = makeCanvas(TW, TH);
  g.fillStyle = '#000';
  g.fillRect(0, 0, TW, TH);
  g.strokeStyle = g.fillStyle = '#fff';
  g.lineCap = 'round';
  // double rules along both edges
  for (const [y, w] of [[8, 7], [22, 3], [TH - 22, 3], [TH - 8, 7]]) {
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(TW, y);
    g.stroke();
  }
  // the rope: phase-shifted sine waves, one period per band width
  const top = 38, bot = TH - 38, mid = (top + bot) / 2, amp = (bot - top) / 2 - 3;
  const period = TH * 2; // TW is a whole number of periods, so it tiles
  g.lineWidth = 4.5;
  for (let k = 0; k < 4; k++) {
    const ph = (k / 4) * Math.PI;
    g.beginPath();
    for (let x = -2; x <= TW + 2; x += 2) {
      const t = (x / period) * Math.PI * 2;
      const y = mid + amp * Math.sin(t + ph) * (0.55 + 0.45 * Math.cos(2 * t));
      if (x === -2) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  // studs between the rope's crossings
  for (let i = 0; i < TW / period; i++) {
    for (const x of [(i + 0.25) * period, (i + 0.75) * period]) {
      g.beginPath();
      g.arc(x, mid, 10, 0, Math.PI * 2);
      g.fill();
    }
  }
  // colour: chrome on black enamel
  const [cc, cg] = makeCanvas(TW, TH);
  cg.fillStyle = '#0d0d0e';
  cg.fillRect(0, 0, TW, TH);
  cg.globalCompositeOperation = 'lighter';
  cg.filter = 'brightness(0.86)';
  cg.drawImage(mc, 0, 0);
  return [cc, mc];
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

  const [borderC, borderM] = borderCanvases();
  const borderMat = (rx) =>
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      metalness: 1,
      roughness: 0.3,
      map: tex(borderC, true, rx, 1),
      metalnessMap: tex(borderM, false, rx, 1), // enamel ~0, chrome 1
      bumpMap: tex(borderM, false, rx, 1),
      bumpScale: 1.4,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });

  return { borderMat, body, steel, bezel, lip, darkSteel, plate, knurlMat, dark, cavity, anodized, barrel, interior, interiorBack, hidden };
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
