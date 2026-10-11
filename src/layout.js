import { Vector3 } from 'three';

// The plane z = 0 always spans exactly VIEW_H world units vertically, so one
// layout unit maps to (viewport height / VIEW_H) CSS pixels.
export const VIEW_H = 10;
export const FOV = 40;
export const CAM_Z = VIEW_H / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);

// How far the film gate is recessed behind the window rim. The gate is scaled
// up by GATE_SCALE so that, from the resting camera, it still projects onto the
// 2D layout exactly; moving the camera then reveals the real depth.
export const DEPTH = 2.2;
export const GATE_SCALE = (CAM_Z + DEPTH) / CAM_Z;

export function computeLayout(aspect) {
  const H = VIEW_H;
  const W = H * aspect;
  const u = Math.max(Math.min(aspect, 1), 0.55);
  const m = { side: 0.24 * u, bottom: 0.46 * u, top: 0.64 * u };
  const win = { l: -W / 2 + m.side, r: W / 2 - m.side, b: -H / 2 + m.bottom, t: H / 2 - m.top };
  const winW = win.r - win.l;
  const winH = win.t - win.b;
  const cx = (win.l + win.r) / 2;
  const cy = (win.t + win.b) / 2;
  // proportions of the reference collage: gate ≈ 43% of the window, 1.08:1
  const gh = Math.min(0.434 * winH, (0.46 * winW) / 1.08);
  const gw = gh * 1.08;
  const gate = { l: cx - gw / 2, r: cx + gw / 2, b: cy - gh / 2, t: cy + gh / 2 };
  return { W, H, u, m, win, winW, winH, gate, gw, gh, cx, cy, yTop: H / 2 - 0.2 * u, radius: 0.22 * u };
}

// Geometry of one sloped photo panel ("facet") between the window rim and the gate.
// axis 0: top/bottom facets (depth runs along y), axis 1: left/right (along x).
export function facetFrame(L, side) {
  const { win, gate } = L;
  let axis, gateEdge, winEdge, lat, box;
  if (side === 'top') {
    axis = 0; gateEdge = gate.t; winEdge = win.t;
    lat = [gate.l, gate.r, win.l, win.r];
    box = [win.l, gate.t, L.winW, win.t - gate.t];
  } else if (side === 'bottom') {
    axis = 0; gateEdge = gate.b; winEdge = win.b;
    lat = [gate.l, gate.r, win.l, win.r];
    box = [win.l, win.b, L.winW, gate.b - win.b];
  } else if (side === 'left') {
    axis = 1; gateEdge = gate.l; winEdge = win.l;
    lat = [gate.b, gate.t, win.b, win.t];
    box = [win.l, win.b, gate.l - win.l, L.winH];
  } else {
    axis = 1; gateEdge = gate.r; winEdge = win.r;
    lat = [gate.b, gate.t, win.b, win.t];
    box = [gate.r, win.b, win.r - gate.r, L.winH];
  }

  const pt = (along, l, inner) => {
    const [x, y] = axis === 0 ? [l, along] : [along, l];
    return inner ? new Vector3(x * GATE_SCALE, y * GATE_SCALE, -DEPTH) : new Vector3(x, y, 0);
  };
  const o0 = pt(winEdge, lat[2], false);
  const o1 = pt(winEdge, lat[3], false);
  const i0 = pt(gateEdge, lat[0], true);
  const i1 = pt(gateEdge, lat[1], true);

  return {
    side, axis, gateEdge, winEdge, lat, box,
    quad: [o0, o1, i1, i0],
    // screen order: top-left, top-right, bottom-right, bottom-left (for the CSS clip-path morph)
    poly: { top: [o0, o1, i1, i0], bottom: [i0, i1, o1, o0], left: [o1, i1, i0, o0], right: [i1, o1, o0, i0] }[side],
    midW: (lat[3] - lat[2] + (lat[1] - lat[0])) / 2,
    depth: Math.abs(winEdge - gateEdge),
  };
}

const clamp = (x, a, b) => Math.min(Math.max(x, a), b);

