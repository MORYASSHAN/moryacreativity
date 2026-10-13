/* FUSE — concept landing page. Mascot, cans, rays and confetti are all original vector/canvas drawings. */
(() => {
'use strict';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const C = { sky: '#5ab8f5', violet: '#6b5cf0', pink: '#ff5fae', lime: '#e8ff4a', cyan: '#8ff3ff', ink: '#121018' };
const NS = 'http://www.w3.org/2000/svg';
const BOLT = '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M14 1 2 18h8l-3 13L22 12h-8z"/></svg>';

const hero = $('#hero'), shakeEl = $('#shake');

/* ---------------------------------------------------------------- */
/* 1. Radial lightning-ray tunnel                                    */
/* ---------------------------------------------------------------- */
const rays = $('#rays');
(function buildRays() {
  const N = 15, L = 720, cols = [C.pink, C.lime, C.cyan];
  let g = '';
  for (let i = 0; i < N; i++) {
    // a zig-zag wedge: narrow at the centre, kinked halfway like a bolt
    const pts = [[0, 0], [-.035, -.46], [.012, -.445], [-.02, -1], [.09, -1], [.048, -.5], [.085, -.515]]
      .map(([x, y]) => `${(x * L).toFixed(1)},${(y * L).toFixed(1)}`).join(' ');
    g += `<polygon points="${pts}" transform="rotate(${(i * 360 / N).toFixed(2)})" fill="${cols[i % 3]}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  }
  rays.innerHTML = `<svg viewBox="-720 -720 1440 1440" aria-hidden="true"><g>${g}</g><circle r="40" fill="${C.sky}"/></svg>`;
})();

/* starburst behind mascot */
function starPts(cx, cy, n, r1, r2, sx = 1, jitter = 0) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = i / (n * 2) * Math.PI * 2 - Math.PI / 2;
    const r = (i % 2 ? r2 : r1) * (1 + (i % 2 ? 0 : Math.sin(i * 7.3) * jitter));
    p.push(`${(cx + Math.cos(a) * r * sx).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return p.join(' ');
}
$('#star').setAttribute('points', starPts(300, 300, 14, 222, 150, 1, .06));
$('#kaboomStar').setAttribute('points', starPts(300, 200, 16, 190, 118, 1.45, .12));

/* ---------------------------------------------------------------- */
/* 2. Mascot "Kaboo" — original bomb-headed character                 */
/* ---------------------------------------------------------------- */
const mascot = $('#mascot');
const FUSE_D = 'M206 92 C 214 52, 256 50, 262 20 S 300 -8, 312 -6';
mascot.innerHTML = `
<ellipse cx="200" cy="548" rx="128" ry="14" fill="${C.ink}" opacity=".25"/>
<g class="kb">
  <!-- legs + socks -->
  <path d="M172 448 Q166 478 160 508" stroke="${C.ink}" stroke-width="24" fill="none" stroke-linecap="round"/>
  <path d="M228 448 Q236 478 242 508" stroke="${C.ink}" stroke-width="24" fill="none" stroke-linecap="round"/>
  <path d="M172 452 Q166 478 160 506" stroke="#fff" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M228 452 Q236 478 242 506" stroke="#fff" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M157 486 l16 2 M156 494 l16 2 M229 488 l16 -2 M230 496 l16 -2" stroke="${C.pink}" stroke-width="4.5" stroke-linecap="round"/>
  <!-- sneakers -->
  <path d="M104 530 Q102 500 136 496 L168 494 Q188 494 188 514 L188 530 Z" fill="#fff" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M102 520 H190 V532 Q190 540 182 540 H110 Q102 540 102 532 Z" fill="${C.pink}" stroke="${C.ink}" stroke-width="5.5" stroke-linejoin="round"/>
  <path d="M150 500 l10 10 M160 498 l10 10" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
  <path d="M296 530 Q298 500 264 496 L232 494 Q212 494 212 514 L212 530 Z" fill="#fff" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M298 520 H210 V532 Q210 540 218 540 H290 Q298 540 298 532 Z" fill="${C.pink}" stroke="${C.ink}" stroke-width="5.5" stroke-linejoin="round"/>
  <path d="M250 500 l-10 10 M240 498 l-10 10" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
  <!-- shorts -->
  <path d="M146 408 L254 408 L266 462 L212 462 L200 438 L188 462 L134 462 Z" fill="${C.violet}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M160 430 l18 -4 M222 426 l18 4" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round" opacity=".5"/>
  <!-- right arm on hip -->
  <path d="M258 372 Q312 384 304 416 Q300 432 280 432" stroke="${C.ink}" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M258 372 Q312 384 304 416 Q300 432 280 432" stroke="${C.lime}" stroke-width="19" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="276" cy="430" r="17" fill="#fff" stroke="${C.ink}" stroke-width="6"/>
  <!-- torso: bomber jacket -->
  <path d="M148 350 Q200 336 252 350 L264 418 Q200 432 136 418 Z" fill="${C.lime}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M138 414 Q200 428 262 414" stroke="${C.ink}" stroke-width="20" fill="none" stroke-linecap="round"/>
  <path d="M138 414 Q200 428 262 414" stroke="${C.pink}" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M200 350 V420" stroke="${C.ink}" stroke-width="4"/>
  <path d="M168 376 l-8 14 h8 l-4 12 l14 -18 h-8 l4 -8 z" fill="${C.pink}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- raised arm with can -->
  <g class="arm-up">
    <path d="M156 370 Q62 372 40 300" stroke="${C.ink}" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M156 370 Q62 372 40 300" stroke="${C.lime}" stroke-width="19" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M52 330 l-22 -4" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round" opacity=".5"/>
    <g transform="translate(36 244) rotate(-14)">
      <rect x="-22" y="-48" width="44" height="80" rx="9" fill="${C.cyan}" stroke="${C.ink}" stroke-width="5"/>
      <path d="M-22 -36 h44" stroke="${C.ink}" stroke-width="4"/>
      <path d="M4 -28 l-14 24 h10 l-6 20 l18 -28 h-10 l6 -16 z" fill="${C.pink}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="-15" y="-30" width="6" height="52" rx="3" fill="#fff" opacity=".6"/>
    </g>
    <circle cx="40" cy="286" r="19" fill="#fff" stroke="${C.ink}" stroke-width="6"/>
    <path d="M26 278 q8 -6 16 0" stroke="${C.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  </g>
  <!-- head (bomb) -->
  <g class="head">
    <path id="fuseOutline" d="${FUSE_D}" stroke="${C.ink}" stroke-width="17" fill="none" stroke-linecap="round"/>
    <path id="fuseCord" d="${FUSE_D}" stroke="#e7b46a" stroke-width="8" fill="none" stroke-linecap="round"/>
    <g transform="rotate(-8 200 92)">
      <rect x="170" y="74" width="60" height="36" rx="8" fill="#3d3758" stroke="${C.ink}" stroke-width="7"/>
      <path d="M180 84 v18 M220 84 v18" stroke="#6a6290" stroke-width="5" stroke-linecap="round"/>
    </g>
    <circle cx="200" cy="222" r="128" fill="#25203c" stroke="${C.ink}" stroke-width="7"/>
    <path d="M300 160 A128 128 0 0 1 220 346 A150 150 0 0 0 300 160z" fill="#1a1630" opacity=".9"/>
    <path d="M100 186 Q112 128 168 108" stroke="#fff" stroke-width="15" fill="none" stroke-linecap="round" opacity=".95"/>
    <circle cx="96" cy="216" r="8" fill="#fff"/>
    <!-- brows -->
    <path d="M118 150 Q146 128 178 146" stroke="${C.ink}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M222 146 Q254 128 282 150" stroke="${C.ink}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <!-- eyes -->
    <ellipse class="eye-white" cx="156" cy="206" rx="35" ry="41" fill="#fff" stroke="${C.ink}" stroke-width="6"/>
    <ellipse class="eye-white" cx="244" cy="206" rx="35" ry="41" fill="#fff" stroke="${C.ink}" stroke-width="6"/>
    <g id="pupils">
      <circle cx="156" cy="210" r="16" fill="${C.ink}"/><circle cx="244" cy="210" r="16" fill="${C.ink}"/>
      <circle cx="162" cy="203" r="5.5" fill="#fff"/><circle cx="250" cy="203" r="5.5" fill="#fff"/>
    </g>
    <ellipse cx="118" cy="262" rx="20" ry="11" fill="${C.pink}" opacity=".95"/>
    <ellipse cx="282" cy="262" rx="20" ry="11" fill="${C.pink}" opacity=".95"/>
    <!-- grin -->
    <g class="mouth-grin">
      <path d="M156 268 Q200 330 244 268 Z" fill="#5d0b2b" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M176 271 h48 v9 q-24 5 -48 0 z" fill="#fff"/>
      <ellipse cx="206" cy="298" rx="16" ry="8" fill="${C.pink}"/>
    </g>
    <g class="mouth-o"><ellipse cx="200" cy="290" rx="19" ry="25" fill="#5d0b2b" stroke="${C.ink}" stroke-width="6"/></g>
    <path class="sweat" d="M318 170 q14 22 0 30 q-14 -8 0 -30z" fill="${C.cyan}" stroke="${C.ink}" stroke-width="4"/>
    <!-- spark -->
    <g id="spark" transform="translate(312 -6)">
      <circle r="26" fill="${C.lime}" opacity=".35"/>
      <g class="spark-rays">${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${(Math.cos(a) * 20).toFixed(1)}" y1="${(Math.sin(a) * 20).toFixed(1)}" x2="${(Math.cos(a) * 40).toFixed(1)}" y2="${(Math.sin(a) * 40).toFixed(1)}"/>`; }).join('')}</g>
      <polygon class="spark-core" points="${starPts(0, 0, 6, 22, 9)}" fill="#ffe14a" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <circle r="6" fill="#fff"/>
    </g>
  </g>
</g>`;
const fuseCord = $('#fuseCord'), fuseOutline = $('#fuseOutline'), spark = $('#spark'), pupils = $('#pupils');
const FUSE_LEN = fuseCord.getTotalLength();
let fuseLeft = FUSE_LEN;
function setFuse(len) {
  fuseLeft = clamp(len, 0, FUSE_LEN);
  const da = `${fuseLeft} ${FUSE_LEN + 20}`;
  fuseCord.style.strokeDasharray = da; fuseOutline.style.strokeDasharray = da;
  const p = fuseCord.getPointAtLength(fuseLeft);
  spark.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
  spark.style.opacity = fuseLeft <= 0.5 ? 0 : 1;
}
setFuse(FUSE_LEN);

/* pupils follow the pointer */
let pupilT = { x: 0, y: 0 }, pupilC = { x: 0, y: 0 };
addEventListener('pointermove', e => {
  const r = mascot.getBoundingClientRect();
  const cx = r.left + r.width * .5, cy = r.top + r.height * .37;
  const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, d / 300);
  pupilT = { x: dx / d * 13 * k, y: dy / d * 16 * k };
}, { passive: true });

/* ---------------------------------------------------------------- */
/* 3. Paper planes on curved paths                                    */
/* ---------------------------------------------------------------- */
const planesEl = $('#planes');
const PLANE = `<svg viewBox="0 0 74 52"><path d="M2 26 L72 4 L40 48 L32 32 Z" fill="#fff" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"/><path d="M72 4 L32 32 L28 46 L40 36" fill="#dfe8ff" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"/><path d="M-14 22 h10 M-20 30 h12 M-10 38 h8" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;
const PLANES = [
  { p: [[-.1, .3], [.25, -.05], [.5, .7], [1.12, .2]], dur: 11, off: 0, s: 1 },
  { p: [[1.1, .82], [.75, .4], [.35, 1.0], [-.12, .55]], dur: 13, off: .45, s: .8 },
  { p: [[-.1, .9], [.3, .55], [.6, .05], [1.1, -.08]], dur: 9, off: .7, s: .65 },
].map(o => { const el = document.createElement('div'); el.className = 'plane'; el.innerHTML = PLANE; planesEl.appendChild(el); return { ...o, el }; });
function bez(p, t) {
  const u = 1 - t;
  return [
    u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
  ];
}
let HW = innerWidth, HH = innerHeight;
function drawPlanes(time) {
  for (const pl of PLANES) {
    const t = ((time / pl.dur) + pl.off) % 1;
    const [x, y] = bez(pl.p, t), [x2, y2] = bez(pl.p, Math.min(1, t + .004));
    const ang = Math.atan2((y2 - y) * HH, (x2 - x) * HW);
    pl.el.style.transform = `translate3d(${(x * HW).toFixed(1)}px,${(y * HH).toFixed(1)}px,0) rotate(${ang.toFixed(3)}rad) scale(${pl.s})`;
  }
}

/* ---------------------------------------------------------------- */
/* 4. Marquee bands                                                   */
/* ---------------------------------------------------------------- */
const WORDS = ['Zero sugar', 'Maximum fizz', 'No chill', '160 mg', 'Light it', "Don't shake it", 'Ka-boom'];
const tracks = $$('.track').map((el, i) => {
  const words = i ? [...WORDS].reverse() : WORDS;
  const chunk = words.map(w => `<span>${w}${BOLT}</span>`).join('');
  el.innerHTML = chunk + chunk + chunk;
  return { el, dir: +el.dataset.dir, x: 0, w: 0 };
});
function measureTracks() { tracks.forEach(t => t.w = t.el.scrollWidth / 3); }

/* ---------------------------------------------------------------- */
/* 5. Main loop: rays speed tied to scroll velocity                   */
/* ---------------------------------------------------------------- */
let rayAng = 0, sv = 0, lastY = scrollY, lastT = performance.now(), T = 0;
let heroOn = true, marqOn = false;
new IntersectionObserver(es => heroOn = es[0].isIntersecting).observe(hero);
new IntersectionObserver(es => marqOn = es[0].isIntersecting).observe($('.marquee'));

function placeRays() {
  const hr = hero.getBoundingClientRect(), st = $('.stage').getBoundingClientRect();
  rays.style.left = (st.left - hr.left + st.width / 2) + 'px';
  rays.style.top = (st.top - hr.top + st.height / 2) + 'px';
  HW = hr.width; HH = hr.height;
}

function loop(now) {
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; T += dt;
  const v = Math.abs(scrollY - lastY) / Math.max(dt, .001); lastY = scrollY;
  sv += (Math.min(v, 6000) - sv) * Math.min(1, dt * 6);
  if (heroOn) {
    rayAng += (10 + sv * .09 + boomSpin) * dt;
    boomSpin *= Math.pow(.25, dt);
    rays.style.transform = `rotate(${rayAng.toFixed(2)}deg) scale(${(1 + Math.min(sv, 3000) / 30000 + boomScale).toFixed(4)})`;
    boomScale *= Math.pow(.1, dt);
    drawPlanes(T);
    pupilC.x += (pupilT.x - pupilC.x) * .2; pupilC.y += (pupilT.y - pupilC.y) * .2;
    pupils.setAttribute('transform', `translate(${pupilC.x.toFixed(2)} ${pupilC.y.toFixed(2)})`);
  }
  if (marqOn) {
    const sp = 70 + sv * .35;
    for (const t of tracks) {
      if (!t.w) continue;
      t.x = (t.x + t.dir * sp * dt) % t.w; if (t.x > 0) t.x -= t.w;
      t.el.style.transform = `translate3d(${t.x.toFixed(1)}px,0,0)`;
    }
  }
  requestAnimationFrame(loop);
}
let boomSpin = 0, boomScale = 0;

/* ---------------------------------------------------------------- */
/* 6. Light it → countdown → KA-BOOM → re-assemble                    */
/* ---------------------------------------------------------------- */
const cd = $('#countdown'), canvas = $('#boom'), ctx = canvas.getContext('2d'), flash = $('#flash'), kaboom = $('#kaboom');
let busy = false;
const wait = ms => new Promise(r => setTimeout(r, ms));
function tween(ms, fn) {
  return new Promise(res => {
    const t0 = performance.now();
    const f = now => { const p = Math.min(1, (now - t0) / ms); fn(p); p < 1 ? requestAnimationFrame(f) : res(); };
    requestAnimationFrame(f);
  });
}
async function light() {
  if (busy) return; busy = true;
  hero.classList.add('lit');
  const start = fuseLeft;
  const burn = tween(RM ? 300 : 2700, p => setFuse(start * (1 - p)));
  for (const n of [3, 2, 1]) {
    cd.innerHTML = `<span>${n}</span>`;
    mascot.parentElement.classList.remove('shk1', 'shk2', 'shk3');
    if (!RM) mascot.parentElement.classList.add('shk' + (4 - n));
    await wait(RM ? 100 : 900);
  }
  await burn;
  cd.innerHTML = '';
  mascot.parentElement.classList.remove('shk1', 'shk2', 'shk3');
  boom();
  await wait(RM ? 900 : 1500);
  hero.classList.remove('blown', 'lit');
  await wait(500);
  await tween(700, p => setFuse(FUSE_LEN * (1 - Math.pow(1 - p, 3))));
  busy = false;
}
$('#lightBtn').addEventListener('click', light);
$('#mascotBtn').addEventListener('click', light);

function shake(ms, amp) {
  if (RM) return;
  const t0 = performance.now();
  const f = now => {
    const p = (now - t0) / ms;
    if (p >= 1) { shakeEl.style.transform = ''; return; }
    const a = amp * Math.pow(1 - p, 2);
    shakeEl.style.transform = `translate(${((Math.random() - .5) * 2 * a).toFixed(1)}px,${((Math.random() - .5) * 2 * a).toFixed(1)}px) rotate(${((Math.random() - .5) * a * .08).toFixed(2)}deg)`;
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}

let parts = [], rings = [], puffs = [], boomRunning = false, DPR = 1;
function sizeCanvas() {
  DPR = Math.min(2, devicePixelRatio || 1);
  canvas.width = innerWidth * DPR; canvas.height = innerHeight * DPR;
}
function boom() {
  const r = mascot.getBoundingClientRect();
  const ox = r.left + r.width / 2, oy = r.top + r.height * .38;
  flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
  kaboom.classList.remove('show'); void kaboom.offsetWidth; kaboom.classList.add('show');
  if (RM) return;
  hero.classList.add('blown');
  shake(900, 26);
  boomSpin = 900; boomScale = .25;
  sizeCanvas(); canvas.style.display = 'block';
  const cols = [C.pink, C.lime, C.cyan, C.violet, '#fff', '#ffb347'];
  const shapes = ['rect', 'rect', 'circle', 'star', 'bolt', 'tri'];
  const n = innerWidth < 600 ? 140 : 260;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 500 + Math.random() * 1500;
    parts.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 400, r: Math.random() * 6, vr: (Math.random() - .5) * 14,
      s: 7 + Math.random() * 13, c: cols[i % cols.length], sh: shapes[(Math.random() * shapes.length) | 0], life: 2.6 + Math.random() * 1.2, wob: Math.random() * 6 });
  }
  const diag = Math.hypot(innerWidth, innerHeight);
  [C.lime, C.pink, C.cyan].forEach((c, i) => rings.push({ x: ox, y: oy, c, t: -i * .09, dur: .8, max: diag }));
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    puffs.push({ x: ox, y: oy, vx: Math.cos(a) * (180 + Math.random() * 120), vy: Math.sin(a) * (180 + Math.random() * 120), r: 30 + Math.random() * 30, t: 0, dur: 1.1 + Math.random() * .4 });
  }
  if (!boomRunning) { boomRunning = true; let lt = performance.now(); requestAnimationFrame(function f(now) { const dt = Math.min(.04, (now - lt) / 1000); lt = now; if (drawBoom(dt)) requestAnimationFrame(f); else { boomRunning = false; canvas.style.display = 'none'; } }); }
}
function shapePath(sh, s) {
  ctx.beginPath();
  if (sh === 'rect') ctx.rect(-s / 2, -s / 3, s, s * .66);
  else if (sh === 'circle') ctx.arc(0, 0, s / 2.2, 0, Math.PI * 2);
  else if (sh === 'tri') { ctx.moveTo(0, -s / 2); ctx.lineTo(s / 2, s / 2); ctx.lineTo(-s / 2, s / 2); ctx.closePath(); }
  else if (sh === 'star') { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? s * .24 : s * .6; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); }
  else { const k = s / 24; ctx.moveTo(2 * k, -12 * k); ctx.lineTo(-8 * k, 2 * k); ctx.lineTo(0, 2 * k); ctx.lineTo(-3 * k, 14 * k); ctx.lineTo(9 * k, -3 * k); ctx.lineTo(1 * k, -3 * k); ctx.closePath(); }
}
function drawBoom(dt) {
  const W = innerWidth, H = innerHeight;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.lineJoin = 'round';
  // shockwave rings
  rings = rings.filter(r => (r.t += dt) < r.dur);
  for (const r of rings) {
    if (r.t < 0) continue;
    const p = r.t / r.dur, e = 1 - Math.pow(1 - p, 3), rad = e * r.max * .75, w = 46 * (1 - p) + 4;
    ctx.globalAlpha = 1 - p * .6;
    ctx.lineWidth = w + 8; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = w; ctx.strokeStyle = r.c; ctx.stroke();
  }
  // cartoon smoke puffs
  puffs = puffs.filter(p => (p.t += dt) < p.dur);
  for (const p of puffs) {
    const k = p.t / p.dur; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96;
    ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (.6 + k * .9), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // confetti
  const drag = Math.pow(.35, dt);
  parts = parts.filter(q => (q.life -= dt) > 0 && q.y < H + 60);
  for (const q of parts) {
    q.vy += 1300 * dt; q.vx *= drag; q.vy *= drag; q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt;
    ctx.globalAlpha = Math.min(1, q.life * 2);
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.scale(1, Math.cos(q.r * 2 + q.wob) * .5 + .7);
    shapePath(q.sh, q.s); ctx.fillStyle = q.c; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  return parts.length || rings.length || puffs.length;
}

/* ---------------------------------------------------------------- */
/* 7. Flavours carousel with 3D tilt                                  */
/* ---------------------------------------------------------------- */
const FLAVOURS = [
  { id: 'razz', name: 'Blue Razz Riot', short: 'BLUE RAZZ', body: '#4fd8ff', accent: C.pink, bg: C.cyan, notes: 'Blue raspberry, sour cherry and a rumble of thunder on the finish.', tags: ['160 mg', 'sour-ish', 'cult fave'] },
  { id: 'pink', name: 'Pink Lemon Panic', short: 'PINK LEMON', body: C.pink, accent: C.lime, bg: '#ffb4d8', notes: 'Pink lemonade, yuzu peel and a sherbet fizz that makes your ears pop.', tags: ['160 mg', 'tart', 'new'] },
  { id: 'lime', name: 'Lime Lightning', short: 'LIME BOLT', body: C.lime, accent: C.violet, bg: '#f3ffa6', notes: 'Key lime, cucumber cool and electric mint. Tastes like a thunderstorm in July.', tags: ['160 mg', 'zesty', 'og'] },
  { id: 'grape', name: 'Grape Detonator', short: 'GRAPE', body: C.violet, accent: C.cyan, bg: '#c4bbff', notes: 'Concord grape, blackcurrant and a sparkle you can hear through the can.', tags: ['160 mg', 'deep', 'night mode'] },
];
function canSvg(f) {
  return `<svg viewBox="0 0 200 340" aria-hidden="true">
  <defs><clipPath id="can-${f.id}"><rect x="34" y="40" width="132" height="262" rx="22"/></clipPath></defs>
  <rect x="34" y="40" width="132" height="262" rx="22" fill="${f.body}" stroke="${C.ink}" stroke-width="7"/>
  <g clip-path="url(#can-${f.id})">
    <polygon points="128,30 46,176 100,176 70,320 168,140 110,140 150,30" fill="${f.accent}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="48" y="56" width="16" height="230" rx="8" fill="#fff" opacity=".45"/>
    <rect x="70" y="64" width="6" height="200" rx="3" fill="#fff" opacity=".35"/>
    <circle cx="140" cy="250" r="4" fill="#fff" opacity=".7"/><circle cx="58" cy="210" r="3" fill="#fff" opacity=".7"/><circle cx="150" cy="96" r="3.5" fill="#fff" opacity=".7"/>
  </g>
  <rect x="34" y="40" width="132" height="262" rx="22" fill="none" stroke="${C.ink}" stroke-width="7"/>
  <text transform="translate(116 172) rotate(-90)" text-anchor="middle" font-family="Bowlby One, Impact, sans-serif" font-size="66" fill="#fff" stroke="${C.ink}" stroke-width="9" paint-order="stroke" stroke-linejoin="round" letter-spacing="1">FUSE</text>
  <rect x="58" y="274" width="84" height="22" rx="11" fill="#fff" stroke="${C.ink}" stroke-width="3.5"/>
  <text x="100" y="290" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="800" font-size="12" fill="${C.ink}" letter-spacing="1">${f.short}</text>
  <path d="M42 40 Q42 22 64 18 H136 Q158 22 158 40 Z" fill="#e3e7ef" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  <ellipse cx="100" cy="18" rx="40" ry="7" fill="#c3c9d6" stroke="${C.ink}" stroke-width="5"/>
  <path d="M92 16 h22 a5 5 0 0 1 0 10 h-22z" fill="#9aa1b3" stroke="${C.ink}" stroke-width="3"/>
  <path d="M42 302 Q42 318 64 322 H136 Q158 318 158 302 Z" fill="#e3e7ef" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
</svg>`;
}
$('#dropCan').innerHTML = canSvg({ id: 'mango', short: 'MIDNIGHT', body: '#221d3a', accent: '#ffb347' });
const car = $('#carousel');
car.innerHTML = FLAVOURS.map((f, i) => `
<article class="flav" style="--bg:${f.bg}">
  <div class="flav-inner pop" style="--d:${i * .08}s">
    <div class="can-stage" style="--fd:${-i * .7}s">
      <span class="bub" style="width:22px;height:22px;left:12%;top:18%"></span>
      <span class="bub" style="width:14px;height:14px;right:16%;top:12%;animation-delay:-1s"></span>
      <span class="bub" style="width:30px;height:30px;right:10%;bottom:20%;animation-delay:-2s"></span>
      ${canSvg(f)}
    </div>
    <h3>${f.name}</h3>
    <p class="notes">${f.notes}</p>
    <ul class="meta">${f.tags.map(t => `<li>${t}</li>`).join('')}</ul>
    <div class="buy"><span class="price">€2.49</span><button class="btn btn-sm btn-white add" type="button">Add 12-pack</button></div>
  </div>
</article>`).join('');
$$('.flav', car).forEach(card => {
  const inner = $('.flav-inner', card);
  if (!RM) {
    card.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.classList.add('tilting');
      inner.style.setProperty('--rx', ((.5 - y) * 18).toFixed(2) + 'deg');
      inner.style.setProperty('--ry', ((x - .5) * 22).toFixed(2) + 'deg');
      inner.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      inner.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', () => { card.classList.remove('tilting'); inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--ry', '0deg'); });
  }
  const add = $('.add', card);
  add.addEventListener('click', () => {
    const on = add.classList.toggle('added');
    add.textContent = on ? 'Added ✓' : 'Add 12-pack';
  });
});
const step = () => (car.querySelector('.flav').getBoundingClientRect().width + 30);
$('#prevBtn').addEventListener('click', () => car.scrollBy({ left: -step(), behavior: RM ? 'auto' : 'smooth' }));
$('#nextBtn').addEventListener('click', () => {
  const end = car.scrollLeft + car.clientWidth >= car.scrollWidth - 4;
  car.scrollTo({ left: end ? 0 : car.scrollLeft + step(), behavior: RM ? 'auto' : 'smooth' });
});

