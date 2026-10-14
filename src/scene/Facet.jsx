import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAM_Z, TIMELINE, facetFrame, fitPhoto } from '../layout.js';
import { anim, easeInOut, range } from '../state.js';

const vertexShader = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The photo is "projected" from the resting camera, so at rest each panel
// looks exactly like a flat crop of the collage. Mapping happens in object
// space, so the image stays glued to the panel when it flies away.
const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uMode, uAxis, uGateEdge, uWinEdge, uCamZ;
  uniform vec4 uLat;     // gate lo, gate hi, window lo, window hi (lateral extent)
  uniform vec3 uOuter;   // source quad, window edge: v, left u, right u
  uniform vec3 uInner;   // source quad, gate edge
  uniform vec4 uCrop;    // horizontal keep fraction, t from, t to, s centre
  uniform vec4 uBox;     // facet bounding box (layout units)
  uniform vec4 uRect;    // cover fit: uv scale, uv offset
  uniform vec4 uSim;     // uniform-scale fit: centre u, u per unit, v per unit, outer v
  uniform float uSimC;   // lateral centre of the facet (layout units)
  uniform float uLift;
  uniform vec2 uTexel;   // 1 / texture size
  varying vec3 vPos;

  void main() {
    vec2 p = vPos.xy * uCamZ / (uCamZ - vPos.z);
    float along = uAxis < 0.5 ? p.y : p.x;
    float lat = uAxis < 0.5 ? p.x : p.y;
    float t = clamp((along - uGateEdge) / (uWinEdge - uGateEdge), 0.0, 1.0);
    float lo = mix(uLat.x, uLat.z, t);
    float hi = mix(uLat.y, uLat.w, t);
    float s = clamp((lat - lo) / (hi - lo), 0.0, 1.0);

    vec2 uv;
    if (uMode < 0.5) {
      float tt = mix(uCrop.y, uCrop.z, t);
      float v = mix(uInner.x, uOuter.x, tt);
      float l = mix(uInner.y, uOuter.y, tt);
      float r = mix(uInner.z, uOuter.z, tt);
      uv = vec2(mix(l, r, uCrop.w + (s - 0.5) * uCrop.x), 1.0 - v);
    } else if (uMode < 1.5) {
      uv = (p - uBox.xy) / uBox.zw * uRect.xy + uRect.zw;
    } else {
      float v = uSim.w + abs(along - uWinEdge) * uSim.z;
      uv = vec2(uSim.x + (lat - uSimC) * uSim.y, 1.0 - v);
    }
    // unsharp mask: crisper detail than plain bilinear upscaling
    vec3 col = texture2D(uMap, uv).rgb;
    vec2 o = uTexel * 0.75;
    vec3 blur = (texture2D(uMap, uv + vec2(o.x, 0.0)).rgb + texture2D(uMap, uv - vec2(o.x, 0.0)).rgb
               + texture2D(uMap, uv + vec2(0.0, o.y)).rgb + texture2D(uMap, uv - vec2(0.0, o.y)).rgb) * 0.25;
    col = clamp(col + (col - blur) * 0.9, 0.0, 1.0);
    // a touch more colour and contrast
    float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(luma), col, 1.12);
    col = clamp((col - 0.5) * 1.06 + 0.5, 0.0, 1.0);

    // soft inner shadows from the seams, the rim and the gate — they lift
    // away as the panel leaves its slot
    float dLat = min(lat - lo, hi - lat) * 0.7;
    float dOut = abs(uWinEdge - along);
    float dIn = abs(along - uGateEdge);
    float ao = mix(0.55, 1.0, smoothstep(0.0, 0.3, min(dLat, min(dOut, dIn))));
    ao *= mix(0.8, 1.0, smoothstep(0.0, 1.0, dOut));
    col *= mix(ao, 1.0, uLift);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

// Each panel leaves in its own direction, swinging open like a door.
const MOTION = {
  top: { dir: [0, 1], rot: [1, 0, 0.06] },
  right: { dir: [1, 0], rot: [0, -1, -0.05] },
  bottom: { dir: [0, -1], rot: [-1, 0, 0.05] },
  left: { dir: [-1, 0], rot: [0, 1, -0.06] },
};

export default function Facet({ photo, texture, L }) {
  const f = useMemo(() => facetFrame(L, photo.facet), [L, photo.facet]);
  const group = useRef(null);
  const Lref = useRef(L);
  Lref.current = L;

  const { geometry, centroid } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(f.quad.flatMap((v) => v.toArray()), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeBoundingSphere();
    const c = f.quad.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(0.25);
    return { geometry: g, centroid: c };
  }, [f]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        toneMapped: false,
        uniforms: {
          uMap: { value: null },
          uMode: { value: 0 },
          uAxis: { value: 0 },
          uGateEdge: { value: 0 },
          uWinEdge: { value: 1 },
          uCamZ: { value: CAM_Z },
          uLat: { value: new THREE.Vector4() },
          uOuter: { value: new THREE.Vector3() },
          uInner: { value: new THREE.Vector3() },
          uCrop: { value: new THREE.Vector4(1, 0, 1, 0.5) },
          uBox: { value: new THREE.Vector4() },
          uRect: { value: new THREE.Vector4(1, 1, 0, 0) },
          uSim: { value: new THREE.Vector4() },
          uSimC: { value: 0 },
          uLift: { value: 0 },
          uTexel: { value: new THREE.Vector2() },
        },
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const u = material.uniforms;
    const fit = fitPhoto(photo, f, texture.image);
    u.uMap.value = texture;
    u.uTexel.value.set(1 / texture.image.width, 1 / texture.image.height);
    u.uMode.value = fit.mode;
    u.uAxis.value = f.axis;
    u.uGateEdge.value = f.gateEdge;
    u.uWinEdge.value = f.winEdge;
    u.uLat.value.set(...f.lat);
    if (photo.quad) {
      u.uOuter.value.set(photo.quad.outer.v, photo.quad.outer.l, photo.quad.outer.r);
      u.uInner.value.set(photo.quad.inner.v, photo.quad.inner.l, photo.quad.inner.r);
    }
    u.uCrop.value.set(...fit.crop);
    u.uBox.value.set(...f.box);
    u.uRect.value.set(...fit.rect);
    if (fit.sim) {
      u.uSim.value.set(...fit.sim);
      u.uSimC.value = fit.simC;
    }
  }, [material, f, photo, texture]);

  const m = MOTION[photo.facet];

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const Lc = Lref.current;
    const [a, b] = TIMELINE.fly;
    const q = easeInOut(range(anim.p, a, b));

    const travel = (m.dir[0] ? Lc.W * 0.5 : Lc.H * 0.55) * q;
    g.position.set(centroid.x + m.dir[0] * travel, centroid.y + m.dir[1] * travel, centroid.z + q * 1.6);
    g.rotation.set(m.rot[0] * q * 0.85, m.rot[1] * q * 0.85, m.rot[2] * q * 2);

    material.uniforms.uLift.value = Math.min(q * 3, 1);
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} position={[-centroid.x, -centroid.y, -centroid.z]} />
    </group>
  );
}
