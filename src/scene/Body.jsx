import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DEPTH, GATE_SCALE, TIMELINE } from '../layout.js';
import { anim, easeInOut, range } from '../state.js';
import { BORDER_ASPECT, getMaterials, roundedRect } from './materials.js';

// The camera back plate: a pebbled metal slab with the window cut out of it,
// a raised centre section and the stepped top edge the dials peek over.
export function Body({ L }) {
  const M = getMaterials();
  const geometry = useMemo(() => {
    const { W, H, u, yTop, win, radius } = L;
    const X = W / 2 + 3, Y = H / 2 + 3;
    const xr = 0.215 * W;
    const rr = 0.16 * u;
    const s = new THREE.Shape();
    s.moveTo(-X, -Y);
    s.lineTo(X, -Y);
    s.lineTo(X, yTop);
    s.lineTo(xr + rr, yTop);
    s.quadraticCurveTo(xr, yTop, xr, yTop + rr);
    s.lineTo(xr, Y);
    s.lineTo(-xr, Y);
    s.lineTo(-xr, yTop + rr);
    s.quadraticCurveTo(-xr, yTop, -xr - rr, yTop);
    s.lineTo(-X, yTop);
    s.closePath();
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

// Engraved guilloché band framing the window, mitred at the corners like a
// picture frame. Each side is a trapezoid whose u runs along the edge in
// tile lengths and whose v runs from the inner to the outer edge.
export function Border({ L }) {
  const M = getMaterials();
  const { geometry, material } = useMemo(() => {
    const { win, u } = L;
    const g0 = 0.075 * u, w = 0.17 * u;
    const g1 = g0 + w;
    const tile = w * BORDER_ASPECT;
    const pos = [], uv = [], idx = [];
    // inner corners [x, y] and the outward direction of each corner
    const inn = [[win.l - g0, win.t + g0], [win.r + g0, win.t + g0], [win.r + g0, win.b - g0], [win.l - g0, win.b - g0]];
    const out = [[win.l - g1, win.t + g1], [win.r + g1, win.t + g1], [win.r + g1, win.b - g1], [win.l - g1, win.b - g1]];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const len = Math.hypot(out[j][0] - out[i][0], out[j][1] - out[i][1]);
      // centre the pattern on each side; the mitre trims the ends
      const u0 = -len / 2 / tile, u1 = len / 2 / tile, d = w / tile;
      const n = pos.length / 3;
      pos.push(out[i][0], out[i][1], 0, out[j][0], out[j][1], 0, inn[j][0], inn[j][1], 0, inn[i][0], inn[i][1], 0);
      uv.push(u0, 1, u1, 1, u1 - d, 0, u0 + d, 0);
      idx.push(n, n + 2, n + 1, n, n + 3, n + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return { geometry: geo, material: M.borderMat(1) };
  }, [L, M]);
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);
  return <mesh geometry={geometry} material={material} position={[0, 0, 0.162]} />;
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

// Knurled shutter-speed and rewind dials peeking over the top edge.
export function Dials({ L }) {
  const M = getMaterials();
  const { W, u, yTop } = L;
  const rL = Math.min(0.07 * W, 1.3 * u);
  const rR = Math.min(0.12 * W, 2.1 * u);
  const h = 0.5 * u;
  const y = yTop + 0.03 + h / 2;
  const mats = useMemo(() => {
    const ring = (r) => M.knurlMat(Math.round((2 * Math.PI * r) / 0.09), 1.5);
    return { left: [ring(rL), M.steel, M.steel], right: [ring(rR), M.steel, M.steel] };
  }, [M, rL, rR]);
  return (
    <>
      <mesh position={[-W / 2 + 0.03 * W + rL, y, -rL * 0.55]} material={mats.left}>
        <cylinderGeometry args={[rL, rL, h, 96]} />
      </mesh>
      <mesh position={[W / 2 - 0.03 * W - rR, y, -rR * 0.55]} material={mats.right}>
        <cylinderGeometry args={[rR, rR, h, 128]} />
      </mesh>
      <mesh position={[W / 2 - 0.03 * W - rR, y + h / 2 + 0.08 * u, -rR * 0.55]} material={M.darkSteel}>
        <cylinderGeometry args={[rR * 0.86, rR * 0.9, 0.16 * u, 96]} />
      </mesh>
    </>
  );
}
