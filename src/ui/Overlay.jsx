import { useEffect, useState } from 'react';
import { anim, useAppState } from '../state.js';
import GalaxyUI from './GalaxyUI.jsx';
import Intro from './Intro.jsx';
import { sound } from '../sound.js';

// Music on / off, bottom right, once the visitor is in.
function SoundToggle() {
  const entered = useAppState((s) => s.entered);
  const [on, setOn] = useState(sound.on);
  useEffect(() => sound.subscribe(setOn), []);
  return (
    <button
      type="button"
      className={`sound-toggle ${entered ? 'is-on' : ''} ${on ? 'is-playing' : ''}`}
      aria-label={on ? 'Turn music off' : 'Turn music on'}
      aria-pressed={on}
      tabIndex={entered ? 0 : -1}
      onClick={() => sound.toggle()}
    >
      <span className="bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}

// Fixed layer above the canvas. Scroll position through #dive drives the scene.
export default function Overlay() {
  const ready = useAppState((s) => s.entered);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const section = document.getElementById('dive');
    const born = performance.now();
    const update = () => {
      const r = section.getBoundingClientRect();
      const total = r.height - innerHeight;
      anim.scroll = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 0;
      // a reload or Back restores the scroll position: start there instead of
      // replaying the dive from the top
      if (performance.now() - born < 1000) anim.p = anim.scroll;
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
      <Intro />
      <SoundToggle />
      <GalaxyUI />
      <div className={`scroll-cue ${ready && !scrolled ? 'is-on' : ''}`} aria-hidden="true">
        <i />
      </div>
    </div>
  );
}