// How a photo is fitted into a facet. Panorama panels are mapped trapezoid to
// trapezoid (exactly like the collage at its native aspect), cropping instead of
// squashing when the screen shape differs. Plain photos are cover-fitted.
export function fitPhoto(photo, f, image) {
  if (photo.mode === 'panel' && photo.anchor === 'outer') {
    // Uniform scale, no shear (keeps trees upright): the panel is pinned to the
    // source's outer row and made as large as fits inside the clean region.
    const q = photo.quad;
    const So = (q.outer.r - q.outer.l) * image.width;
    const Si = (q.inner.r - q.inner.l) * image.width;
    const Hs = Math.abs(q.outer.v - q.inner.v) * image.height;
    const m = (So - Si) / (2 * Hs);
    const Wo = f.lat[3] - f.lat[2];
    const Wi = f.lat[1] - f.lat[0];
    const h = f.depth;
    const sigma = Math.min(So / Wo, Hs / h, So / (Wi + 2 * m * h)) * 0.995; // source px per layout unit
    const slack = Math.max(0, Math.min((So - sigma * Wo) / 2, (So - 2 * m * sigma * h - sigma * Wi) / 2));
    const centre = ((q.outer.l + q.outer.r) / 2) * image.width + clamp((photo.focus.s - 0.5) * So, -slack, slack);
    return {
      mode: 2,
      crop: [1, 0, 1, 0.5],
      rect: [1, 1, 0, 0],
      sim: [centre / image.width, sigma / image.width, (Math.sign(q.inner.v - q.outer.v) * sigma) / image.height, q.outer.v],
      simC: (f.lat[2] + f.lat[3]) / 2,
    };
  }
  if (photo.mode === 'panel') {
    const q = photo.quad;
    const srcMidW = ((q.outer.r - q.outer.l + (q.inner.r - q.inner.l)) / 2) * image.width;
    const srcH = Math.abs(q.outer.v - q.inner.v) * image.height;
    const Rs = srcMidW / srcH;
    const Rf = f.midW / f.depth;
    let k = 1, ta = 0, tb = 1;
    if (Rf < Rs) {
      k = Rf / Rs;
    } else {
      const c = Math.max(Rs / Rf, 0.55);
      ta = clamp(photo.focus.t - c / 2, 0, 1 - c);
      tb = ta + c;
    }
    const sc = clamp(photo.focus.s, k / 2, 1 - k / 2);
    return { mode: 0, crop: [k, ta, tb, sc], rect: [1, 1, 0, 0] };
  }
  const [, , bw, bh] = f.box;
  const Af = bw / bh;
  const Ai = image.width / image.height;
  let rect;
  if (Af > Ai) {
    const fy = Ai / Af;
    rect = [1, fy, 0, clamp(photo.focus.y - fy / 2, 0, 1 - fy)];
  } else {
    const fx = Af / Ai;
    rect = [fx, 1, clamp(photo.focus.x - fx / 2, 0, 1 - fx), 0];
  }
  return { mode: 1, crop: [1, 0, 1, 0.5], rect };
}

// Where the lens sits in world space (the gate group is scaled by GATE_SCALE).
// S is the gate's local size unit (its height); lens parts are laid out in S.
export const LENS = { z: -0.2, r: 0.165, tunnel: 1.6, stop: 0.6 };
export function lensWorld(L) {
  const k = GATE_SCALE;
  const S = L.gh;
  return {
    x: L.cx * k,
    y: L.cy * k,
    z: -DEPTH + LENS.z * S * k,
    r: LENS.r * S * k,
    end: -DEPTH + (LENS.z - LENS.tunnel) * S * k,
    stop: -DEPTH + (LENS.z - LENS.tunnel * LENS.stop) * S * k, // where the camera comes to rest
    unit: S * k,
  };
}

// Scroll timeline (fractions of the dive section).
export const TIMELINE = {
  fly: [0.012, 0.23], // all four photos leave together...
  dive: [0.012, 0.66], // ...while the camera zooms into the lens and out of the far end
  iris: [0.22, 0.35], // blades open all the way
  space: [0.66, 1], // coasting out into the stars
};
