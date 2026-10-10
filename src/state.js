import { useSyncExternalStore } from 'react';

// React-facing state: only what the DOM layer re-renders on.
let state = { ready: false, progress: 0 };
const subs = new Set();

export function setState(patch) {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
}

const subscribe = (f) => {
  subs.add(f);
  return () => subs.delete(f);
};

export const useAppState = (select) => useSyncExternalStore(subscribe, () => select(state));

// Per-frame signals, read inside useFrame without re-rendering React.
//   scroll: raw progress through the dive section (0..1)
//   p:      the same, smoothed every frame — everything animates off this
export const anim = {
  introAt: -1,
  scroll: 0,
  p: 0,
  reduced: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
};

export const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
export const range = (x, a, b) => clamp01((x - a) / (b - a));
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeIn = (x) => x * x * x;
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);