/* ---------------------------------------------------------------- */
/* 8. Pops, counters, countdown timer, small demo UI                  */
/* ---------------------------------------------------------------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  const n = e.target.querySelector('[data-to]'); if (n) countUp(n);
}), { threshold: .2 });
$$('.pop').forEach(el => io.observe(el));
function countUp(el) {
  const to = +el.dataset.to;
  if (RM || !to) { el.textContent = to; return; }
  tween(1400, p => { const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) * Math.cos(p * 9); el.textContent = Math.max(0, Math.round(to * e)); });
}

// drop countdown → next Friday 20:00 local, at least 2 days away
const target = (() => {
  const d = new Date(); d.setHours(20, 0, 0, 0);
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
  if (d - Date.now() < 2 * 864e5) d.setDate(d.getDate() + 7);
  return d.getTime();
})();
const tEls = ['tD', 'tH', 'tM', 'tS'].map(id => $('#' + id));
function tick() {
  let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const vals = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].map(v => String(v).padStart(2, '0'));
  vals.forEach((v, i) => {
    const el = tEls[i];
    if (el.textContent !== v) { el.textContent = v; if (!RM) { el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip'); } }
  });
}
tick(); setInterval(tick, 1000);

$('#remindBtn').addEventListener('click', e => {
  const b = e.currentTarget, on = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', on); b.textContent = on ? 'Reminder set ✓' : 'Remind me';
});
$$('.rsvp').forEach(b => b.addEventListener('click', () => {
  const on = b.classList.toggle('on'); b.textContent = on ? "You're in!" : 'RSVP';
}));
const form = $('#newsForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const inp = $('#email');
  if (!/^\S+@\S+\.\S+$/.test(inp.value)) { inp.classList.remove('bad'); void inp.offsetWidth; inp.classList.add('bad'); inp.focus(); return; }
  form.classList.add('done');
  $('.news-done', form).textContent = "You're on the list. Stay loud.";
});

const nav = $('.nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 60), { passive: true });

/* ---------------------------------------------------------------- */
function layout() { placeRays(); measureTracks(); nav.classList.toggle('scrolled', scrollY > 60); }
addEventListener('resize', () => { layout(); if (boomRunning) sizeCanvas(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
addEventListener('load', layout);
layout();
drawPlanes(0);
if (!RM) requestAnimationFrame(t => { lastT = t; loop(t); });
else { rays.style.transform = 'rotate(4deg)'; tracks.forEach(t => t.el.style.transform = 'translate3d(0,0,0)'); }
})();
