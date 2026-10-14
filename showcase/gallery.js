// The home page: an intro gate, a welcome lockup, then an endless field of
// project cards floating in the dark that you travel through by scrolling.
import { PROJECTS, pageUrl } from './projects.js';
import { $, chrome, buildPanels, sound, cursor, reduced, coarse, go, resumeSound } from './common.js';

chrome();
const panels = buildPanels();

const gate = $('#gate');
const welcome = $('#welcome');
const world = $('#world');
const scene = $('#scene');
const hub = $('#hub');
const hint = $('#hint');
const info = $('#info');

let entered = false;
let returning = false;
try { returning = location.hash === '#gallery' || sessionStorage.getItem('shaan-entered') === '1'; } catch { /* no storage */ }

/* ------------------------------------------------------------------ gate */
const stairWords = ['Click', 'anywhere', 'to', 'turn', 'on', 'your', 'sound'];
const stair = $('.stair', gate);
stairWords.forEach((w, i) => {
  const s = document.createElement('span');
  const t = i / (stairWords.length - 1);
  s.textContent = w;
  s.style.left = `${t * 78 + (i % 2 ? 2 : 0)}%`;
  s.style.top = `${t * 126}px`; // one clear step per word, so neighbours never overlap
  s.style.animationDelay = `${0.25 + i * 0.16}s`;
  stair.append(s);
});

function enter(withSound) {
  if (entered) return;
  entered = true;
  try { sessionStorage.setItem('shaan-entered', '1'); } catch { /* no storage */ }
  if (withSound) sound.set(true);
  gate.classList.add('gone');
  document.body.classList.add('locked');

  if (returning || reduced) {
    startWorld(returning ? 30 : 0);
    return;
  }
  // welcome words appear in a shuffled order, then dissolve into the gallery
  const ws = [...welcome.querySelectorAll('.w')];
  const order = ws.map((_, i) => i).sort(() => Math.random() - 0.5);
  order.forEach((idx, k) => setTimeout(() => ws[idx].classList.add('on'), 500 + k * 120));
  setTimeout(() => welcome.classList.add('fade'), 3900);
  setTimeout(() => startWorld(95), 4300);
}

gate.addEventListener('click', (e) => { if (e.target.id !== 'skip') enter(true); });
gate.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(true); } });
$('#skip').addEventListener('click', () => enter(false));


/* ------------------------------------------------------------------ cards */
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const R = rng(11);
const DEPTH = 7200; // length of the looping tunnel
const NEAR = 520; // how close a card gets before it wraps to the back
const FOCUS = -260; // the sharp plane
const COUNT = coarse ? 24 : 38;
const ASPECTS = [16 / 10, 4 / 3, 3 / 4, 1, 16 / 9, 4 / 5, 3 / 2];

const cards = [];
for (let i = 0; i < COUNT; i++) {
  const p = PROJECTS[i % PROJECTS.length];
  const a = ASPECTS[Math.floor(R() * ASPECTS.length)];
  let nx = R() * 2 - 1;
  let ny = R() * 2 - 1;
  // keep the middle a little clearer, that's where the titles appear
  if (Math.abs(nx) < 0.28 && Math.abs(ny) < 0.3) nx = Math.sign(nx || 1) * (0.3 + R() * 0.25);
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.slug = p.slug;
  el.dataset.cursor = 'View';
  const img = document.createElement('div');
  img.className = 'img';
  img.style.backgroundImage = `url(${p.cover})`;
  img.style.backgroundPosition = `${30 + R() * 40}% ${20 + R() * 40}%`;
  el.append(img);
  scene.append(el);
  cards.push({
    el, p, idx: PROJECTS.indexOf(p),
    nx, ny, a,
    nw: 0.8 + R() * 0.75,
    z: -(i / COUNT) * DEPTH - R() * 120,
    blur: -1, op: -1,
  });
}

