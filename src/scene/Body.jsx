import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DEPTH, GATE_SCALE, TIMELINE } from '../layout.js';
import { anim, easeInOut, range } from '../state.js';
import { FRAME_ASPECT, getMaterials, roundedRect } from './materials.js';

// The camera back plate: a pebbled metal slab with the window cut out of it.
export function Body({ L }) {
  const M = getMaterials();
  const geometry = useMemo(() => {
    const { W, H, win, radius } = L;
    const s = roundedRect(new THREE.Shape(), 0, 0, W + 6, H + 6, 0);
    const e = 0.02;
    s.holes.push(roundedRect(new THREE.Path(), (win.l + win.r) / 2, (win.b + win.t) / 2, L.winW + 2 * e, L.winH + 2 * e, radius));
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.07,
      bevelSegments: 5,
      curveSegments: 20,
    });
  }, [L]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // front face ends up at z ≈ 0.16, just proud of the photo panels' outer edge
  return <mesh geometry={geometry} material={M.body} position={[0, 0, -0.2]} />;
}

// The floral frame band around the window: four sides, each a whole number of
// pattern tiles long, and a square rosette block at each corner, so the band
// is identical on every edge. The inlay glows violet around the cursor.
const pointer = { x: 0, y: 0, seen: false };
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / innerHeight) * 2 + 1;
    pointer.seen = e.pointerType === 'mouse';
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.seen = false; });
}
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

export function FrameBorder({ L }) {
  const M = getMaterials();
  const mesh = useRef();
  const { geometry, materials } = useMemo(() => {
    const { win, u } = L;
    const g0 = 0.05 * u, w = 0.44 * u; // fills the margin, so no bare strip shows outside it
    const g1 = g0 + w;
    const tile = w * FRAME_ASPECT;
    const pos = [], uv = [], idx = [];
    // a quad from [x, y, u, v] corners, wound to face the camera
    const quad = (pts) => {
      const n = pos.length / 3;
      for (const [x, y, s, t] of pts) {
        pos.push(x, y, 0);
        uv.push(s, t);
      }
      const [a, b, c] = pts;
      const ccw = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0;
      idx.push(...(ccw ? [n, n + 1, n + 2, n, n + 2, n + 3] : [n, n + 2, n + 1, n, n + 3, n + 2]));
    };
    const il = win.l - g0, ir = win.r + g0, ib = win.b - g0, it = win.t + g0;
    const ol = win.l - g1, or = win.r + g1, ob = win.b - g1, ot = win.t + g1;
    const reps = (len) => Math.max(1, Math.round(len / tile));
    const nx = reps(ir - il), ny = reps(it - ib);
    // sides: u along the edge in tiles, v from the inner (0) to the outer (1) edge
    quad([[il, it, 0, 0], [ir, it, nx, 0], [ir, ot, nx, 1], [il, ot, 0, 1]]); // top
    quad([[il, ib, 0, 0], [ir, ib, nx, 0], [ir, ob, nx, 1], [il, ob, 0, 1]]); // bottom
    quad([[il, ib, 0, 0], [il, it, ny, 0], [ol, it, ny, 1], [ol, ib, 0, 1]]); // left
    quad([[ir, ib, 0, 0], [ir, it, ny, 0], [or, it, ny, 1], [or, ib, 0, 1]]); // right
    const sideCount = idx.length;
    // corner blocks
    for (const [x0, x1, y0, y1] of [[ol, il, it, ot], [ir, or, it, ot], [ir, or, ob, ib], [ol, il, ob, ib]]) {
      quad([[x0, y0, 0, 0], [x1, y0, 1, 0], [x1, y1, 1, 1], [x0, y1, 0, 1]]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.addGroup(0, sideCount, 0);
    geo.addGroup(sideCount, idx.length - sideCount, 1);
    geo.computeVertexNormals();
    M.frameGlow.uRad.value = 1.6 * w;
    return { geometry: geo, materials: M.frameMats() };
  }, [L, M]);
  useEffect(() => () => {
    geometry.dispose();
    materials.forEach((m) => m.dispose());
  }, [geometry, materials]);

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.1);
    const glow = M.frameGlow;
    let target = 0;
    // only while the frame is in view (before the dive carries the camera past it)
    if (pointer.seen && mesh.current && anim.p < TIMELINE.fly[1]) {
      ndc.set(pointer.x, pointer.y);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(mesh.current, false)[0];
      if (hit) {
        target = 1;
        const p = mesh.current.worldToLocal(hit.point);
        // the hotspot follows the cursor with a little lag, so the light trails along the vine
        if (glow.uGlow.value < 0.02) glow.uPointer.value.set(p.x, p.y);
        else glow.uPointer.value.lerp(p, 1 - Math.exp(-14 * dt));
      }
    }
    glow.uGlow.value = THREE.MathUtils.damp(glow.uGlow.value, target, target ? 9 : 4, dt);
  });

  return <mesh ref={mesh} geometry={geometry} material={materials} position={[0, 0, 0.162]} />;
}

