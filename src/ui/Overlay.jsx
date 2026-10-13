import { useEffect, useState } from 'react';
import { anim, useAppState } from '../state.js';
import GalaxyUI from './GalaxyUI.jsx';

function Loader() {
  const ready = useAppState((s) => s.ready);
  const progress = useAppState((s) => s.progress);
  return (
    <div className={`loader ${ready ? 'is-done' : ''}`} aria-hidden={ready}>
      <span className="loader-bar">
        <span style={{ transform: `scaleX(${Math.max(progress, 0.04)})` }} />
      </span>
    </div>
  );
}

// Fixed layer above the canvas. Scroll position through #dive drives the scene.
export default function Overlay() {
  const ready = useAppState((s) => s.ready);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const section = document.getElementById('dive');
    const update = () => {
      const r = section.getBoundingClientRect();
      const total = r.height - innerHeight;
      anim.scroll = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 0;
      setScrolled(anim.scroll > 0.01);
    };
    update();
    // /#galaxy (the way back from a project page) skips the dive and lands among the projects
    const land = () => {
      if (location.hash !== '#galaxy') return;
      history.scrollRestoration = 'manual';
      const go = () => {
        scrollTo(0, document.documentElement.scrollHeight);
        update();
        anim.p = anim.scroll;
      };
      go();
      requestAnimationFrame(go);
    };
    land();
    addEventListener('hashchange', land);
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => {
      removeEventListener('hashchange', land);
      removeEventListener('scroll', update);
      removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="overlay">
      <Loader />
      <GalaxyUI />
      <div className={`scroll-cue ${ready && !scrolled ? 'is-on' : ''}`} aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </div>
  );
}
