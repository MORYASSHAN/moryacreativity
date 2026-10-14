import { useEffect, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CAM_Z, DEPTH, FOV, GATE_SCALE, TIMELINE, computeLayout, lensWorld } from '../layout.js';
import { anim, easeInOut, easeOut, range, setState } from '../state.js';
import { PHOTOS } from '../photos.js';
import Facet from './Facet.jsx';
import Gate from './Gate.jsx';
import Galaxy from './Galaxy.jsx';
import Constellation from './Constellation.jsx';
import { G, direction } from '../galaxy.js';
import { Body, Border, Dials, Interior, Seams } from './Body.jsx';

function Environment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(new RoomEnvironment(), 0.035);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.75;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [gl, scene]);
  return null;
}

// Smooths the raw scroll position once per frame (mounted first, so it runs
// before everything that reads anim.p).
function ScrollDriver() {
  useFrame((_, dt) => {
    anim.p = anim.reduced ? anim.scroll : THREE.MathUtils.damp(anim.p, anim.scroll, 3.2, Math.min(dt, 0.1));
    if (Math.abs(anim.p - anim.scroll) < 1e-4) anim.p = anim.scroll;
  });
  return null;
}

// How fast the camera leaves the far end of the barrel, relative to an even pace.
const EXIT_SPEED = 2;

// Key points of the dive: where the gate fills the view, how far the camera coasts
// past the lens, and where it finally comes to rest.
function divePath(L, lens) {
  const [, b] = TIMELINE.dive;
  const [, flyEnd] = TIMELINE.fly;
  const [, c] = TIMELINE.space;
  const gateFillZ = -DEPTH + (L.gh * GATE_SCALE * 0.62) / Math.tan(((FOV / 2) * Math.PI) / 180);
  const coast = (EXIT_SPEED * (gateFillZ - lens.end) * (c - b)) / (3 * (b - flyEnd));
  return { gateFillZ, coast, end: { x: lens.x, y: lens.y, z: lens.end - coast } };
}

// Camera stays perfectly still until the dive, then glides down the lens axis.
// Once it has come to rest in the galaxy, the cursor tilts where it looks.
function CameraDive({ L }) {
  const lens = useMemo(() => lensWorld(L), [L]);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const [a, b] = TIMELINE.dive;
    const [, flyEnd] = TIMELINE.fly;
    const [, c] = TIMELINE.space;
    // 1) in step with the photos flying out: push in until the gate fills the view
    // 2) then: through the iris and down the barrel, still moving as it leaves the end
    // 3) coast out into the stars at that same speed, settling into a slow drift
    const { gateFillZ, coast } = divePath(L, lens);
    const q1 = easeInOut(range(anim.p, a, flyEnd));
    const x2 = range(anim.p, flyEnd, b);
    const q2 = x2 * x2 * (3 - 2 * x2) + EXIT_SPEED * (x2 * x2 * x2 - x2 * x2);
    const q3 = easeOut(range(anim.p, b, c));
    const z = CAM_Z + (gateFillZ - CAM_Z) * q1 + (lens.end - gateFillZ) * q2 - coast * q3;
    const aim = q1;
    camera.position.set(lens.x * aim, lens.y * aim, z);
    // the camera only tilts; turning left/right spins the ring of cards and stars instead
    // the tilt belongs to the galaxy: it fades out with the scroll on the way back, so the
    // camera is always level in the lens and at rest, whatever G.pitch was left at
    direction(0, G.pitch * easeInOut(range(anim.p, b, c)), look).multiplyScalar(10).add(camera.position);
    camera.lookAt(look);
    const fov = FOV + 14 * easeInOut(range(anim.p, flyEnd, b));
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-6, 9, 10]} intensity={1.5} color="#fff4e8" />
      <directionalLight position={[8, -4, 6]} intensity={0.35} color="#dfe6ff" />
      <pointLight position={[2.5, 2, 3.2]} intensity={7} distance={16} decay={1.4} color="#fffaf2" />
    </>
  );
}

