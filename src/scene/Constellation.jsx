import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TIMELINE } from '../layout.js';
import { anim, clamp01, range, setState } from '../state.js';
import { DEG, G, ITEMS, PERIOD, TOP, buildCards, direction, ndc, raycaster, wrapYaw } from '../galaxy.js';

const geometry = new THREE.PlaneGeometry(1, 1);
const damp = THREE.MathUtils.damp;
const REST_LIGHT = [0.92, 0.6]; // near copy, far copy
const REST_BLUR = [0, 1.1]; // texture LOD bias, near to far (now really applied: see CARD_MAP)
const SHUTTER = 0.075; // seconds of turn smeared into each frame
const MAX_SWEEP = 5; // degrees: the longest streak, however hard a fling
const S = { x: 0, sweep: 0 }; // eased cursor x, current smear length (degrees)

// The cards' texture lookup, swapped in for three's map_fragment. uBias picks a
// softer mip for depth of field. While the ring turns, the quad is widened by
// uSmear (in card widths) and the picture is averaged along x across it: it keeps
// its size and streaks out past its own edges, where taps that miss the crop count
// as clear. Taps are jittered per pixel (no ghost copies) and use explicit
// gradients, so the jitter can't fool the mip selection.
const CARD_MAP = /* glsl */ `
#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv, uBias );
	if ( uSmear > 0.0 ) {
		float len = uSmear * 2.0 * uCrop.y;
		float sx = uCrop.x + ( vMapUv.x - uCrop.x ) * ( 1.0 + uSmear );
		float j = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
		float b = exp2( uBias );
		vec2 gx = dFdx( vMapUv ) * b;
		vec2 gy = dFdy( vMapUv ) * b;
		// pre-blur each tap along x only, as far as 4x anisotropic filtering can
		// stretch without softening y
		gx.x += min( len * 0.1, 3.0 * length( gy ) );
		vec3 sum = vec3( 0.0 );
		float hit = 0.0;
		for ( int i = 0; i < 10; i ++ ) {
			float x = sx + ( ( float( i ) + j ) * 0.1 - 0.5 ) * len;
			float m = step( abs( x - uCrop.x ), uCrop.y );
			sum += textureGrad( map, vec2( x, vMapUv.y ), gx, gy ).rgb * m;
			hit += m;
		}
		sampledDiffuseColor = vec4( sum / max( hit, 1.0 ), hit * 0.1 );
	}
	diffuseColor *= sampledDiffuseColor;
#endif
`;
const SPEED = 46; // fastest turn, degrees / second
const DEAD = 0.14; // cursor dead zone around the centre (NDC)
const TURN_ZONE = 0.62; // past this the cursor is steering: cards under it never interrupt the turn
const HOVER_SPEED = 10; // otherwise a card only catches the cursor once the ring has slowed below this

// Soft response curve for the cursor: nothing in the dead zone, a gentle
// creep just outside it, then a smooth rise to full speed at the edge.
function curve(v) {
  const x = clamp01((Math.abs(v) - DEAD) / (1 - DEAD));
  const s = x * x * (3 - 2 * x);
  return Math.sign(v) * s * s;
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
  // the cursor is eased before it sets the speed, which is eased again: the turn
  // builds and settles like a critically damped spring, never with a jolt
  S.x = damp(S.x, p.mouse && p.inside ? p.x : 0, 6, dt);
  if (p.mouse) {
    // a hovered card (only possible away from the edges) eases the turn to a stop
    const hold = G.hotCard < 0 || Math.abs(p.x) >= TURN_ZONE ? 1 : 0;
    const push = curve(S.x);
    if (Math.abs(push) > 0.05) G.drift = Math.sign(push);
    // plus a slow drift the way it last turned, so the field never stands quite still
    tYaw = (push * SPEED + G.drift * 1.2) * hold;
    if (p.inside) tPitch = -curve(p.y) * G.maxPitch;
  } else if (!p.dragging && G.hotCard < 0 && performance.now() - G.touchedAt > 2500) {
    // phones: a slow idle drift round the ring (held while a tapped card is selected)
    tYaw = G.drift * 5;
    tPitch = 0;
  }
  if (p.dragging) {
    // the finger turns the ring itself (GalaxyUI), so the speed it reports is not
    // integrated again; it fades while the finger pauses, so a drag that stops
    // before lifting doesn't fling, and the idle drift follows the last swipe
    G.vYaw = damp(G.vYaw, 0, 5, dt);
    if (Math.abs(G.vYaw) > 2) G.drift = Math.sign(G.vYaw);
  } else {
    G.vYaw = damp(G.vYaw, tYaw, p.mouse ? 3.6 : 1.5, dt);
    G.yaw += G.vYaw * dt;
  }
  G.pitch = damp(G.pitch, Math.max(-G.maxPitch, Math.min(G.maxPitch, tPitch)), 3, dt);
}