let S = 1, spreadX = 600, spreadY = 400;
function layout() {
  S = Math.max(0.55, Math.min(innerWidth / 1440, innerHeight / 860, 1.25));
  spreadX = innerWidth * 0.62;
  spreadY = innerHeight * 0.58;
  for (const c of cards) {
    const w = 200 * c.nw * S * (coarse ? 0.85 : 1);
    c.w = w;
    c.h = w / c.a;
    c.el.style.width = `${c.w}px`;
    c.el.style.height = `${c.h}px`;
  }
}
layout();
addEventListener('resize', layout);

/* ------------------------------------------------------------------ camera & input */
const cam = { z: 0, x: 0, y: 0, tx: 0, ty: 0, vel: 0 };
const look = { x: 0, y: 0, tx: 0, ty: 0 };
let running = false;
let hot = null;
let clearTimer = 0;

function startWorld(boost) {
  document.body.classList.remove('pre');
  world.classList.add('on');
  hub.classList.add('on');
  hint.classList.add('on');
  cam.vel = reduced ? 0 : boost;
  if (!running) { running = true; requestAnimationFrame(frame); }
}

addEventListener('wheel', (e) => {
  if (!entered || panels.isOpen) return;
  const d = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
  cam.vel = Math.max(-140, Math.min(140, cam.vel + d * 0.09));
}, { passive: true });

addEventListener('keydown', (e) => {
  if (!entered || panels.isOpen) return;
  if (e.key === 'ArrowDown' || e.key === 'PageDown') cam.vel += 26;
  if (e.key === 'ArrowUp' || e.key === 'PageUp') cam.vel -= 26;
});

addEventListener('pointermove', (e) => {
  look.tx = (e.clientX / innerWidth) * 2 - 1;
  look.ty = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });

let drag = null;
world.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY, moved: 0, type: e.pointerType, t: performance.now() };
});
addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  drag.x = e.clientX;
  drag.y = e.clientY;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  if (drag.type === 'touch') {
    cam.vel = Math.max(-140, Math.min(140, cam.vel - dy * 0.9));
    cam.tx -= dx * 1.3;
  } else {
    cam.tx -= dx * 1.4;
    cam.ty -= dy * 1.4;
  }
  cam.tx = Math.max(-spreadX * 0.7, Math.min(spreadX * 0.7, cam.tx));
  cam.ty = Math.max(-spreadY * 0.7, Math.min(spreadY * 0.7, cam.ty));
}, { passive: true });
addEventListener('pointerup', (e) => {
  if (!drag) return;
  const wasTap = drag.moved < 8;
  const type = drag.type;
  drag = null;
  if (!wasTap) return;
  const card = e.target.closest?.('.card');
  if (!card) { if (type === 'touch') clearHot(); return; }
  const c = cards.find((k) => k.el === card);
  if (type === 'touch' && hot !== c) { setHot(c); return; }
  go(`work.html?p=${c.p.slug}`);
});

/* ------------------------------------------------------------------ hover info */
const kind = $('#info-kind');
const title = $('#info-title');
const line = $('#info-line');
const more = $('#info-more');
const open = $('#info-open');

function setHot(c) {
  clearTimeout(clearTimer);
  if (hot === c) return;
  hot?.el.classList.remove('hot');
  hot = c;
  c.el.classList.add('hot');
  world.classList.add('has-hover');
  const p = c.p;
  kind.textContent = p.kind === 'live' ? `Live website · ${p.year}` : `Concept landing page · ${p.year}`;
  title.innerHTML = [...p.title].map((ch) => (ch === ' ' ? ' ' : `<span class="ch">${ch}</span>`)).join('');
  [...title.children].forEach((s) => { s.style.transitionDelay = `${Math.random() * 0.45}s`; });
  line.textContent = p.line;
  more.href = `work.html?p=${p.slug}`;
  open.href = pageUrl(p);
  if (p.kind === 'live') {
    open.textContent = 'Visit live ↗';
    open.target = '_blank';
    open.removeAttribute('data-nav');
  } else {
    open.textContent = 'Open concept ↗';
    open.removeAttribute('target');
    open.setAttribute('data-nav', '');
  }
  info.classList.remove('on');
  void info.offsetWidth;
  info.classList.add('on');
  sound.ping(c.idx);
}