// Keeps the motion fluid on any GPU. Every half second the average frame time is
// checked: two slow windows in a row step down a rung, a long fast stretch steps
// back up (at most twice per phase, so a GPU that can't keep up doesn't flip back
// and forth). The composer's 4x MSAA (a multisampled half-float buffer plus its
// resolve) is the biggest single cost on integrated GPUs, so it is part of the
// ladder; switching it on the composer only resizes its buffers (no rebuild, no
// recompile). The dive gives up resolution first (its thin metal edges shimmer
// without AA), the galaxy gives up MSAA first (the screenshots need the pixels),
// and each keeps its own rung, so a heavy stretch of the dive never leaves the
// cards blurry.
const composerRef = { current: null };
// Full device resolution (up to 2x, e.g. retina / 4K screens) on the top rung.
// On 1x screens the top rung supersamples at 1.5x for extra crispness.
const HI_DPR = Math.max(1.5, Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2));
const MID_DPR = 1.25;
const LADDERS = [
  // [pixel ratio, MSAA samples], cheapest first; both phases start on the top rung
  [[0.6, 0], [0.7, 0], [0.85, 0], [0.85, 4], [1, 4], [MID_DPR, 4], [HI_DPR, 4]], // dive
  [[0.6, 0], [0.75, 0], [0.9, 0], [1, 0], [1, 4], [MID_DPR, 4], [HI_DPR, 4]], // galaxy
];
const TOP = LADDERS[0].length - 1;
const GALAXY_AT = TIMELINE.space[1] - 0.03; // the camera has all but stopped here

function AdaptiveQuality() {
  const st = useMemo(() => ({ level: [TOP, TOP], ups: [2, 2], phase: 0, sum: 0, n: 0, slow: 0, fast: 0, skip: 6 }), []);
  useFrame((state, delta) => {
    const phase = anim.p >= GALAXY_AT ? 1 : 0;
    if (phase !== st.phase) {
      st.phase = phase;
      st.sum = st.n = st.slow = st.fast = 0;
      st.skip = Math.max(st.skip, 1);
    }
    // apply this phase's rung (and re-apply it if <Canvas dpr={1}> reset the ratio on a resize)
    const [dpr, msaa] = LADDERS[phase][st.level[phase]];
    if (state.viewport.dpr !== dpr) state.setDpr(dpr);
    const composer = composerRef.current;
    if (composer && composer.multisampling !== msaa) composer.multisampling = msaa;

    // ignore hidden tabs and one-off hitches (texture uploads, tab switches)
    if (document.hidden || delta > 0.25) return;
    st.sum += delta;
    st.n++;
    if (st.sum < 0.5) return;
    const avg = st.sum / st.n;
    st.sum = st.n = 0;
    if (st.skip > 0) return void st.skip--; // shaders compiling / buffers just reallocated
    st.slow = avg > 1 / 50 ? st.slow + 1 : 0;
    st.fast = avg < 1 / 58 ? st.fast + 1 : 0;
    const lv = st.level[phase];
    if (st.slow >= 2 && lv > 0) st.level[phase] = lv - 1;
    else if (st.fast >= 12 && st.ups[phase] > 0 && lv < LADDERS[phase].length - 1) {
      st.level[phase] = lv + 1;
      st.ups[phase]--;
    } else return;
    st.slow = st.fast = 0;
    st.skip = 1; // the next frame reallocates the buffers: don't time it
  });
  return null;
}

function Effects() {
  return (
    <EffectComposer ref={composerRef} multisampling={4}>
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.8} luminanceSmoothing={0.18} radius={0.65} />
      <BrightnessContrast brightness={0.02} contrast={0.12} />
      <HueSaturation saturation={0.16} />
      <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.035} />
      <Vignette offset={0.38} darkness={0.42} />
    </EffectComposer>
  );
}

export default function Scene() {
  const size = useThree((s) => s.size);
  const L = useMemo(() => computeLayout(size.width / size.height), [size.width, size.height]);
  const end = useMemo(() => divePath(L, lensWorld(L)).end, [L]);

  const textures = useLoader(
    THREE.TextureLoader,
    PHOTOS.map((p) => p.texture),
  );
  useMemo(() => {
    for (const t of textures) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 16;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    }
  }, [textures]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (anim.introAt < 0) anim.introAt = performance.now();
      setState({ ready: true });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <ScrollDriver />
      <color attach="background" args={['#050506']} />
      <Environment />
      <Lights />
      <CameraDive L={L} />
      <Body L={L} />
      <Border L={L} />
      <Dials L={L} />
      <Interior L={L} />
      {PHOTOS.map((p) => (
        <Facet key={p.id} photo={p} texture={textures[PHOTOS.indexOf(p)]} L={L} />
      ))}
      <Seams L={L} />
      <Gate L={L} />
      <Galaxy L={L} />
      <Constellation end={end} />
      <AdaptiveQuality />
      <Effects />
    </>
  );
}
