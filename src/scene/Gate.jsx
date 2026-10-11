import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DEPTH, GATE_SCALE, LENS, TIMELINE } from '../layout.js';
import { anim, easeInOut, range } from '../state.js';
import { getMaterials, ringGeometry } from './materials.js';

// ---------------------------------------------------------------------------
// Iris: nine curved blades drawn in a shader. The opening is see-through
// (uClear) so the camera can fly into the lens elements behind it.
const irisVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const irisFragment = /* glsl */ `
  uniform float uAperture, uClear;
  varying vec2 vUv;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 c = (vUv - 0.5) * 2.0;
    float r = length(c);
    float a = atan(c.y, c.x);
    const float N = 9.0;
    float seg = 6.2831853 / N;
    float rot = (1.0 - uAperture) * 1.15;
    float R = mix(0.0, 1.02, uAperture);
    float local = mod(a - rot, seg) - seg * 0.5;
    float d = r * cos(local) - R * cos(3.14159265 / N);   // > 0 means covered by a blade

    float sw = a - rot - (r - R) * 1.7;                    // blades curve as they leave the opening
    float id = floor(mod(sw, 6.2831853) / seg);
    float bu = fract(sw / seg);
    vec3 blade = vec3(0.055, 0.055, 0.06) + vec3(0.07) * bu + 0.025 * hash(id);
    blade *= 1.0 - 0.65 * smoothstep(0.05, 0.0, bu);       // dark leading edge of each blade
    blade += vec3(0.3, 0.27, 0.34) * pow(max(dot(normalize(c + 1e-4), normalize(vec2(0.45, 0.6))), 0.0), 10.0)
           * 0.18 * smoothstep(1.0, 0.25, r);

    // looking down the lens: near-black with a warm and a violet coating glint
    vec3 hole = vec3(0.006);
    hole += vec3(0.5, 0.3, 0.08) * 0.12 * smoothstep(0.5, 0.0, length(c - vec2(0.18, 0.22)));
    hole += vec3(0.32, 0.22, 0.6) * 0.08 * smoothstep(0.35, 0.0, length(c + vec2(0.22, 0.12)));

    float covered = smoothstep(-0.008, 0.008, d);
    vec3 col = mix(hole, blade, covered) * smoothstep(1.0, 0.9, r);
    float alpha = mix(1.0 - uClear, 1.0, covered);
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

class Helix extends THREE.Curve {
  constructor(radius, height, turns) {
    super();
    this.radius = radius;
    this.height = height;
    this.turns = turns;
  }
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    return target.set(Math.cos(a) * this.radius, (t - 0.5) * this.height, Math.sin(a) * this.radius);
  }
}

function Screw({ x, y, z, S, rot, M }) {
  return (
    <group position={[x * S, y * S, z]} rotation={[0, 0, rot]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
        <cylinderGeometry args={[0.019 * S, 0.022 * S, 0.014 * S, 20]} />
      </mesh>
      <mesh position={[0, 0, 0.0082 * S]} material={M.dark}>
        <boxGeometry args={[0.032 * S, 0.0055 * S, 0.0012 * S]} />
      </mesh>
    </group>
  );
}

const glass = (intensity) =>
  new THREE.MeshPhysicalMaterial({
    color: '#000000',
    metalness: 0,
    roughness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    iridescence: 1,
    iridescenceIOR: 1.7,
    iridescenceThicknessRange: [250, 700],
    envMapIntensity: intensity,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

// Inner lens elements: a faint violet/amber coating tint, strongest at the rim.
// (Environment reflections flared into big white patches this deep in the barrel.)
function coatingMaterial() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.6, 'rgba(40,30,70,0.25)');
  grad.addColorStop(0.86, 'rgba(120,90,190,0.6)');
  grad.addColorStop(0.95, 'rgba(210,150,80,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
}

// Glass elements inside the barrel, as fractions of the tunnel length.
const ELEMENTS = [0.12, 0.3, 0.5, 0.7];
// The credit hangs between the 2nd and 3rd elements; the camera flies through it.
const TITLE_AT = 0.4;

// Spaced-out text drawn glyph by glyph (canvas letterSpacing isn't everywhere).
function spaced(g, text, cx, y, spacing) {
  const widths = [...text].map((ch) => g.measureText(ch).width);
  const total = widths.reduce((a, w) => a + w, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  [...text].forEach((ch, i) => {
    g.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
  return total;
}

// "BY / MORYASSHAN" — static white type floating inside the lens.
function TunnelTitle({ r, z }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 640;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);

  useEffect(() => {
    let alive = true;
    const draw = () => {
      if (!alive) return;
      const c = texture.image;
      const g = c.getContext('2d');
      g.clearRect(0, 0, c.width, c.height);
      g.fillStyle = '#ffffff';
      g.textBaseline = 'alphabetic';

      g.font = '500 54px "JetBrains Mono", ui-monospace, monospace';
      spaced(g, 'BY', c.width / 2, 170, 22);

      // fit the name to the canvas width
      let size = 300;
      const font = (s) => `800 ${s}px "Playfair Display", Georgia, serif`;
      const fit = (s) => {
        g.font = font(s);
        return [...'MORYASSHAN'].reduce((a, ch) => a + g.measureText(ch).width, 0) + s * 0.12 * 9;
      };
      while (fit(size) > c.width * 0.92 && size > 60) size -= 6;
      g.font = font(size);
      spaced(g, 'MORYASSHAN', c.width / 2, 170 + 60 + size * 0.78, size * 0.12);

      texture.needsUpdate = true;
    };
    draw();
    // redraw once the web fonts have arrived
    Promise.all([
      document.fonts.load('800 300px "Playfair Display"'),
      document.fonts.load('500 54px "JetBrains Mono"'),
    ]).then(draw, () => {});
    return () => {
      alive = false;
    };
  }, [texture]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [texture],
  );
  useEffect(() => () => (material.dispose(), texture.dispose()), [material, texture]);

  // keep the corners inside the narrowest element ring in front of it
  const w = r * 1.5;
  return (
    <mesh position={[0, 0, z]} material={material} renderOrder={2}>
      <planeGeometry args={[w, (w * 640) / 2048]} />
    </mesh>
  );
}

function Lens({ S }) {
  const M = getMaterials();
  const irisMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: irisVertex,
        fragmentShader: irisFragment,
        toneMapped: false,
        transparent: true,
        uniforms: { uAperture: { value: 0.62 }, uClear: { value: 0 } },
      }),
    [],
  );
  const frontGlass = useMemo(() => glass(1.1), []);
  const innerGlass = useMemo(() => coatingMaterial(), []);
  // the wall around the barrel's open far end (faces the camera)
  const endWall = useMemo(() => {
    const m = M.cavity.clone();
    m.side = THREE.FrontSide;
    return m;
  }, [M]);
  useEffect(
    () => () => [irisMat, frontGlass, innerGlass, endWall].forEach((m) => m.dispose()),
    [irisMat, frontGlass, innerGlass, endWall],
  );

  const r = LENS.r * S;
  const capR = 0.42 * S;
  const theta = Math.asin(r / capR);
  const len = LENS.tunnel * S;
  const ribs = useMemo(() => Array.from({ length: 7 }, (_, i) => -0.18 * S - i * (len / 7)), [S, len]);

  useFrame(() => {
    const [a, b] = TIMELINE.iris;
    const open = easeInOut(range(anim.p, a, b));
    irisMat.uniforms.uAperture.value = 0.62 + 0.38 * open;
    irisMat.uniforms.uClear.value = open;
    frontGlass.opacity = 1 - open;
  });

  return (
    <group position={[0, 0, LENS.z * S]}>
      {/* front ring */}
      <mesh position={[0, 0, 0.012 * S]} material={M.anodized}>
        <ringGeometry args={[r * 0.98, 0.195 * S, 64]} />
      </mesh>
      <mesh position={[0, 0, 0.014 * S]} material={M.darkSteel}>
        <torusGeometry args={[0.186 * S, 0.006 * S, 8, 72]} />
      </mesh>

      {/* blades */}
      <mesh material={irisMat}>
        <circleGeometry args={[r, 96]} />
      </mesh>
      {/* coated front element: only its reflections are added on top */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.004 * S - capR * Math.cos(theta)]} material={frontGlass}>
        <sphereGeometry args={[capR, 64, 12, 0, Math.PI * 2, 0, theta]} />
      </mesh>

      {/* the barrel we fly down */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -len / 2]} material={M.barrel}>
        <cylinderGeometry args={[r * 1.02, r * 1.02, len, 64, 1, true]} />
      </mesh>
      {ribs.map((z, i) => (
        <mesh key={i} position={[0, 0, z]} material={i % 3 === 0 ? M.steel : M.darkSteel}>
          <torusGeometry args={[r * 0.99, 0.004 * S, 6, 96]} />
        </mesh>
      ))}
      {ELEMENTS.map((f, i) => (
        <group key={f} position={[0, 0, -f * len]}>
          <mesh material={innerGlass}>
            <circleGeometry args={[r * (0.97 - i * 0.05), 64]} />
          </mesh>
          <mesh material={M.steel}>
            <torusGeometry args={[r * (0.97 - i * 0.05), 0.006 * S, 8, 96]} />
          </mesh>
          <mesh material={M.anodized}>
            <ringGeometry args={[r * (0.97 - i * 0.05), r * 1.01, 64]} />
          </mesh>
        </group>
      ))}
      <TunnelTitle r={r} z={-TITLE_AT * len} />
      {/* the far end is open: it looks out onto the stars */}
      <mesh position={[0, 0, -len]} material={endWall}>
        <ringGeometry args={[r * 1.01, 0.8 * S, 64]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// The recessed film gate: riveted pressure plate, knurled frame, polished
// bezel, hinge rods with springs, a release button and the lens.
export default function Gate({ L }) {
  const M = getMaterials();
  const { gw, gh } = L;
  const S = gh;
  const k = GATE_SCALE;

  const geo = useMemo(
    () => ({
      plate: ringGeometry(0.9 * S, 0.9 * S, 0.035 * S, 0.7 * S, 0.7 * S, 0.02 * S, 0.04 * S, 0.008 * S),
      knurl: ringGeometry(0.68 * S, 0.68 * S, 0.02 * S, 0.5 * S, 0.5 * S, 0.012 * S, 0.05 * S, 0.006 * S),
      bezel: ringGeometry(0.5 * S, 0.5 * S, 0.016 * S, 0.4 * S, 0.4 * S, 0.012 * S, 0.03 * S, 0.02 * S),
      spring: new THREE.TubeGeometry(new Helix(0.03 * S, 0.17 * S, 10), 260, 0.0055 * S, 6),
    }),
    [S],
  );
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const knurlFace = useMemo(() => M.knurlMat(S * 2.6, S * 2.6), [M, S]);

  const plateZ = -0.12 * S;
  const plateFront = plateZ + 0.04 * S + 0.008 * S;
  const screws = [
    [-0.41, 0.415], [-0.21, 0.415], [0.21, 0.415], [0.41, 0.415],
    [-0.41, -0.415], [-0.21, -0.415], [0.21, -0.415], [0.41, -0.415],
    [-0.415, 0.2], [-0.415, -0.2],
  ];
  const rodX = 0.497 * S;
  const lip = 0.05;
  const cavityDepth = (LENS.tunnel + 0.6) * S;

  return (
    <group position={[L.cx * k, L.cy * k, -DEPTH]} scale={k}>
      {/* the dark box behind the opening (deep enough to hold the lens barrel; open at the back) */}
      <mesh position={[0, 0, -cavityDepth / 2]} material={[M.cavity, M.cavity, M.cavity, M.cavity, M.cavity, M.hidden]}>
        <boxGeometry args={[gw, gh, cavityDepth]} />
      </mesh>

      {/* polished lip around the opening */}
      <mesh position={[0, gh / 2, -0.02]} material={M.lip}>
        <boxGeometry args={[gw + lip, lip, 0.08]} />
      </mesh>
      <mesh position={[0, -gh / 2, -0.02]} material={M.lip}>
        <boxGeometry args={[gw + lip, lip, 0.08]} />
      </mesh>
      <mesh position={[gw / 2, 0, -0.02]} material={M.lip}>
        <boxGeometry args={[lip, gh + lip, 0.08]} />
      </mesh>
      <mesh position={[-gw / 2, 0, -0.02]} material={M.lip}>
        <boxGeometry args={[lip, gh + lip, 0.08]} />
      </mesh>

      {/* pressure plate + rivets */}
      <mesh geometry={geo.plate} position={[0, 0, plateZ]} material={[M.plate, M.darkSteel]} />
      {screws.map(([x, y], i) => (
        <Screw key={i} x={x} y={y} z={plateFront + 0.006 * S} S={S} rot={(i * 1.7) % Math.PI} M={M} />
      ))}
      {/* latch on the right: a hole and two pins */}
      <mesh position={[0.41 * S, 0.02 * S, plateFront + 0.001]} material={M.dark}>
        <circleGeometry args={[0.024 * S, 24]} />
      </mesh>
      {[-0.1, -0.17].map((y) => (
        <mesh key={y} position={[0.41 * S, y * S, plateFront + 0.008 * S]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
          <cylinderGeometry args={[0.014 * S, 0.014 * S, 0.02 * S, 16]} />
        </mesh>
      ))}

      {/* knurled frame and bezel */}
      <mesh geometry={geo.knurl} position={[0, 0, -0.085 * S]} material={[knurlFace, M.darkSteel]} />
      <mesh geometry={geo.bezel} position={[0, 0, -0.06 * S]} material={M.bezel} />

      {/* square throat between bezel and lens */}
      <mesh position={[0, 0, -0.1425 * S]} material={[M.cavity, M.cavity, M.cavity, M.cavity, M.hidden, M.hidden]}>
        <boxGeometry args={[0.38 * S, 0.38 * S, 0.115 * S]} />
      </mesh>
      <Lens S={S} />

      {/* hinge rods: springs on the right, plain on the left */}
      {[rodX, -rodX].map((x) => (
        <group key={x} position={[x, 0, -0.07 * S]}>
          <mesh material={M.steel}>
            <cylinderGeometry args={[0.02 * S, 0.02 * S, 0.94 * S, 20]} />
          </mesh>
          {[0.45, -0.45].map((y) => (
            <mesh key={y} position={[0, y * S, 0]} material={M.darkSteel}>
              <cylinderGeometry args={[0.03 * S, 0.03 * S, 0.035 * S, 20]} />
            </mesh>
          ))}
          {x > 0 &&
            [0.31, -0.31].map((y) => (
              <group key={y} position={[0, y * S, 0]}>
                <mesh geometry={geo.spring} material={M.steel} />
                <mesh position={[0, 0.095 * S, 0]} material={M.darkSteel}>
                  <cylinderGeometry args={[0.034 * S, 0.034 * S, 0.02 * S, 20]} />
                </mesh>
                <mesh position={[0, -0.095 * S, 0]} material={M.darkSteel}>
                  <cylinderGeometry args={[0.034 * S, 0.034 * S, 0.02 * S, 20]} />
                </mesh>
              </group>
            ))}
        </group>
      ))}

      {/* release button, bottom right */}
      <group position={[0.36 * S, -0.445 * S, plateFront + 0.01 * S]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={M.darkSteel}>
          <cylinderGeometry args={[0.052 * S, 0.056 * S, 0.03 * S, 32]} />
        </mesh>
        <mesh position={[0, 0, 0.016 * S]} scale={[1, 1, 0.35]} material={M.steel}>
          <sphereGeometry args={[0.044 * S, 32, 16]} />
        </mesh>
      </group>
    </group>
  );
}
