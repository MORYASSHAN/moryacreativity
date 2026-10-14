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
  line: p.line,
  href: p.kind === 'live' ? p.url : `${base}showcase/concepts/${p.slug}/`,
  texture: `${base}galaxy/${p.slug}.webp`,
}));

// Angles are in degrees. The field is an endless ring: card yaws live in
// -PERIOD/2..PERIOD/2 and wrap around, so turning never reaches an end (the
// wrap happens well outside the view). Pitch stays inside -TOP..TOP. Every
// project appears exactly twice: once large and near, once smaller and further
// away, about half a turn apart. A card is only placed where its rectangle
// (plus a GAP margin) is clear of every other, so no two cards ever overlap.
export const PERIOD = 180;
export const TOP = 34;
const GAP = 3;
const TEX_ASPECT = 1.6; // every texture is 1280x800
const ASPECTS = [1.6, 1.33, 1.78, 1.2, 1.5, 1.9, 1.0, 0.8];
// near and far copy of each project: [smallest height, largest height, distance]
const TIERS = [
  [13, 17, 9.5],
  [8, 11, 12],
];

// signed angle folded into -PERIOD/2..PERIOD/2
export const wrapYaw = (a) => a - PERIOD * Math.round(a / PERIOD);

function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function buildCards() {
  const R = rng(4242);
  const n = ITEMS.length;
  // shuffled so neighbouring cards belong to different projects
  const order = ITEMS.map((_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const cards = [];
  const clear = (c) =>
    cards.every(
      (o) =>
        Math.abs(wrapYaw(c.yaw - o.yaw)) >= (c.w + o.w) / 2 + GAP ||
        Math.abs(c.pitch - o.pitch) >= (c.h + o.h) / 2 + GAP,
    );

  // search outwards from a target spot, shrinking the card a little if it's crowded
  const place = (item, tier, yaw0, up) => {
    const [hMin, hMax, dist] = TIERS[tier];
    for (let tries = 0; tries < 2000; tries++) {
      const t = tries / 2000;
      const h = (hMin + R() * (hMax - hMin)) * (1 - 0.3 * t);
      const aspect = ASPECTS[Math.floor(R() * ASPECTS.length)];
      const room = TOP - h / 2;
      // prefer the requested half (above / below the horizon), then anywhere
      const pitch = t < 0.5 ? (up ? 1 : -1) * (2 + R() * (room - 2)) : (R() * 2 - 1) * room;
      // a card's yaw extent widens away from the horizon
      const stretch = 1 / Math.cos((Math.abs(pitch) + h / 2) * (Math.PI / 180));
      const yaw = wrapYaw(yaw0 + (R() * 2 - 1) * (4 + 80 * t));
      const c = { yaw, pitch, h, w: h * aspect * stretch, aspect };
      if (!clear(c)) continue;

      // each copy shows a different crop of its project's screenshot
      const rep = [1, 1];
      const off = [0, 0];
      if (aspect < TEX_ASPECT) {
        rep[0] = aspect / TEX_ASPECT;
        off[0] = (1 - rep[0]) * (0.2 + 0.6 * R());
      } else if (aspect > TEX_ASPECT) {
        rep[1] = TEX_ASPECT / aspect;
        off[1] = (1 - rep[1]) * (0.35 + 0.65 * R()); // stay near the top of the page
      }
      cards.push({ ...c, item, tier, dist: dist + R() * 0.8, rep, off, bob: R() * Math.PI * 2 });
      return cards[cards.length - 1];
    }
    return null;
  };

  // near copies: evenly round the ring, alternating above and below the horizon
  const near = order.map((item, i) => place(item, 0, -PERIOD / 2 + ((i + 0.5) * PERIOD) / n, i % 2 === 0));
  // far copies: half a turn from their twin, on the other side of the horizon
  order.forEach((item, i) => {
    const twin = near[i];
    place(item, 1, (twin ? twin.yaw : 0) + PERIOD / 2, twin ? twin.pitch < 0 : i % 2 === 1);
  });
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
  return hit ? G.meshes.indexOf(hit.object) : -1;
}
