import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TIMELINE } from '../layout.js';
import { anim, clamp01, range, setState } from '../state.js';
import { DEG, G, ITEMS, PERIOD, TOP, buildCards, direction, ndc, raycaster, wrapYaw } from '../galaxy.js';

const geometry = new THREE.PlaneGeometry(1, 1);
const damp = THREE.MathUtils.damp;
const REST_LIGHT = [0.92, 0.6]; // near copy, far copy
const REST_BLUR = [0, 1.6]; // texture LOD bias, near to far
const SPEED = 42; // fastest turn, degrees / second
const DEAD = 0.12; // cursor dead zone around the centre (NDC)

// Soft response curve for the cursor: nothing in the dead zone, then an
// S-curve up to full strength at the edge, so turning eases in and out.
function curve(v) {
  const x = clamp01((Math.abs(v) - DEAD) / (1 - DEAD));
  return Math.sign(v) * x * x * (3 - 2 * x);
}

// Steers the view. The ring of cards turns endlessly (it wraps), with a speed
// that follows how far the cursor is from the centre; the tilt follows the
// cursor's height directly and eases to a stop at the top and bottom, so the
// view never hits a hard wall. A hovered card holds the turn.
function steer(dt, camera) {
  G.maxPitch = Math.max(TOP - camera.fov / 2 + 3, 0);
  const p = G.pointer;
  let tYaw = 0;
  let tPitch = G.pitch;
  if (anim.reduced) {
    // no continuous turning: the cursor position maps straight onto the ring
    if (p.inside && p.mouse) {
      G.yaw = damp(G.yaw, (p.x * PERIOD) / 2, 4, dt);
      G.pitch = damp(G.pitch, -p.y * G.maxPitch, 4, dt);
    }
    G.vYaw = 0;
    return;
  }
  if (p.mouse && p.inside) {
    // a hovered card holds still, unless the cursor is pushing at the very edge
    const hold = G.hotCard < 0 ? 1 : Math.abs(p.x) > 0.85 ? 0.3 : 0;
    tYaw = curve(p.x) * SPEED * hold;
    tPitch = -curve(p.y) * G.maxPitch;
  } else if (!p.mouse && !p.dragging && performance.now() - G.touchedAt > 2500) {
    // phones: a slow idle drift round the ring
    tYaw = G.drift * 5;
    tPitch = 0;
  }
  if (!p.dragging) G.vYaw = damp(G.vYaw, tYaw, p.mouse ? 2.4 : 1.5, dt);
  G.yaw += G.vYaw * dt;
  G.pitch = damp(G.pitch, Math.max(-G.maxPitch, Math.min(G.maxPitch, tPitch)), 2.2, dt);
}

export default function Constellation({ end }) {
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
        const material = new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, depthWrite: false });
        // depth of field: far cards sample a blurrier mip level of their texture;
        // turning fast smears every card sideways (a few taps along x)
        const bias = { value: 0 };
        const smear = { value: 0 };
        material.onBeforeCompile = (shader) => {
          shader.uniforms.uBias = bias;
          shader.uniforms.uSmear = smear;
          shader.fragmentShader = shader.fragmentShader
            .replace(
              'void main() {',
              `uniform float uBias, uSmear;
vec4 smearMap(vec2 uv) {
  float lod = uBias + uSmear * 40.0;
  vec4 c = vec4(0.0);
  for (int i = 0; i < 5; i++) c += texture2D(map, uv + vec2((float(i) * 0.25 - 0.5) * uSmear, 0.0), lod);
  return c * 0.2;
}
void main() {`,
            )
            .replace('texture2D( map, vMapUv )', 'smearMap( vMapUv )');
        };
        const m = new THREE.Mesh(geometry, material);
        m.renderOrder = 2;
        m.userData = { card: c, light: REST_LIGHT[c.tier], lift: 1, bias, smear };
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
    // the field is already in place behind the lens: it shows through the bore
    // as soon as the iris starts to open, so the dive exits straight into it
    g.visible = anim.p > TIMELINE.iris[0];
    const inGalaxy = G.arrive > 0.96;
    if (inGalaxy !== wasIn.current) {
      wasIn.current = inGalaxy;
      setState({ galaxy: inGalaxy });
    }
    if (!g.visible) return;

    g.position.set(end.x, end.y, end.z);
    if (inGalaxy) steer(dt, camera);
    else {
      // scrolling back out: the ring settles to its home turn, the view levels
      G.vYaw = damp(G.vYaw, 0, 4, dt);
      G.yaw = damp(G.yaw + G.vYaw * dt, PERIOD * Math.round(G.yaw / PERIOD), 3, dt);
      G.pitch = damp(G.pitch, 0, 3, dt);
    }

    // hover: ray from the cursor (mouse only — touch selects on tap)
    let hot = -1;
    if (inGalaxy && G.pointer.mouse && G.pointer.inside) {
      ndc.set(G.pointer.x, -G.pointer.y);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (hit) hot = meshes.indexOf(hit.object);
    } else if (inGalaxy && !G.pointer.mouse) hot = G.hotCard;
    G.hotCard = hot;
    const item = hot >= 0 ? cards[hot].item : -1;
    if (item !== lastItem.current) {
      lastItem.current = item;
      setState({ hot: item });
    }

    const t = clock.elapsedTime;
    const speed = Math.min(Math.abs(G.vYaw) / SPEED, 1);
    meshes.forEach((m, i) => {
      const c = m.userData.card;
      const ud = m.userData;
      const bob = anim.reduced ? 0 : Math.sin(t * 0.35 + c.bob) * 0.25;
      const yaw = wrapYaw(c.yaw - G.yaw);
      direction(yaw, c.pitch + bob, dir).multiplyScalar(c.dist);
      m.position.copy(dir);
      m.rotation.set((c.pitch + bob) * DEG, -yaw * DEG, 0, 'YXZ'); // face the centre
      const h = 2 * c.dist * Math.tan((c.h / 2) * DEG);
      ud.lift = damp(ud.lift, i === hot ? 1.05 : 1, 8, dt);
      m.scale.set(h * c.aspect * ud.lift * (1 + speed * 0.06), h * ud.lift, 1);
      // far cards are darker and softer; everything dims around a hovered card
      const rest = REST_LIGHT[c.tier];
      const target = hot < 0 ? rest : i === hot ? 1 : c.item === item ? 0.35 : 0.1;
      ud.light = damp(ud.light, target, 6, dt);
      m.material.color.setScalar(ud.light);
      ud.bias.value = damp(ud.bias.value, i === hot ? 0 : REST_BLUR[c.tier], 6, dt);
      ud.smear.value = speed * speed * 0.05;
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
