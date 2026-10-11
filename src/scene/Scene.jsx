import { useEffect, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CAM_Z, DEPTH, FOV, GATE_SCALE, TIMELINE, computeLayout, lensWorld } from '../layout.js';
import { anim, easeInOut, easeOut, range, setState } from '../state.js';
import { PHOTOS } from '../photos.js';
import Facet from './Facet.jsx';
import Gate from './Gate.jsx';
import Galaxy from './Galaxy.jsx';
import { Body, Dials, Interior, Seams } from './Body.jsx';

function Environment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(new RoomEnvironment(), 0.035);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.55;
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

// Camera stays perfectly still until the dive, then glides down the lens axis.
function CameraDive({ L }) {
  const lens = useMemo(() => lensWorld(L), [L]);
  useFrame(({ camera }) => {
    const [a, b] = TIMELINE.dive;
    const [, flyEnd] = TIMELINE.fly;
    const [, c] = TIMELINE.space;
    // 1) in step with the photos flying out: push in until the gate fills the view
    // 2) then: through the iris and down the barrel, still moving as it leaves the end
    // 3) coast out into the stars at that same speed, settling into a slow drift
    const gateFillZ = -DEPTH + (L.gh * GATE_SCALE * 0.62) / Math.tan(((FOV / 2) * Math.PI) / 180);
    const q1 = easeInOut(range(anim.p, a, flyEnd));
    const x2 = range(anim.p, flyEnd, b);
    const q2 = x2 * x2 * (3 - 2 * x2) + EXIT_SPEED * (x2 * x2 * x2 - x2 * x2);
    const coast = (EXIT_SPEED * (gateFillZ - lens.end) * (c - b)) / (3 * (b - flyEnd));
    const q3 = easeOut(range(anim.p, b, c));
    const z = CAM_Z + (gateFillZ - CAM_Z) * q1 + (lens.end - gateFillZ) * q2 - coast * q3;
    const aim = q1;
    camera.position.set(lens.x * aim, lens.y * aim, z);
    camera.lookAt(lens.x * aim, lens.y * aim, camera.position.z - 10);
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

function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.78} luminanceSmoothing={0.2} radius={0.7} />
      <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.16} />
      <Vignette offset={0.3} darkness={0.6} />
    </EffectComposer>
  );
}

export default function Scene() {
  const size = useThree((s) => s.size);
  const L = useMemo(() => computeLayout(size.width / size.height), [size.width, size.height]);

  const textures = useLoader(
    THREE.TextureLoader,
    PHOTOS.map((p) => p.texture),
  );
  useMemo(() => {
    for (const t of textures) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
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
      <Dials L={L} />
      <Interior L={L} />
      {PHOTOS.map((p) => (
        <Facet key={p.id} photo={p} texture={textures[PHOTOS.indexOf(p)]} L={L} />
      ))}
      <Seams L={L} />
      <Gate L={L} />
      <Galaxy L={L} />
      <Effects />
    </>
  );
}
