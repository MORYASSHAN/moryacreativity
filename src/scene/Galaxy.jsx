import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { lensWorld } from '../layout.js';
import { anim } from '../state.js';
import { DEG, G, PERIOD } from '../galaxy.js';

// ---------------------------------------------------------------------------
// The dark galaxy beyond the far end of the lens: nothing but stars, drifting
// slowly towards the camera and turning very gently about the lens axis.
// Stars live in a slab DEPTH long that wraps around the camera, so the drift
// never runs out; while the camera is still inside the lens the slab starts
// at the barrel's open end.
const COUNT = 22000;
const DEPTH = 110;
const RADIUS = 95;
const DRIFT = 0.45; // world units per second, towards the camera
const SPIN = 0.006; // radians per second

const vertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize, aSeed;
  uniform float uTime, uDrift, uSpin, uOrigin, uCamZ, uPixel, uYaw;
  uniform vec2 uAxis;
  uniform vec3 uCam;
  varying vec3 vColor;
  varying float vAlpha, vSpike;
  const float DEPTH = ${DEPTH.toFixed(1)};

  void main() {
    // wrap along z relative to the camera, but never closer than the lens end
    float cz = min(uCamZ - uOrigin, 0.0);
    float rel = mod(position.z + uTime * uDrift - cz, DEPTH) - DEPTH;
    float a = uTime * uSpin;
    vec2 xy = mat2(cos(a), sin(a), -sin(a), cos(a)) * position.xy;
    vec3 p = vec3(uAxis + xy, uOrigin + cz + rel);
    // turning in the galaxy spins the sky about the camera, wrapping every half
    // turn exactly like the ring of cards (stars are only ever in front of it)
    vec3 d = p - uCam;
    float phi = mod(atan(d.x, -d.z) - uYaw + 1.5707963, 3.1415927) - 1.5707963;
    float rho = length(d.xz);
    vec4 mv = viewMatrix * vec4(uCam + vec3(rho * sin(phi), d.y, -rho * cos(phi)), 1.0);
    float dist = max(-mv.z, 0.05);
    gl_Position = projectionMatrix * mv;

    float size = aSize * uPixel * 60.0 / dist;
    float minSize = 1.4 * uPixel;
    float dim = min(size / minSize, 1.0);
    gl_PointSize = clamp(size, minSize, 9.0 * uPixel);

    float twinkle = 0.78 + 0.22 * sin(uTime * (0.5 + aSeed * 1.6) + aSeed * 40.0);
    float fade = smoothstep(DEPTH, DEPTH * 0.72, -rel) * smoothstep(0.0, 1.5, -rel);
    vAlpha = dim * dim * twinkle * fade * clamp(34.0 / dist, 0.4, 1.0);
    vColor = aColor;
    vSpike = smoothstep(4.0, 8.0, size / uPixel);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha, vSpike;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float glow = exp(-d * d * 7.0) + 0.22 * exp(-d * 4.0);
    // faint four-point diffraction spikes on the nearest, brightest stars
    float spike = (exp(-abs(c.y) * 70.0) + exp(-abs(c.x) * 70.0)) * (1.0 - d) * 0.5 * vSpike;
    float a = (glow + spike) * vAlpha * smoothstep(1.0, 0.8, d);
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
    #include <colorspace_fragment>
  }
`;

// star colours by temperature: blue-white, white, warm, orange
const TINTS = [
  [0.72, 0.82, 1.0],
  [1.0, 1.0, 1.0],
  [1.0, 0.9, 0.74],
  [1.0, 0.72, 0.48],
];

function gauss(rand) {
  return Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
}

function buildStars() {
  // seeded so the sky is the same on every visit
  let s = 1337;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const size = new Float32Array(COUNT);
  const seed = new Float32Array(COUNT);
  // ~40% of the stars crowd into a tilted band: the disc of the galaxy we're inside
  const tilt = 0.5;
  const n = [Math.sin(tilt), Math.cos(tilt)];
  for (let i = 0; i < COUNT; i++) {
    let x, y;
    if (rand() < 0.4) {
      const along = (rand() * 2 - 1) * RADIUS;
      const across = gauss(rand) * 5;
      x = -n[1] * along + n[0] * across;
      y = n[0] * along + n[1] * across;
    } else {
      const r = Math.sqrt(rand()) * RADIUS;
      const a = rand() * Math.PI * 2;
      x = Math.cos(a) * r;
      y = Math.sin(a) * r;
    }
    pos.set([x, y, rand() * DEPTH], i * 3);

    const t = rand();
    const tint = TINTS[t < 0.22 ? 0 : t < 0.7 ? 1 : t < 0.93 ? 2 : 3];
    // most stars are faint; a rare few are bright enough to bloom
    const b = rand();
    const bright = b > 0.992 ? 2.2 : 0.45 + 0.85 * Math.pow(rand(), 2.5);
    col.set(tint.map((v) => v * bright), i * 3);
    size[i] = b > 0.992 ? 2.4 + rand() * 1.6 : 0.5 + Math.pow(rand(), 3) * 1.4;
    seed[i] = rand();
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  return g;
}

export default function Galaxy({ L }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const lens = useMemo(() => lensWorld(L), [L]);
  const geometry = useMemo(() => buildStars(), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uDrift: { value: DRIFT },
          uSpin: { value: SPIN },
          uOrigin: { value: 0 },
          uCamZ: { value: 0 },
          uYaw: { value: 0 },
          uCam: { value: new THREE.Vector3() },
          uPixel: { value: 1 },
          uAxis: { value: new THREE.Vector2() },
        },
      }),
    [],
  );
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);

  useFrame(({ camera, clock }) => {
    const u = material.uniforms;
    u.uTime.value = anim.reduced ? 0 : clock.elapsedTime;
    u.uOrigin.value = lens.end;
    u.uCamZ.value = camera.position.z;
    u.uCam.value.copy(camera.position);
    u.uYaw.value = (G.yaw - PERIOD * Math.floor(G.yaw / PERIOD)) * DEG; // the sky repeats every PERIOD
    u.uPixel.value = dpr;
    u.uAxis.value.set(lens.x, lens.y);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />;
}
