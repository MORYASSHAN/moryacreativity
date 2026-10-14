import { useEffect, useState } from 'react';
import { setState, useAppState } from '../state.js';
import { sound } from '../sound.js';
import { ITEMS } from '../galaxy.js';

const WORDS = ['Feel', 'the', 'creativity'];
const SEEN = 'mc-entered'; // this session already came through the intro
const seen = () => { try { return sessionStorage.getItem(SEEN) === '1'; } catch { return false; } };

// Fetch the landing pages ahead of time so opening one from the galaxy is instant.
function prefetchPages() {
  const run = () =>
    ITEMS.filter((it) => !it.live).forEach((it) => {
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = it.href;
      document.head.append(l);
    });
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1500);
}

// The opening screen. Everything (camera photos, the project textures, their
// shaders) loads and warms up behind it, so the dive never stutters; a click
// anywhere enters with music, "Enter without sound" enters silently.
export default function Intro() {
  const ready = useAppState((s) => s.ready && s.cardsReady);
  // camera photos first, then the project textures
  const progress = useAppState((s) => s.progress * 0.5 + s.cardProgress * 0.5);
  const [entered, setEntered] = useState(seen);
  const [want, setWant] = useState(null); // clicked before loading finished: true = with sound
  const [gone, setGone] = useState(entered);

  const enter = (withSound) => {
    if (entered) return;
    if (withSound) sound.set(true);
    if (!ready) return setWant(withSound);
    try { sessionStorage.setItem(SEEN, '1'); } catch { /* no storage */ }
    setEntered(true);
  };

  // never hold the visitor back for long, even if something fails to load
  useEffect(() => {
    const t = setTimeout(() => setState({ ready: true, cardsReady: true }), 15000);
    return () => clearTimeout(t);
  }, []);

  // a click made while loading counts as soon as everything is in
  useEffect(() => {
    if (ready && want !== null && !entered) enter(want);
  });

  useEffect(() => {
    if (!entered) return;
    setState({ entered: true });
    prefetchPages();
    const t = setTimeout(() => setGone(true), 1600);
    return () => clearTimeout(t);
  }, [entered]);

  // the page can't scroll while the intro is up
  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', !entered);
  }, [entered]);

  // coming back from a landing page with music on: the first touch restarts it
  useEffect(() => {
    if (!seen() || !sound.wanted()) return;
    const resume = () => sound.set(true);
    addEventListener('pointerdown', resume, { once: true });
    addEventListener('keydown', resume, { once: true });
    return () => {
      removeEventListener('pointerdown', resume);
      removeEventListener('keydown', resume);
    };
  }, []);

  if (gone) return null;
  const pct = Math.round(Math.min(progress, ready ? 1 : 0.98) * 100);
  return (
    <div
      className={`intro ${entered ? 'is-gone' : ''} ${ready ? 'is-ready' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Enter the site with sound"
      onClick={() => enter(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          enter(true);
        }
      }}
    >
      <span className="intro-brand">moryacreativity</span>
      <h2 className="intro-title" aria-label={WORDS.join(' ')}>
        {WORDS.map((w, i) => (
          <span key={w} style={{ animationDelay: `${0.35 + i * 0.28}s` }}>
            {w}
          </span>
        ))}
      </h2>
      <div className="intro-load" aria-hidden="true">
        <span className="intro-bar">
          <span style={{ transform: `scaleX(${Math.max(pct / 100, 0.03)})` }} />
        </span>
        <span className="intro-pct">{ready ? 'Ready' : `Loading ${pct}%`}</span>
      </div>
      <p className="intro-cta">
        {want !== null && !ready ? 'Almost there…' : 'Click anywhere to enter — with sound'}
      </p>
      <button
        type="button"
        className="intro-skip"
        onClick={(e) => {
          e.stopPropagation();
          enter(false);
        }}
      >
        Enter without sound
      </button>
    </div>
  );
}
