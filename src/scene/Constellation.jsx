import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TIMELINE } from '../layout.js';
import { anim, clamp01, easeOut, range, setState } from '../state.js';
import { DEG, G, ITEMS, SPAN, TOP, buildCards, direction, ndc, raycaster } from '../galaxy.js';

const geometry = new THREE.PlaneGeometry(1, 1);
const damp = THREE.MathUtils.damp;
const REST_LIGHT = [0.92, 0.7, 0.48]; // by size tier, near to far
const REST_BLUR = [0, 1.1, 2.3]; // texture LOD bias, near to far

// Steers the view: velocity grows as the cursor nears an edge (dead zone in the middle),
// holds while a card is hovered, and is clamped so the outermost cards stay reachable.
function steer(dt, camera, size) {
  const vfov = camera.fov;
  const hfov = (2 * Math.atan(Math.tan((vfov / 2) * DEG) * (size.width / size.height))) / DEG;
  G.maxYaw = Math.max(SPAN - hfov / 2 + 3, 0);
  G.maxPitch = Math.max(TOP - vfov / 2 + 3, 0);

  const p = G.pointer;
  let tYaw = 0;
  let tPitch = 0;
  if (anim.reduced) {
    // no motion-driven turning: map the cursor straight onto the view
    if (p.inside) {
      G.yaw = damp(G.yaw, p.x * G.maxYaw, 4, dt);
      G.pitch = damp(G.pitch, -p.y * G.maxPitch, 4, dt);
    }
    return;
  }
  if (p.mouse && p.inside) {
    const edge = (v) => {
      const a = Math.abs(v);
      return a < 0.2 ? 0 : Math.sign(v) * ((a - 0.2) / 0.8) ** 2;
    };
    // a hovered card holds still, unless the cursor is pushing at the very edge
    const hold = G.hotCard < 0 ? 1 : Math.max(Math.abs(p.x), Math.abs(p.y)) > 0.8 ? 0.35 : 0;
    tYaw = edge(p.x) * 48 * hold;
    tPitch = -edge(p.y) * 30 * hold;
  } else if (!p.mouse && !p.dragging && performance.now() - G.touchedAt > 2500) {
    // phones: a slow idle drift between the ends
    if (G.yaw > G.maxYaw - 1) G.drift = -1;
    if (G.yaw < -G.maxYaw + 1) G.drift = 1;
    tYaw = G.drift * 5;
  }
  if (!p.dragging) {
    G.vYaw = damp(G.vYaw, tYaw, p.mouse ? 3 : 1.6, dt);
    G.vPitch = damp(G.vPitch, tPitch, 3, dt);
  }
  G.yaw += G.vYaw * dt;
  G.pitch += G.vPitch * dt;
  if (Math.abs(G.yaw) > G.maxYaw) { G.yaw = Math.sign(G.yaw) * G.maxYaw; G.vYaw = 0; }
  if (Math.abs(G.pitch) > G.maxPitch) { G.pitch = Math.sign(G.pitch) * G.maxPitch; G.vPitch = 0; }
}

export default function Constellation({ end }) {
  const size = useThree((s) => s.size);
  const group = useRef();
  const cards = useMemo(() => buildCards(), []);

  // load lazily so the first paint of the camera isn't held up by the gallery
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader(new THREE.LoadingManager());
    return ITEMS.map((it) => {
      const t = loader.load(it.texture);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    });
  }, []);

  const meshes = useMemo(
    () =>
      cards.map((c) => {
        const map = textures[c.item].clone();
        map.repeat.set(c.rep[0], c.rep[1]);
        map.offset.set(c.off[0], 1 - c.rep[1] - c.off[1]);
        const material = new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
        // depth of field: far cards sample a blurrier mip level of their texture
        const bias = { value: 0 };
        material.onBeforeCompile = (shader) => {
          shader.uniforms.uBias = bias;
          shader.fragmentShader = shader.fragmentShader
            .replace('void main() {', 'uniform float uBias;\nvoid main() {')
            .replace('texture2D( map, vMapUv )', 'texture2D( map, vMapUv, uBias )');
        };
        const m = new THREE.Mesh(geometry, material);
        m.renderOrder = 2;
        m.userData = { card: c, light: 0, lift: 1, op: 0, bias };
        return m;
      }),
    [cards, textures],
  );

  useEffect(() => {
    G.meshes = meshes;
    G.cards = cards;
    return () => {
      meshes.forEach((m) => { m.material.map.dispose(); m.material.dispose(); });
      textures.forEach((t) => t.dispose());
    };
  }, [meshes, cards, textures]);

  const dir = useMemo(() => new THREE.Vector3(), []);
  const lastItem = useRef(-1);
  const wasIn = useRef(false);

  useFrame(({ camera, clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const [s0, s1] = TIMELINE.space;
    G.arrive = clamp01(range(anim.p, s0 + 0.02, s1 - 0.005));
    G.camera = camera;
    const g = group.current;
    g.visible = G.arrive > 0;
    const inGalaxy = G.arrive > 0.96;
    if (inGalaxy !== wasIn.current) {
      wasIn.current = inGalaxy;
      setState({ galaxy: inGalaxy });
    }
    if (!g.visible) return;

    g.position.set(end.x, end.y, end.z);
    if (inGalaxy) steer(dt, camera, size);
    else {
      // ease the view back to centre when scrolling out of the galaxy
      G.yaw = damp(G.yaw, 0, 3, dt);
      G.pitch = damp(G.pitch, 0, 3, dt);
      G.vYaw = G.vPitch = 0;
    }

    // hover: ray from the cursor (mouse only — touch selects on tap)
    let hot = -1;
    if (inGalaxy && G.pointer.mouse && G.pointer.inside) {
      ndc.set(G.pointer.x, -G.pointer.y);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (hit && hit.object.userData.op > 0.6) hot = meshes.indexOf(hit.object);
    } else if (!G.pointer.mouse) hot = G.hotCard;
    G.hotCard = hot;
    const item = hot >= 0 ? cards[hot].item : -1;
    if (item !== lastItem.current) {
      lastItem.current = item;
      setState({ hot: item });
    }

    const t = clock.elapsedTime;
    meshes.forEach((m, i) => {
      const c = m.userData.card;
      const k = easeOut(clamp01((G.arrive * 1.55 - c.delay) / 1));
      const d = c.dist * (1 + (1 - k) * 0.9);
      const bob = anim.reduced ? 0 : Math.sin(t * 0.35 + c.bob) * 0.25;
      direction(c.yaw, c.pitch + bob, dir).multiplyScalar(d);
      m.position.copy(dir);
      m.rotation.set((c.pitch + bob) * DEG, -c.yaw * DEG, 0, 'YXZ'); // face the centre
      const h = 2 * c.dist * Math.tan((c.h / 2) * DEG);
      const ud = m.userData;
      ud.lift = damp(ud.lift, i === hot ? 1.05 : 1, 8, dt);
      m.scale.set(h * c.aspect * ud.lift, h * ud.lift, 1);
      // far cards are darker and softer; everything dims around a hovered card
      const rest = REST_LIGHT[c.tier];
      const target = hot < 0 ? rest : i === hot ? 1 : c.item === item ? 0.4 : 0.12;
      ud.light = damp(ud.light, target, 6, dt);
      m.material.color.setScalar(ud.light);
      ud.bias.value = damp(ud.bias.value, i === hot ? 0 : REST_BLUR[c.tier], 6, dt);
      ud.op = k;
      m.material.opacity = k;
    });
  });

  return (
    <group ref={group} visible={false}>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </group>
  );
}

