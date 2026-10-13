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

// Hammered / pebbled body finish, seamless.
function pebbleCanvas() {
  const S = 512;
  const [c, g] = makeCanvas(S, S);
  const r = rng(11);
  g.fillStyle = '#c9c9c6';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) {
    const x = r() * S, y = r() * S;
    const rad = 0.7 + r() * 2.8;
    const ry = rad * (0.55 + r() * 0.5);
    const rot = r() * Math.PI;
    const l = Math.round(150 + r() * 100);
    const a = 0.16 + r() * 0.26;
    g.fillStyle = `rgba(${l},${l},${l - 2},${a})`;
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) {
        g.beginPath();
        g.ellipse(x + dx, y + dy, rad, ry, rot, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  // fine scratches
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
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
  const S = 512;
  const [c, g] = makeCanvas(S, S);
  const r = rng(5);
  g.fillStyle = '#bdbdba';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const y = r() * S, x = r() * S, len = 40 + r() * 400;
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
  const S = 128, P = 16;
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
      const shade = 0.6 + (height(x - 1, y - 1) - height(x + 1, y + 1)) * 4.5;
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

function tex(canvas, srgb, rx = 1, ry = rx) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 8;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return t;
}

function build() {
  const pebble = pebbleCanvas();
  const brushed = brushedCanvas();
  const [knurl, knurlH] = knurlCanvases();

  const body = new THREE.MeshStandardMaterial({
    color: '#b4b4b0',
    metalness: 0.8,
    roughness: 0.56,
    map: tex(pebble, true, 0.34),
    bumpMap: tex(pebble, false, 0.34),
    bumpScale: 0.35,
  });
  const steel = new THREE.MeshStandardMaterial({ color: '#c0c0bc', metalness: 1, roughness: 0.28 });
  const bezel = new THREE.MeshStandardMaterial({ color: '#a4a4a0', metalness: 1, roughness: 0.34 });
  const lip = new THREE.MeshStandardMaterial({ color: '#8a8a87', metalness: 1, roughness: 0.42 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: '#7a7a77', metalness: 1, roughness: 0.32 });
  const plate = new THREE.MeshStandardMaterial({
    color: '#b9b9b5',
    metalness: 0.95,
    roughness: 0.34,
    map: tex(brushed, true, 0.6),
    roughnessMap: tex(brushed, false, 0.6),
  });
  const knurlMat = (rx, ry) =>
    new THREE.MeshStandardMaterial({
      color: '#b0b0ac',
      metalness: 1,
      roughness: 0.36,
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

  return { body, steel, bezel, lip, darkSteel, plate, knurlMat, dark, cavity, anodized, barrel, interior, interiorBack, hidden };
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
