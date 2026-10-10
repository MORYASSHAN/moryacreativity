import { useEffect, useState } from 'react';
import { anim, useAppState } from '../state.js';

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
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => {
      removeEventListener('scroll', update);
      removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="overlay">
      <Loader />
      <div className={`scroll-cue ${ready && !scrolled ? 'is-on' : ''}`} aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </div>
  );
}