function clearHot() {
  if (!hot) return;
  hot.el.classList.remove('hot');
  hot = null;
  world.classList.remove('has-hover');
  info.classList.remove('on');
}

world.addEventListener('pointerover', (e) => {
  if (e.pointerType === 'touch') return;
  const card = e.target.closest('.card');
  if (card) setHot(cards.find((k) => k.el === card));
});
world.addEventListener('pointerout', (e) => {
  if (e.pointerType === 'touch') return;
  const card = e.target.closest('.card');
  if (!card || card.contains(e.relatedTarget)) return;
  clearTimeout(clearTimer);
  clearTimer = setTimeout(clearHot, 900);
});
$('.acts', info).addEventListener('pointerenter', () => clearTimeout(clearTimer));
$('.acts', info).addEventListener('pointerleave', () => { clearTimer = setTimeout(clearHot, 500); });

panels.onChange.add((isOpen) => { if (isOpen) clearHot(); cursor.reset(); });

/* ------------------------------------------------------------------ frame loop */
const countNow = $('#count-now');
$('#count-all').textContent = String(PROJECTS.length).padStart(2, '0');
let shown = -1;
let last = performance.now();
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

function frame(now) {
  const dt = Math.min((now - last) / 16.67, 3);
  last = now;

  const drift = reduced ? 0 : hot ? 0.12 : 0.9;
  cam.vel *= Math.pow(hot ? 0.86 : 0.93, dt);
  cam.z += (drift + cam.vel) * dt;
  cam.x += (cam.tx - cam.x) * 0.06 * dt;
  cam.y += (cam.ty - cam.y) * 0.06 * dt;
  look.x += (look.tx - look.x) * 0.04 * dt;
  look.y += (look.ty - look.y) * 0.04 * dt;

  const lx = reduced ? 0 : look.x;
  const ly = reduced ? 0 : look.y;
  scene.style.transform = `rotateY(${lx * 5}deg) rotateX(${-ly * 4}deg)`;

  let best = null, bestD = Infinity;
  for (const c of cards) {
    let zr = (((c.z + cam.z) % DEPTH) + DEPTH) % DEPTH;
    zr = zr - DEPTH + NEAR;
    const x = c.nx * spreadX - cam.x - lx * 70;
    const y = c.ny * spreadY - cam.y - ly * 50;
    c.el.style.transform = `translate3d(${x - c.w / 2}px, ${y - c.h / 2}px, ${zr}px)`;

    const far = clamp01((zr + DEPTH - NEAR) / 2200);
    const near = clamp01((NEAR - zr) / 380);
    const op = Math.round(Math.min(far, near) * 20) / 20;
    const dist = zr - FOCUS;
    const blurAmt = dist < 0 ? clamp01((-dist - 650) / 1700) * 7 : clamp01((dist - 260) / 420) * 6;
    const blur = Math.round(blurAmt * 2) / 2;
    const bright = Math.round((1 - clamp01((-zr - 900) / 4200) * 0.65) * 20) / 20;
    if (op !== c.op) { c.el.style.opacity = op; c.op = op; }
    const key = blur * 100 + bright;
    if (key !== c.blur) {
      c.el.style.filter = blur || bright < 1 ? `blur(${blur}px) brightness(${bright})` : 'none';
      c.blur = key;
    }
    const d = Math.abs(dist) + Math.hypot(x, y) * 0.6;
    if (op > 0.5 && d < bestD) { bestD = d; best = c; }
  }

  const idx = hot ? hot.idx : best ? best.idx : 0;
  if (idx !== shown) { shown = idx; countNow.textContent = String(idx + 1).padStart(2, '0'); }

  if (!document.hidden) requestAnimationFrame(frame);
  else running = false;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && entered && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
});

// coming back from a case study skips the intro
if (returning) {
  gate.style.display = 'none';
  resumeSound();
  enter(false);
}