export default function Constellation({ end }) {
  const group = useRef();
  const cards = useMemo(() => buildCards(), []);
  // once every texture is in, the cards are drawn invisibly for a few frames so
  // their shader compiles and textures upload long before the iris opens —
  // otherwise that work lands mid-dive as a stutter
  const warm = useRef({ loaded: 0, frames: 0 });

  // load lazily so the first paint of the camera isn't held up by the gallery
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader(new THREE.LoadingManager());
    return ITEMS.map((it) => {
      // a missing texture still counts, so the intro never waits forever
      const done = () => setState({ cardProgress: Math.min(++warm.current.loaded / ITEMS.length, 1) });
      const t = loader.load(it.texture, done, undefined, done);
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
        // depth of field + motion smear (see CARD_MAP). onBeforeCompile receives the
        // shader with `#include <map_fragment>` still unexpanded, so the include itself
        // is swapped (a replace on `texture2D( map, vMapUv )` never matches anything).
        const bias = { value: 0 };
        const smear = { value: 0 };
        const crop = { value: new THREE.Vector2(c.off[0] + c.rep[0] / 2, c.rep[0] / 2) }; // crop centre, half width (map x)
        material.onBeforeCompile = (shader) => {
          Object.assign(shader.uniforms, { uBias: bias, uSmear: smear, uCrop: crop });
          shader.fragmentShader = shader.fragmentShader
            .replace('void main() {', 'uniform float uBias, uSmear;\nuniform vec2 uCrop;\nvoid main() {')
            .replace('#include <map_fragment>', CARD_MAP);
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
    const w = warm.current;
    const warming = w.loaded >= ITEMS.length && w.frames < 3;
    if (warming && ++w.frames === 3) setState({ cardsReady: true });
    const shown = anim.p > TIMELINE.iris[0];
    g.visible = shown || warming;
    const inGalaxy = G.arrive > 0.96;
    if (inGalaxy !== wasIn.current) {
      wasIn.current = inGalaxy;
      setState({ galaxy: inGalaxy });
    }
    if (inGalaxy) {
      const pitch0 = G.pitch;
      steer(dt, camera);
      G.vPitch = dt > 0 ? (G.pitch - pitch0) / dt : 0; // kept so leaving carries on smoothly
    } else {
      // scrolling back out: the ring springs back to its home turn and the view levels.
      // Critically damped and starting from the speed they already had, so there is no
      // jolt; and it runs every frame, even once the field is hidden, so a fast scroll to
      // the top can never leave the intro camera tilted or the sky turned
      const k = 3;
      const home = PERIOD * Math.round(G.yaw / PERIOD);
      G.vYaw += (-k * k * (G.yaw - home) - 2 * k * G.vYaw) * dt;
      G.yaw += G.vYaw * dt;
      G.vPitch += (-k * k * G.pitch - 2 * k * G.vPitch) * dt;
      G.pitch += G.vPitch * dt;
    }
    if (!g.visible) return;

    g.position.set(end.x, end.y, end.z);

    // hover: ray from the cursor (mouse only — touch selects on tap)
    let hot = -1;
    const steady = Math.abs(G.pointer.x) < TURN_ZONE || Math.abs(G.vYaw) < HOVER_SPEED;
    if (inGalaxy && G.pointer.mouse && G.pointer.inside && steady) {
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
    // how far the ring sweeps in one "exposure": the cards streak by this many degrees
    S.sweep = damp(S.sweep, anim.reduced ? 0 : Math.min(Math.abs(G.vYaw) * SHUTTER, MAX_SWEEP), 14, dt);
    const still = anim.reduced ? 0 : 1;
    meshes.forEach((m, i) => {
      const c = m.userData.card;
      const ud = m.userData;
      // every card wanders on its own slow loop (well inside the 3° gap between cards)
      const by = Math.sin(t * 0.23 + c.bob * 1.7) * 0.5 * still;
      const bob = Math.sin(t * 0.31 + c.bob) * 0.35 * still;
      const yaw = wrapYaw(c.yaw + by - G.yaw);
      direction(yaw, c.pitch + bob, dir).multiplyScalar(c.dist * (1 + Math.sin(t * 0.27 + c.bob * 2.3) * 0.012 * still));
      m.position.copy(dir);
      m.rotation.set((c.pitch + bob) * DEG, -yaw * DEG, 0, 'YXZ'); // face the centre
      const h = 2 * c.dist * Math.tan((c.h / 2) * DEG);
      ud.lift = damp(ud.lift, i === hot ? 1.05 : 1, 8, dt);
      // motion smear: this frame's sweep in card widths (a turn moves cards less far
      // away from the horizon); the quad widens by that much and the shader streaks it
      const s = (S.sweep * Math.cos(c.pitch * DEG)) / (c.h * c.aspect);
      ud.smear.value = s > 0.004 ? Math.min(s, 0.9) : 0;
      m.scale.set(h * c.aspect * ud.lift * (1 + ud.smear.value), h * ud.lift, 1);
      // far cards are darker and softer; around a hovered card everything dims and defocuses
      const rest = REST_LIGHT[c.tier];
      const target = hot < 0 ? rest : i === hot ? 1 : c.item === item ? 0.35 : 0.1;
      ud.light = damp(ud.light, target, 6, dt);
      m.material.color.setScalar(ud.light);
      ud.bias.value = damp(ud.bias.value, i === hot ? 0 : REST_BLUR[c.tier] + (hot < 0 ? 0 : 0.8), 6, dt);
      m.material.opacity = shown ? 1 : 0;
      // nothing to draw until its screenshot has arrived (a /#galaxy landing otherwise shows
      // black squares and logs a three.js warning per card per frame), and while warming every
      // card is drawn once, in view or not, so all eleven screenshots upload up front
      m.visible = m.material.map.image != null;
      m.frustumCulled = shown;
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