// The dark chamber behind the photos, revealed once they fly away.
export function Interior({ L }) {
  const M = getMaterials();
  const back = useMemo(() => {
    const k = GATE_SCALE;
    const s = new THREE.Shape();
    s.moveTo(L.win.l - 1, L.win.b - 1);
    s.lineTo(L.win.r + 1, L.win.b - 1);
    s.lineTo(L.win.r + 1, L.win.t + 1);
    s.lineTo(L.win.l - 1, L.win.t + 1);
    s.closePath();
    s.holes.push(roundedRect(new THREE.Path(), L.cx * k, L.cy * k, L.gw * k, L.gh * k, 0.01));
    return new THREE.ShapeGeometry(s);
  }, [L]);
  useEffect(() => () => back.dispose(), [back]);
  // side walls only (front and back faces of the box are hidden)
  const walls = [M.interior, M.interior, M.interior, M.interior, M.hidden, M.hidden];
  return (
    <>
      <mesh position={[L.cx, L.cy, -DEPTH / 2]} material={walls}>
        <boxGeometry args={[L.winW, L.winH, DEPTH]} />
      </mesh>
      <mesh geometry={back} position={[0, 0, -DEPTH - 0.01]} material={M.interiorBack} />
    </>
  );
}

// Polished strips along the four diagonals where the photo panels meet.
// When the panels leave, each strip shoots out towards its own corner.
export function Seams({ L }) {
  const M = getMaterials();
  const refs = useRef([]);
  const Lref = useRef(L);
  Lref.current = L;
  const items = useMemo(() => {
    const { win, gate } = L;
    const k = GATE_SCALE;
    const pairs = [
      [[win.l, win.t], [gate.l, gate.t]],
      [[win.r, win.t], [gate.r, gate.t]],
      [[win.r, win.b], [gate.r, gate.b]],
      [[win.l, win.b], [gate.l, gate.b]],
    ];
    const up = new THREE.Vector3(0, 1, 0);
    return pairs.map(([o, i]) => {
      const a = new THREE.Vector3(o[0], o[1], 0.02);
      const b = new THREE.Vector3(i[0] * k, i[1] * k, -DEPTH + 0.02);
      const dir = b.clone().sub(a);
      const len = dir.length();
      return {
        len,
        mid: a.clone().add(b).multiplyScalar(0.5),
        q: new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()),
        out: new THREE.Vector2(Math.sign(o[0]), Math.sign(o[1])).normalize(),
      };
    });
  }, [L]);

  useFrame(() => {
    const Lc = Lref.current;
    const [a, b] = TIMELINE.fly;
    const q = easeInOut(range(anim.p, a, b));
    const travel = Math.hypot(Lc.W, Lc.H) * 0.36 * q;
    items.forEach((it, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.set(it.mid.x + it.out.x * travel, it.mid.y + it.out.y * travel, it.mid.z + q * 1.6);
    });
  });

  return items.map((it, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)} position={it.mid} quaternion={it.q}>
      <mesh material={M.dark} position={[0, 0, -0.025]}>
        <cylinderGeometry args={[0.075, 0.075, it.len, 12, 1, true]} />
      </mesh>
      <mesh material={M.steel}>
        <cylinderGeometry args={[0.048, 0.048, it.len, 16, 1]} />
      </mesh>
    </group>
  ));
}
