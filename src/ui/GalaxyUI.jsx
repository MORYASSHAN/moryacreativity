import { useRef, useState } from 'react';
import { useAppState } from '../state.js';
import { G, ITEMS, openItem, pick } from '../galaxy.js';

// Input layer + the single label for the project field in the galaxy. It only
// catches the pointer once the dive has arrived; vertical swipes still scroll
// (back up through the lens), horizontal drags turn the view on touch screens.
export default function GalaxyUI() {
  const galaxy = useAppState((s) => s.galaxy);
  const hot = useAppState((s) => s.hot ?? -1);
  const [shown, setShown] = useState(-1);
  const drag = useRef(null);
  // keep the last project in the label so it can fade out with its text intact
  if (hot >= 0 && hot !== shown) setShown(hot);

  const point = (e) => {
    G.pointer.x = (e.clientX / innerWidth) * 2 - 1;
    G.pointer.y = (e.clientY / innerHeight) * 2 - 1;
    G.pointer.inside = true;
    G.pointer.mouse = e.pointerType === 'mouse';
  };

  const onPointerMove = (e) => {
    point(e);
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const now = performance.now();
    d.moved += Math.abs(dx) + Math.abs(e.clientY - d.y0);
    d.x = e.clientX;
    const turn = -dx * 0.16;
    G.yaw += turn;
    G.vYaw = turn / Math.max((now - d.t) / 1000, 0.008);
    d.t = now;
    G.touchedAt = now;
  };

  const onPointerDown = (e) => {
    point(e);
    if (e.pointerType === 'mouse') return;
    G.touchedAt = performance.now();
    drag.current = { x: e.clientX, y0: e.clientY, moved: 0, t: performance.now() };
    G.pointer.dragging = true;
    G.vYaw = 0;
  };

  const endDrag = () => {
    drag.current = null;
    G.pointer.dragging = false;
  };

  const onPointerUp = (e) => {
    if (e.pointerType === 'mouse') return;
    const d = drag.current;
    endDrag();
    G.touchedAt = performance.now();
    if (!d || d.moved > 10) return;
    // tap: first tap selects a card, a second tap on the same card opens it
    const card = pick(e.clientX, e.clientY);
    if (card >= 0 && card === G.hotCard) openItem(G.cards[card].item);
    else G.hotCard = card;
  };

  const onClick = (e) => {
    // taps are handled on pointerup (some browsers report taps as plain mouse clicks)
    if ((e.pointerType && e.pointerType !== 'mouse') || performance.now() - G.touchedAt < 700) return;
    if (G.hotCard >= 0) openItem(G.cards[G.hotCard].item);
  };

  const it = ITEMS[shown];
  return (
    <>
      <div
        className={`galaxy-layer ${galaxy ? 'is-on' : ''} ${hot >= 0 ? 'is-hot' : ''}`}
        aria-hidden="true"
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={endDrag}
        onPointerLeave={() => { G.pointer.inside = false; }}
        onClick={onClick}
      />
      <div className={`g-label ${galaxy && hot >= 0 ? 'is-on' : ''}`} aria-hidden={!(galaxy && hot >= 0)}>
        {it && (
          <a href={it.href} target={it.live ? '_blank' : undefined} rel={it.live ? 'noopener' : undefined} tabIndex={-1}>
            <span className="g-kind">{it.live ? 'Live website' : 'Landing page'}</span>
            <span className="g-title">{it.title}</span>
            <span className="g-open">{it.live ? 'Visit ↗' : 'Enter →'}</span>
          </a>
        )}
      </div>
      {galaxy && (
        <nav className="g-nav" aria-label="Projects">
          {ITEMS.map((x) => (
            <a key={x.slug} href={x.href} target={x.live ? '_blank' : undefined} rel={x.live ? 'noopener' : undefined}>
              {x.title}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
