import * as THREE from 'three';
import { PROJECTS } from '../showcase/projects.js';

// ---------------------------------------------------------------------------
// The project field that waits in the galaxy past the lens. Cards sit on the
// inside of a sphere around where the camera comes to rest; the visitor never
// scrolls here — the cursor steers the view (push towards an edge to keep
// turning that way), hovering a card stops the turn, clicking opens it.

const base = import.meta.env.BASE_URL;

export const ITEMS = PROJECTS.map((p) => ({
  slug: p.slug,
  title: p.title,
  live: p.kind === 'live',
  href: p.kind === 'live' ? p.url : `${base}showcase/concepts/${p.slug}/`,
  texture: `${base}galaxy/${p.slug}.webp`,
}));

// Angles are in degrees. Cards are scattered over the band yaw -SPAN..SPAN,
// pitch -TOP..TOP: big ones first, then smaller ones fill the gaps. A card is
// only placed where its rectangle (plus a GAP margin) is clear of every other,
// so no two cards ever overlap.
export const SPAN = 100;
export const TOP = 40;
const GAP = 2.4;
const TEX_ASPECT = 1.6; // every texture is 1280x800
const ASPECTS = [1.6, 1.33, 1.78, 1.2, 1.5, 1.9, 1.0, 0.8];
// [count, smallest height, largest height] — sizes from near to far
const TIERS = [
  [11, 12.5, 16], // one large card per project
  [16, 9, 12],
  [22, 5.5, 8],
];

function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function buildCards() {
  const R = rng(4242);
  const cards = [];
  const boxes = [];
  const clear = (b) =>
    boxes.every((o) => b.y0 >= o.y1 + GAP || b.y1 <= o.y0 - GAP || b.x0 >= o.x1 + GAP || b.x1 <= o.x0 - GAP);
  let k = 0;
  TIERS.forEach(([count, hMin, hMax], tier) => {
    for (let n = 0, tries = 0; n < count && tries < 900; tries++) {
      const h = hMin + R() * (hMax - hMin);
      const aspect = ASPECTS[Math.floor(R() * ASPECTS.length)];
      const pitch = (R() * 2 - 1) * (TOP - h / 2);
      // a card's yaw extent widens away from the horizon
      const stretch = 1 / Math.cos((Math.abs(pitch) + h / 2) * (Math.PI / 180));
      const w = h * aspect * stretch;
      const yaw = (R() * 2 - 1) * (SPAN - w / 2);
      const box = { x0: yaw - w / 2, x1: yaw + w / 2, y0: pitch - h / 2, y1: pitch + h / 2 };
      if (!clear(box)) continue;
      boxes.push(box);
      n++;

      // each instance shows a different crop of its project's screenshot
      const rep = [1, 1];
      const off = [0, 0];
      if (aspect < TEX_ASPECT) {
        rep[0] = aspect / TEX_ASPECT;
        off[0] = (1 - rep[0]) * (0.2 + 0.6 * R());
      } else if (aspect > TEX_ASPECT) {
        rep[1] = TEX_ASPECT / aspect;
        off[1] = (1 - rep[1]) * (0.35 + 0.65 * R()); // stay near the top of the page
      }
      cards.push({
        item: (k++ * 4) % ITEMS.length,
        yaw,
        pitch,
        h,
        aspect,
        tier,
        dist: [9.5, 11, 12.5][tier] + R() * 0.8,
        rep,
        off,
        bob: R() * Math.PI * 2,
      });
    }
  });
  // cards nearest the centre of view arrive first
  for (const c of cards) c.delay = Math.min(Math.hypot(c.yaw, c.pitch * 1.4) / SPAN, 1) * 0.55;
  return cards;
}

// Shared, per-frame state (read inside useFrame; never triggers React renders).
export const G = {
  yaw: 0, // current view direction, degrees
  pitch: 0,
  vYaw: 0, // degrees / second
  vPitch: 0,
  maxYaw: 0,
  maxPitch: 0,
  arrive: 0, // 0..1, how far into the galaxy the dive has come
  pointer: { x: 0, y: 0, inside: false, mouse: true, dragging: false },
  drift: 1, // idle drift direction on touch screens
  touchedAt: 0,
  hotCard: -1,
  camera: null,
  meshes: [],
  cards: [],
};

export function openItem(i) {
  const it = ITEMS[i];
  if (!it) return;
  if (it.live) window.open(it.href, '_blank', 'noopener');
  else location.href = it.href;
}

export const DEG = Math.PI / 180;
export const raycaster = new THREE.Raycaster();
export const ndc = new THREE.Vector2();

// Unit vector for a view direction; yaw turns right, pitch looks up, 0/0 = straight down the lens axis (-z).
export function direction(yaw, pitch, out = new THREE.Vector3()) {
  const cp = Math.cos(pitch * DEG);
  return out.set(Math.sin(yaw * DEG) * cp, Math.sin(pitch * DEG), -Math.cos(yaw * DEG) * cp);
}

// The card under a screen point (used for taps, which have no hover).
export function pick(clientX, clientY) {
  if (!G.camera) return -1;
  ndc.set((clientX / innerWidth) * 2 - 1, -((clientY / innerHeight) * 2 - 1));
  raycaster.setFromCamera(ndc, G.camera);
  const hit = raycaster.intersectObjects(G.meshes, false)[0];
  return hit && hit.object.userData.op > 0.6 ? G.meshes.indexOf(hit.object) : -1;
}
