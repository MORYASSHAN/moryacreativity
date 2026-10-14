/* FUWA ふわ — concept landing page. All characters are original SVG drawings. */
(() => {
'use strict';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ------------------------------------------------------------------ */
/* 1. Character sprite — 8 original top-down "lying" animals            */
/* ------------------------------------------------------------------ */
const INK = '#2b2350', BLUSH = '#ff9fae', BEAN = '#f7a6b4';
const shadow = "";

function face(y, o = {}) {
  const ink = o.ink || INK;
  let eyes;
  if (o.eyes === 'open') {
    eyes = `<circle cx="-15" cy="${y}" r="5.2" fill="${ink}"/><circle cx="15" cy="${y}" r="5.2" fill="${ink}"/>
      <circle cx="-13.3" cy="${y - 1.8}" r="1.7" fill="#fff"/><circle cx="16.7" cy="${y - 1.8}" r="1.7" fill="#fff"/>`;
  } else if (o.eyes === 'cat') {
    eyes = `<circle cx="-15" cy="${y}" r="7.5" fill="#ffd34d"/><circle cx="15" cy="${y}" r="7.5" fill="#ffd34d"/>
      <ellipse cx="-15" cy="${y}" rx="2.6" ry="6" fill="${INK}"/><ellipse cx="15" cy="${y}" rx="2.6" ry="6" fill="${INK}"/>
      <circle cx="-12.5" cy="${y - 3}" r="1.6" fill="#fff"/><circle cx="17.5" cy="${y - 3}" r="1.6" fill="#fff"/>`;
  } else {
    eyes = `<path d="M-21 ${y + 1} q6 -7 12 0 M9 ${y + 1} q6 -7 12 0" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  }
  const nose = o.nose || '#f08a96';
  const mouth = o.mouth === 'open'
    ? `<path d="M-9 ${y + 13} q9 12 18 0 z" fill="${INK}"/><ellipse cx="0" cy="${y + 18}" rx="5" ry="3.4" fill="#ff8a9b"/>`
    : `<path d="M0 ${y + 10} v2.5 M-7 ${y + 12.5} q3.5 4.5 7 0 q3.5 4.5 7 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const blush = o.blush === false ? '' :
    `<ellipse cx="-27" cy="${y + 10}" rx="7.5" ry="4.6" fill="${BLUSH}" opacity=".75"/><ellipse cx="27" cy="${y + 10}" rx="7.5" ry="4.6" fill="${BLUSH}" opacity=".75"/>`;
  return `${blush}${eyes}<path d="M-4.5 ${y + 6} h9 l-4.5 4.5 z" fill="${nose}" stroke="${nose}" stroke-width="2" stroke-linejoin="round"/>${mouth}`;
}
const beans = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><ellipse cx="0" cy="2" rx="5.5" ry="4.5" fill="${BEAN}"/><circle cx="-6" cy="-5" r="2.2" fill="${BEAN}"/><circle cx="0" cy="-7" r="2.2" fill="${BEAN}"/><circle cx="6" cy="-5" r="2.2" fill="${BEAN}"/></g>`;

function limbs(c, paw) {
  const p = paw || c;
  return `
  <ellipse cx="-31" cy="62" rx="14" ry="21" transform="rotate(28 -31 62)" fill="${c}"/>
  <ellipse cx="31" cy="62" rx="14" ry="21" transform="rotate(-28 31 62)" fill="${c}"/>
  <circle cx="-39" cy="77" r="11" fill="${p}"/><circle cx="39" cy="77" r="11" fill="${p}"/>
  ${beans(-39, 79, 25)}${beans(39, 79, -25)}
  <ellipse cx="-46" cy="-10" rx="12.5" ry="23" transform="rotate(-52 -46 -10)" fill="${c}"/>
  <ellipse cx="46" cy="-10" rx="12.5" ry="23" transform="rotate(52 46 -10)" fill="${c}"/>
  <circle cx="-62" cy="-22" r="10" fill="${p}"/><circle cx="62" cy="-22" r="10" fill="${p}"/>`;
}

function cat(o) {
  const b = o.base, id = o.id;
  const tail = `M10 58 C 26 96, 80 96, 76 58`;
  const ears = `
    <path d="M-38 -48 L-35 -84 L-9 -66 Z" fill="${o.earL || b}" stroke="${o.earL || b}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M38 -48 L35 -84 L9 -66 Z" fill="${o.earR || b}" stroke="${o.earR || b}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M-31 -54 L-30 -74 L-16 -64 Z" fill="${o.inner || '#f7a6b4'}" stroke="${o.inner || '#f7a6b4'}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M31 -54 L30 -74 L16 -64 Z" fill="${o.inner || '#f7a6b4'}" stroke="${o.inner || '#f7a6b4'}" stroke-width="3" stroke-linejoin="round"/>`;
  const stripes = o.stripes ? `
    <g clip-path="url(#cb-${id})" stroke="${o.dark}" stroke-width="7" stroke-linecap="round" fill="none">
      <path d="M-48 2 q14 5 22 -2 M48 2 q-14 5 -22 -2 M-48 22 q16 5 24 -2 M48 22 q-16 5 -24 -2 M-48 42 q14 5 22 -2 M48 42 q-14 5 -22 -2 M-30 62 q10 -2 14 -10 M30 62 q-10 -2 -14 -10"/>
    </g>
    <path d="M0 -70 v11 M-10 -68 l2.5 9 M10 -68 l-2.5 9" stroke="${o.dark}" stroke-width="4.5" stroke-linecap="round"/>` : '';
  const patches = o.patches ? `
    <g clip-path="url(#cb-${id})"><ellipse cx="-22" cy="34" rx="26" ry="20" fill="#f19a4b"/><ellipse cx="24" cy="2" rx="20" ry="16" fill="#3a3346"/><ellipse cx="18" cy="56" rx="12" ry="10" fill="#f19a4b"/></g>` : '';
  const headPatches = o.patches ? `
    <g clip-path="url(#ch-${id})"><ellipse cx="-30" cy="-58" rx="24" ry="20" fill="#f19a4b"/><ellipse cx="32" cy="-56" rx="20" ry="18" fill="#3a3346"/></g>` : '';
  const collar = o.collar ? `
    <path d="M-33 -9 Q0 9 33 -9" stroke="#e8484f" stroke-width="8" fill="none" stroke-linecap="round"/>
    <circle cx="0" cy="3" r="6.5" fill="#ffcf4a" stroke="#d99a26" stroke-width="1.6"/><path d="M-6 3 h12" stroke="#d99a26" stroke-width="1.4"/>` : '';
  return `
  <clipPath id="cb-${id}"><ellipse cx="0" cy="18" rx="42" ry="50"/></clipPath>
  <clipPath id="ch-${id}"><ellipse cx="0" cy="-36" rx="42" ry="34"/></clipPath>
  ${shadow}
  <path d="${tail}" stroke="${o.tail || b}" stroke-width="16" fill="none" stroke-linecap="round"/>
  ${o.stripes ? `<path d="${tail}" stroke="${o.dark}" stroke-width="16" fill="none" stroke-dasharray="6 12" stroke-dashoffset="-14"/>` : ''}
  ${o.tipColor ? `<circle cx="76" cy="58" r="8" fill="${o.tipColor}"/>` : ''}
  ${limbs(b, o.paw)}
  <ellipse cx="0" cy="18" rx="42" ry="50" fill="${b}"/>
  ${o.belly ? `<ellipse cx="0" cy="26" rx="22" ry="32" fill="${o.belly}"/>` : ''}
  ${stripes}${patches}${collar}
  ${ears}
  <ellipse cx="0" cy="-36" rx="42" ry="34" fill="${b}"/>
  ${headPatches}
  ${o.muzzle ? `<ellipse cx="0" cy="-22" rx="19" ry="12" fill="${o.muzzle}"/>` : ''}
  ${o.stripes ? `<path d="M0 -70 v11 M-10 -68 l2.5 9 M10 -68 l-2.5 9" stroke="${o.dark}" stroke-width="4.5" stroke-linecap="round"/>` : ''}
  ${face(-36, { eyes: o.eyes, ink: o.ink })}
  <path d="M-38 -26 l-16 -2 M-38 -20 l-15 3 M38 -26 l16 -2 M38 -20 l15 3" stroke="${o.whisker || 'rgba(43,35,80,.35)'}" stroke-width="1.6" stroke-linecap="round"/>`;
}

function panda() {
  const K = '#2d2a38', W = '#fffdf8';
  return `${shadow}
  <ellipse cx="-31" cy="62" rx="16" ry="21" transform="rotate(28 -31 62)" fill="${K}"/>
  <ellipse cx="31" cy="62" rx="16" ry="21" transform="rotate(-28 31 62)" fill="${K}"/>
  <ellipse cx="-38" cy="76" rx="9" ry="7" fill="#5a5466"/><ellipse cx="38" cy="76" rx="9" ry="7" fill="#5a5466"/>
  <ellipse cx="0" cy="16" rx="46" ry="52" fill="${W}"/>
  <path d="M-44 -2 Q0 22 44 -2 L44 -16 Q0 4 -44 -16 Z" fill="${K}"/>
  <circle cx="0" cy="66" r="9" fill="${W}"/>
  <g transform="rotate(-32)">
    <rect x="-66" y="2" width="132" height="12" rx="6" fill="#7cc576"/>
    <path d="M-34 2 v12 M2 2 v12 M38 2 v12" stroke="#4e9a52" stroke-width="3"/>
  </g>
  <path d="M60 -38 q20 -16 34 -6 q-16 12 -34 6 z M54 -30 q10 -24 26 -24 q-6 18 -26 24 z" fill="#5fb565"/>
  <path d="M-40 0 L-16 18 M40 -6 L24 -6" stroke="${K}" stroke-width="20" stroke-linecap="round"/>
  <circle cx="-14" cy="18" r="12" fill="${K}"/><circle cx="24" cy="-5" r="12" fill="${K}"/>
  <circle cx="-32" cy="-64" r="14" fill="${K}"/><circle cx="32" cy="-64" r="14" fill="${K}"/>
  <ellipse cx="0" cy="-36" rx="44" ry="35" fill="${W}"/>
  <ellipse cx="-16" cy="-38" rx="10.5" ry="14" transform="rotate(32 -16 -38)" fill="${K}"/>
  <ellipse cx="16" cy="-38" rx="10.5" ry="14" transform="rotate(-32 16 -38)" fill="${K}"/>
  <circle cx="-15" cy="-40" r="3.6" fill="#fff"/><circle cx="15" cy="-40" r="3.6" fill="#fff"/>
  <ellipse cx="-27" cy="-24" rx="7" ry="4.4" fill="${BLUSH}" opacity=".7"/><ellipse cx="27" cy="-24" rx="7" ry="4.4" fill="${BLUSH}" opacity=".7"/>
  <ellipse cx="0" cy="-27" rx="6.5" ry="4.5" fill="${K}"/>
  <path d="M0 -23 v3 M-7 -19 q3.5 4.5 7 0 q3.5 4.5 7 0" stroke="${K}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
}

function shiba() {
  const B = '#e9a25b', C = '#fff1dc';
  return `
  <clipPath id="ch-kinako"><ellipse cx="0" cy="-36" rx="42" ry="34"/></clipPath>
  ${shadow}
  <path d="M30 50 c 26 -4 34 26 12 30 c-14 2 -18 -12 -6 -14" stroke="${B}" stroke-width="15" fill="none" stroke-linecap="round"/>
  <circle cx="36" cy="66" r="4" fill="${C}"/>
  ${limbs(B, C)}
  <ellipse cx="0" cy="18" rx="42" ry="50" fill="${B}"/>
  <ellipse cx="0" cy="22" rx="25" ry="36" fill="${C}"/>
  <path d="M-38 -46 L-32 -86 L-7 -64 Z" fill="${B}" stroke="${B}" stroke-width="8" stroke-linejoin="round"/>
  <path d="M38 -46 L32 -86 L7 -64 Z" fill="${B}" stroke="${B}" stroke-width="8" stroke-linejoin="round"/>
  <path d="M-30 -54 L-28 -74 L-15 -63 Z" fill="${C}" stroke="${C}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M30 -54 L28 -74 L15 -63 Z" fill="${C}" stroke="${C}" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="0" cy="-36" rx="42" ry="34" fill="${B}"/>
  <g clip-path="url(#ch-kinako)"><ellipse cx="0" cy="-12" rx="38" ry="22" fill="${C}"/></g>
  <circle cx="-15" cy="-50" r="4" fill="${C}"/><circle cx="15" cy="-50" r="4" fill="${C}"/>
  ${face(-38, { mouth: 'open', nose: INK })}`;
}

function fluff(cx, cy, rx, ry, n, r, fill, edge) {
  let a = '', b = '';
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2, x = (cx + Math.cos(t) * rx).toFixed(1), y = (cy + Math.sin(t) * ry).toFixed(1);
    a += `<circle cx="${x}" cy="${y}" r="${r + 2.5}" fill="${edge}"/>`;
    b += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
  }
  return `${a}<ellipse cx="${cx}" cy="${cy}" rx="${rx + 2}" ry="${ry + 2}" fill="${edge}"/>${b}<ellipse cx="${cx}" cy="${cy}" rx="${rx + 1}" ry="${ry + 1}" fill="${fill}"/>`;
}

function sheep() {
  const D = '#4a4458', W = '#fffdf6', E = '#eadcca';
  return `${shadow}
  <ellipse cx="-30" cy="66" rx="9" ry="16" transform="rotate(28 -30 66)" fill="${D}"/>
  <ellipse cx="30" cy="66" rx="9" ry="16" transform="rotate(-28 30 66)" fill="${D}"/>
  <ellipse cx="-50" cy="-2" rx="8" ry="15" transform="rotate(-55 -50 -2)" fill="${D}"/>
  <ellipse cx="50" cy="-2" rx="8" ry="15" transform="rotate(55 50 -2)" fill="${D}"/>
  ${fluff(0, 20, 38, 44, 14, 17, W, E)}
  <circle cx="-14" cy="20" r="9" fill="#f4ecdf"/><circle cx="16" cy="38" r="8" fill="#f4ecdf"/><circle cx="10" cy="6" r="6" fill="#f4ecdf"/>
  <ellipse cx="-32" cy="-44" rx="16" ry="8" transform="rotate(-22 -32 -44)" fill="${D}"/>
  <ellipse cx="32" cy="-44" rx="16" ry="8" transform="rotate(22 32 -44)" fill="${D}"/>
  <ellipse cx="-34" cy="-44" rx="9" ry="4" transform="rotate(-22 -34 -44)" fill="#f7a6b4"/>
  <ellipse cx="34" cy="-44" rx="9" ry="4" transform="rotate(22 34 -44)" fill="#f7a6b4"/>
  <ellipse cx="0" cy="-38" rx="26" ry="30" fill="${D}"/>
  ${fluff(0, -66, 12, 6, 7, 9, W, E)}
  <path d="M-15 -38 q5 -6 10 0 M5 -38 q5 -6 10 0" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  <ellipse cx="-17" cy="-26" rx="5.5" ry="3.5" fill="${BLUSH}" opacity=".85"/><ellipse cx="17" cy="-26" rx="5.5" ry="3.5" fill="${BLUSH}" opacity=".85"/>
  <path d="M-3.5 -26 h7 l-3.5 3.5 z" fill="#f7a6b4" stroke="#f7a6b4" stroke-width="2" stroke-linejoin="round"/>
  <path d="M0 -22 v2 M-5 -20 q2.5 3.5 5 0 q2.5 3.5 5 0" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
}

function samoyed() {
  const W = '#fffefb', E = '#efdfd3';
  return `${shadow}
  ${fluff(46, 50, 10, 22, 8, 11, W, E)}
  <ellipse cx="-31" cy="62" rx="14" ry="21" transform="rotate(28 -31 62)" fill="${E}"/>
  <ellipse cx="31" cy="62" rx="14" ry="21" transform="rotate(-28 31 62)" fill="${E}"/>
  <ellipse cx="-31" cy="62" rx="12" ry="19" transform="rotate(28 -31 62)" fill="${W}"/>
  <ellipse cx="31" cy="62" rx="12" ry="19" transform="rotate(-28 31 62)" fill="${W}"/>
  ${beans(-39, 76, 25)}${beans(39, 76, -25)}
  <ellipse cx="-46" cy="-10" rx="13" ry="23" transform="rotate(-52 -46 -10)" fill="${E}"/>
  <ellipse cx="46" cy="-10" rx="13" ry="23" transform="rotate(52 46 -10)" fill="${E}"/>
  <ellipse cx="-46" cy="-10" rx="11" ry="21" transform="rotate(-52 -46 -10)" fill="${W}"/>
  <ellipse cx="46" cy="-10" rx="11" ry="21" transform="rotate(52 46 -10)" fill="${W}"/>
  ${fluff(0, 18, 36, 44, 18, 11, W, E)}
  <path d="M-36 -48 L-30 -82 L-8 -64 Z" fill="${W}" stroke="${E}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M36 -48 L30 -82 L8 -64 Z" fill="${W}" stroke="${E}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M-29 -55 L-27 -72 L-15 -63 Z" fill="#f7b8c4"/><path d="M29 -55 L27 -72 L15 -63 Z" fill="#f7b8c4"/>
  ${fluff(0, -36, 34, 26, 16, 10, W, E)}
  ${face(-40, { eyes: 'open', mouth: 'open', nose: INK })}`;
}

const CHARACTERS = [
  { id: 'mikan', jp: 'みかん', name: 'Mikan', role: 'The Sunbeam Collector', traits: ['naps in sunbeams', 'steals socks', 'purrs in C major'], m: [92, 70, 80], rare: 'Common', bg: '#ffe1cc',
    art: () => cat({ id: 'mikan', base: '#f4a259', dark: '#d9772c', belly: '#ffe3c4', muzzle: '#fff1e0', tipColor: '#fff1e0', paw: '#fff1e0', stripes: true }) },
  { id: 'kumo', jp: 'くも', name: 'Kumo', role: 'The Rainy-Day Philosopher', traits: ['window watcher', 'slow blinker', 'owns one thought'], m: [80, 30, 74], rare: 'Common', bg: '#d6eaff',
    art: () => cat({ id: 'kumo', base: '#a7adbb', dark: '#787f92', belly: '#e9ebf1', muzzle: '#eef0f5', paw: '#eef0f5', stripes: true, eyes: 'open' }) },
  { id: 'kuro', jp: 'くろ', name: 'Kuro', role: 'The Midnight Bell', traits: ['jingles on purpose', 'cup tipper', 'secretly shy'], m: [64, 96, 70], rare: 'Rare', bg: '#e4ddff',
    art: () => cat({ id: 'kuro', base: '#2f2b3c', inner: '#6b5a7e', collar: true, eyes: 'cat', ink: '#d9d3ff', whisker: 'rgba(255,255,255,.35)' }) },
  { id: 'mochi', jp: 'もち', name: 'Mochi', role: 'The Patchwork Diplomat', traits: ['friends with everyone', 'sits on laptops', 'three colours, one mood'], m: [70, 58, 88], rare: 'Rare', bg: '#ffd9e2',
    art: () => cat({ id: 'mochi', base: '#fffaf2', patches: true, earL: '#f19a4b', earR: '#3a3346', tail: '#f19a4b', tipColor: '#3a3346' }) },
  { id: 'sasa', jp: 'ささ', name: 'Sasa', role: 'The Bamboo Gourmet', traits: ['snacks constantly', 'rolls, never walks', 'zero urgency'], m: [98, 20, 95], rare: 'Ultra fluffy', bg: '#cfeedd', art: panda },
  { id: 'kinako', jp: 'きなこ', name: 'Kinako', role: 'The Dramatic Shiba', traits: ['screams politely', 'loves walks, hates baths', 'tail: pure curl'], m: [40, 88, 66], rare: 'Common', bg: '#fff0c2', art: shiba },
  { id: 'wata', jp: 'わた', name: 'Wata', role: 'The Cloud With Legs', traits: ['counts humans to sleep', 'maximum squeeze', 'basically a pillow'], m: [96, 12, 100], rare: 'Rare', bg: '#ffe6dc', art: sheep },
  { id: 'hana', jp: 'はな', name: 'Hana', role: 'The Smiling Snowdrift', traits: ['always smiling', 'sheds pure joy', 'professional greeter'], m: [55, 62, 97], rare: 'Ultra fluffy', bg: '#e1f0ff', art: samoyed },
];

const sprite = $('#sprite');
sprite.innerHTML = '<defs>' + CHARACTERS.map(c => `<symbol id="a-${c.id}" viewBox="-100 -100 200 200" overflow="visible">${c.art()}</symbol>`).join('') +
  `<symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.6 1.2 5.3 3.1 1.7-1.9 3.1-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="#f2798b"/></symbol></defs>`;
const svgUse = (id, cls = '') => `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true"><use href="#a-${id}"/></svg>`;
const heartSvg = '<svg viewBox="0 0 24 24"><use href="#i-heart"/></svg>';

/* ------------------------------------------------------------------ */
/* 2. Morphing blobs                                                   */
/* ------------------------------------------------------------------ */
function blobD(cx, cy, r, t, seed, n = 8, amp = .12) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const rr = r * (1 + amp * Math.sin(t * .8 + seed * 1.7 + i * 1.9) + amp * .5 * Math.sin(t * 1.3 + seed * 3.1 + i * 2.7));
    p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
const blobs = $$('.hero-blobs .blob').map(el => ({ el, cx: +el.dataset.cx, cy: +el.dataset.cy, r: +el.dataset.r, seed: +el.dataset.seed }));
const ctaBlob = $('#ctaBlob');
let ctaBoost = 0;
$('#blobCta').addEventListener('pointerenter', () => ctaBoost = 1);
$('#blobCta').addEventListener('pointerleave', () => ctaBoost = 0);
let ctaAmp = .1;
const blobSvg = $('.hero-blobs');
let blobVB = '';
function drawBlobs(t) {
  const w = W || 1440, h = H || 900, k = Math.max(w / 1440, h / 900) * (w < 640 ? .85 : 1);
  const vb = `0 0 ${Math.round(w)} ${Math.round(h)}`;
  if (vb !== blobVB) { blobSvg.setAttribute('viewBox', vb); blobVB = vb; }
  for (const b of blobs) b.el.setAttribute('d', blobD(b.cx / 1440 * w, b.cy / 900 * h, b.r * k, t, b.seed));
  ctaAmp += ((ctaBoost ? .17 : .1) - ctaAmp) * .08;
  ctaBlob.setAttribute('d', blobD(120, 120, 98, t * (1 + ctaBoost * .8), 7, 9, ctaAmp));
}

/* ------------------------------------------------------------------ */
/* 3. Japanese typing                                                  */
/* ------------------------------------------------------------------ */
const PHRASES = [['ふわふわの動物たち', 'fluffy little animals'], ['やわらかい ともだち', 'soft little friends'], ['ぎゅっと、してね。', 'go on — give them a hug']];
const typed = $('#typed'), typedEn = $('#typedEn');
if (RM) { typed.textContent = PHRASES[0][0]; }
else {
  let pi = 0;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  (async function loop() {
    await sleep(500);
    for (;;) {
      const [jp, en] = PHRASES[pi];
      typedEn.style.opacity = 0;
      for (const ch of jp) {
        const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch === ' ' ? ' ' : ch;
        typed.appendChild(s); await sleep(150 + Math.random() * 90);
      }
      typedEn.textContent = en; typedEn.style.opacity = 1;
      await sleep(3400);
      while (typed.lastChild) { typed.lastChild.remove(); await sleep(45); }
      await sleep(300);
      pi = (pi + 1) % PHRASES.length;
    }
  })();
}

/* ------------------------------------------------------------------ */
/* 4. The herd field — soft physics, repulsion, grab & fling            */
/* ------------------------------------------------------------------ */
const hero = $('#hero'), field = $('#field'), copy = $('#heroCopy');
let W = 0, H = 0, bodies = [], textBox = null;
const mouse = { x: -9999, y: -9999, on: false };
let held = null, hugsMine = 0, globalHugs = 1204318;
const myHugsEl = $('#myHugs'), hugCountEl = $('#hugCount');

function measure() {
  const r = hero.getBoundingClientRect();
  W = r.width; H = r.height;
  const c = copy.getBoundingClientRect();
  textBox = { x0: c.left - r.left, y0: c.top - r.top, x1: c.right - r.left, y1: c.bottom - r.top };
}

function spawn() {
  measure();
  field.innerHTML = ''; bodies = [];
  const mobile = W < 640;
  const n = mobile ? 8 : 13;
  const base = mobile ? clamp(W / 4.2, 78, 100) : clamp(W / 8.6, 120, 176);
  const rings = [];
  for (let i = 0; i < n; i++) {
    const ch = CHARACTERS[i % CHARACTERS.length];
    const s = base * (0.82 + ((i * 37) % 10) / 22);
    const el = document.createElement('div');
    el.className = 'critter'; el.style.width = el.style.height = s + 'px';
    el.innerHTML = svgUse(ch.id);
    field.appendChild(el);
    // place on a ring around the copy, jittered
    const ang = (i / n) * Math.PI * 2 + Math.random() * .4;
    const x = clamp(W / 2 + Math.cos(ang) * W * (mobile ? .36 : .4), s / 2, W - s / 2);
    const y = clamp(H / 2 + Math.sin(ang) * H * (mobile ? .38 : .38), s / 2 + 40, H - s / 2);
    const b = { el, ch, s, r: s * .4, x, y, vx: (Math.random() - .5) * 40, vy: (Math.random() - .5) * 40,
      a: Math.random() * Math.PI * 2, va: (Math.random() < .5 ? -1 : 1) * (.08 + Math.random() * .16), spin: 0, ph: Math.random() * 100, sq: 0 };
    b.spin = b.va;
    bodies.push(b); rings.push(b);
    el.addEventListener('pointerdown', e => grab(e, b));
  }
  render();
}

let lastPts = [];
function grab(e, b) {
  if (RM) return;
  e.preventDefault();
  held = b; b.el.classList.add('held'); try { b.el.setPointerCapture(e.pointerId); } catch (_) {}
  const r = hero.getBoundingClientRect();
  b.gx = e.clientX - r.left - b.x; b.gy = e.clientY - r.top - b.y;
  lastPts = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
  b.sq = .18;
  popHeart(b.x, b.y - b.s * .35);
  hug(1);
  const move = ev => {
    const rr = hero.getBoundingClientRect();
    b.x = ev.clientX - rr.left - b.gx; b.y = ev.clientY - rr.top - b.gy;
    lastPts.push({ x: ev.clientX, y: ev.clientY, t: performance.now() });
    if (lastPts.length > 6) lastPts.shift();
  };
  const up = () => {
    b.el.removeEventListener('pointermove', move); b.el.removeEventListener('pointerup', up); b.el.removeEventListener('pointercancel', up);
    b.el.classList.remove('held');
    const a = lastPts[0], z = lastPts[lastPts.length - 1], dt = Math.max(16, z.t - a.t) / 1000;
    b.vx = clamp((z.x - a.x) / dt, -2600, 2600); b.vy = clamp((z.y - a.y) / dt, -2600, 2600);
    b.va = clamp(b.vx * .004, -6, 6) + b.spin;
    held = null;
  };
  b.el.addEventListener('pointermove', move); b.el.addEventListener('pointerup', up); b.el.addEventListener('pointercancel', up);
}

function popHeart(x, y) {
  const h = document.createElement('div'); h.className = 'fheart'; h.innerHTML = heartSvg;
  h.style.left = x + 'px'; h.style.top = y + 'px';
  field.appendChild(h); setTimeout(() => h.remove(), 1000);
}

function hug(n) {
  hugsMine += n; globalHugs += n;
  myHugsEl.textContent = hugsMine;
  hugCountEl.textContent = globalHugs.toLocaleString('en-US');
}

hero.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
});
hero.addEventListener('pointerleave', () => { mouse.on = false; });

function step(dt, t) {
  const R = Math.min(200, W * .2), damp = Math.pow(.55, dt);
  const tb = textBox, pad = W < 640 ? 10 : 30;
  for (const b of bodies) {
    if (b === held) { b.vx = b.vy = 0; b.a += (b.va = Math.sin(t * 8) * .6) * dt * .3; continue; }
    // wander
    let ax = Math.sin(t * .31 + b.ph) * 16, ay = Math.cos(t * .27 + b.ph * 1.3) * 16;
    // cursor repulsion
    if (mouse.on) {
      const dx = b.x - mouse.x, dy = b.y - mouse.y, d = Math.hypot(dx, dy) || 1;
      if (d < R + b.r) { const f = Math.pow(1 - d / (R + b.r), 2) * 2600; ax += dx / d * f; ay += dy / d * f; b.va += (dx > 0 ? 1 : -1) * f * .00004; }
    }
    // keep the headline readable: soft push out of the copy box
    if (tb) {
      const x0 = tb.x0 - pad, x1 = tb.x1 + pad, y0 = tb.y0 - pad, y1 = tb.y1 + pad;
      if (b.x > x0 && b.x < x1 && b.y > y0 && b.y < y1) {
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        const nx = (b.x - cx) / ((x1 - x0) / 2), ny = (b.y - cy) / ((y1 - y0) / 2);
        if (Math.abs(nx) > Math.abs(ny)) ax += Math.sign(nx || 1) * 220; else ay += Math.sign(ny || 1) * 220;
      }
    }
    b.vx = (b.vx + ax * dt) * damp; b.vy = (b.vy + ay * dt) * damp;
    const sp = Math.hypot(b.vx, b.vy); if (sp > 3000) { b.vx *= 3000 / sp; b.vy *= 3000 / sp; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.va += (b.spin - b.va) * Math.min(1, dt * .6);
    b.a += b.va * dt;
    // walls
    const m = b.r * .9;
    if (b.x < m) { b.x = m; if (b.vx < 0) { impact(b, -b.vx); b.vx *= -.65; } }
    if (b.x > W - m) { b.x = W - m; if (b.vx > 0) { impact(b, b.vx); b.vx *= -.65; } }
    if (b.y < m + 30) { b.y = m + 30; if (b.vy < 0) { impact(b, -b.vy); b.vy *= -.65; } }
    if (b.y > H - m) { b.y = H - m; if (b.vy > 0) { impact(b, b.vy); b.vy *= -.65; } }
  }
  // soft circle collisions
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const a = bodies[i], c = bodies[j];
    const dx = c.x - a.x, dy = c.y - a.y, min = a.r + c.r, d2 = dx * dx + dy * dy;
    if (d2 >= min * min) continue;
    const d = Math.sqrt(d2) || .01, nx = dx / d, ny = dy / d, ov = (min - d);
    const wa = a === held ? 0 : (c === held ? 1 : .5), wc = 1 - wa;
    a.x -= nx * ov * wa; a.y -= ny * ov * wa; c.x += nx * ov * wc; c.y += ny * ov * wc;
    const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
    if (rv < 0) {
      const jimp = -(1.7) * rv / 2;
      if (a !== held) { a.vx -= jimp * nx; a.vy -= jimp * ny; }
      if (c !== held) { c.vx += jimp * nx; c.vy += jimp * ny; }
      const tang = (c.vx - a.vx) * -ny + (c.vy - a.vy) * nx;
      a.va -= tang * .002; c.va += tang * .002;
      if (-rv > 260) { impact(a, -rv * .6); impact(c, -rv * .6); }
    }
  }
}
function impact(b, v) { b.sq = Math.max(b.sq, Math.min(.2, v / 4000)); }

function render() {
  for (const b of bodies) {
    b.sq *= .86;
    const sx = 1 + b.sq, sy = 1 - b.sq * .8;
    b.el.style.transform = `translate3d(${(b.x - b.s / 2).toFixed(1)}px,${(b.y - b.s / 2).toFixed(1)}px,0) rotate(${b.a.toFixed(3)}rad) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
  }
}

let heroVisible = true, last = performance.now(), T = 0;
function frame(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now;
  if (heroVisible) {
    T += dt;
    step(dt, T); render(); drawBlobs(T);
  }
  requestAnimationFrame(frame);
}
spawn(); drawBlobs(0);
new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
if (!RM) requestAnimationFrame(t => { last = t; frame(t); });

let rzT, lastW = innerWidth;
addEventListener('resize', () => {
  clearTimeout(rzT);
  rzT = setTimeout(() => {
    const crossed = (lastW < 640) !== (innerWidth < 640); lastW = innerWidth;
    if (crossed) spawn(); else { measure(); for (const b of bodies) { b.x = clamp(b.x, b.r, W - b.r); b.y = clamp(b.y, b.r, H - b.r); } render(); }
    buildTrail(); updateWalker(); drawBlobs(T);
  }, 150);
});

/* ------------------------------------------------------------------ */
/* 5. Herd cards                                                       */
/* ------------------------------------------------------------------ */
const cards = $('#cards');
cards.innerHTML = CHARACTERS.map((c, i) => `
  <article class="card reveal" tabindex="0" style="--bg:${c.bg};--d:${(i % 4) * .08}s" aria-label="${c.name}, ${c.role}">
    <div class="card-art" style="--bd:${-i * .6}s">
      <span class="rarity ${c.rare === 'Rare' ? 'r' : c.rare === 'Ultra fluffy' ? 'u' : ''}">${c.rare}</span>
      ${svgUse(c.id)}
    </div>
    <div class="card-name"><h3>${c.name}</h3><span lang="ja">${c.jp}</span></div>
    <p class="card-role">${c.role}</p>
    <ul class="traits">${c.traits.map(t => `<li>${t}</li>`).join('')}</ul>
    <div class="meter" aria-label="Nap ${c.m[0]}, mischief ${c.m[1]}, squish ${c.m[2]} out of 100">
      <span>Nap</span><b style="--v:${c.m[0]}%"></b><span>Mischief</span><b style="--v:${c.m[1]}%"></b><span>Squish</span><b style="--v:${c.m[2]}%"></b>
    </div>
  </article>`).join('');
$$('.card', cards).forEach(card => {
  const boop = e => {
    const r = card.getBoundingClientRect();
    const h = document.createElement('div'); h.className = 'boop'; h.innerHTML = heartSvg;
    const x = e && e.clientX ? e.clientX - r.left : r.width / 2, y = e && e.clientY ? e.clientY - r.top : r.height / 3;
    h.style.left = (x - 14) + 'px'; h.style.top = (y - 14) + 'px';
    card.appendChild(h); setTimeout(() => h.remove(), 1000);
    card.style.animation = 'none'; card.offsetWidth; card.style.animation = '';
    hug(1);
  };
  card.addEventListener('click', boop);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); boop(); } });
});

/* ------------------------------------------------------------------ */
/* 6. Roadmap trail + walking shiba                                    */
/* ------------------------------------------------------------------ */
const wrap = $('#pathWrap'), trail = $('#trail'), trailFg = $('#trailPath'), trailBg = $('#trailBg'), walker = $('#walker');
let trailLen = 0;
function buildTrail() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  trail.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const wr = wrap.getBoundingClientRect();
  const pts = [[w / 2, 0]];
  $$('.step', wrap).forEach((s, i) => {
    const r = s.getBoundingClientRect();
    const cy = r.top - wr.top + r.height / 2;
    const narrow = w < 860;
    const x = narrow ? (i % 2 ? w * .9 : w * .1) : (i % 2 ? w * .82 : w * .18);
    pts.push([x, cy]);
  });
  pts.push([w / 2, h]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 5} ${p1[1] + (p2[1] - p0[1]) / 5} ${p2[0] - (p3[0] - p1[0]) / 5} ${p2[1] - (p3[1] - p1[1]) / 5} ${p2[0]} ${p2[1]}`;
  }
  trailFg.setAttribute('d', d); trailBg.setAttribute('d', d);
  trailLen = trailFg.getTotalLength();
  trailFg.style.strokeDasharray = `${trailLen} ${trailLen}`;
}
function updateWalker() {
  if (!trailLen) return;
  const r = wrap.getBoundingClientRect();
  const p = clamp((innerHeight * .55 - r.top) / r.height, 0, 1);
  const L = p * trailLen;
  trailFg.style.strokeDashoffset = trailLen - L;
  const pt = trailFg.getPointAtLength(L), pt2 = trailFg.getPointAtLength(Math.min(trailLen, L + 2));
  const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI + 90;
  const bob = Math.sin(L / 14) * 6;
  walker.style.transform = `translate3d(${pt.x}px,${pt.y}px,0) rotate(${ang + bob}deg)`;
}

/* ------------------------------------------------------------------ */
/* 7. Hug-o-meter                                                      */
/* ------------------------------------------------------------------ */
const hugBtn = $('#hugBtn'), ring = $('#ringFg'), hugMsg = $('#hugMsg');
const RING = 2 * Math.PI * 100, HOLD = 1100;
const MSGS = ['Wata felt that.', 'Certified fluffy.', '+1 serotonin.', 'Wata is now 3% fluffier.', 'Baa-utiful hug.', 'Squeeze logged. Heart full.'];
let holdStart = 0, holdRaf = 0, prog = 0, mi = 0;
ring.style.strokeDasharray = RING; ring.style.strokeDashoffset = RING;
function holdTick(now) {
  if (holdStart) prog = Math.min(1, (now - holdStart) / HOLD);
  else prog = Math.max(0, prog - .06);
  ring.style.strokeDashoffset = RING * (1 - prog);
  if (prog >= 1) { complete(); return; }
  if (holdStart || prog > 0) holdRaf = requestAnimationFrame(holdTick);
}
function startHold() { if (holdStart) return; holdStart = performance.now(); hugBtn.classList.add('holding'); cancelAnimationFrame(holdRaf); holdRaf = requestAnimationFrame(holdTick); }
function endHold() { if (!holdStart) return; holdStart = 0; hugBtn.classList.remove('holding'); cancelAnimationFrame(holdRaf); holdRaf = requestAnimationFrame(holdTick); }
function complete() {
  holdStart = 0; prog = 0; hugBtn.classList.remove('holding');
  ring.style.strokeDashoffset = RING;
  hugMsg.textContent = MSGS[mi++ % MSGS.length];
  hug(1);
  const r = hugBtn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 14);
}
function burst(x, y, n) {
  if (RM) return;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div'); el.className = 'burst'; el.innerHTML = heartSvg;
    document.body.appendChild(el);
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 140, s = .6 + Math.random() * .9;
    el.animate([
      { transform: `translate(${x - 13}px,${y - 13}px) scale(.2)`, opacity: 1 },
      { transform: `translate(${x - 13 + Math.cos(a) * d}px,${y - 13 + Math.sin(a) * d - 40}px) scale(${s}) rotate(${(Math.random() - .5) * 60}deg)`, opacity: 0 }
    ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => el.remove();
  }
}
hugBtn.addEventListener('pointerdown', e => { e.preventDefault(); startHold(); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => hugBtn.addEventListener(ev, endHold));
hugBtn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
hugBtn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') endHold(); });
hugBtn.addEventListener('contextmenu', e => e.preventDefault());

// ambient world hugs
let hugsVisible = false;
new IntersectionObserver(es => { hugsVisible = es[0].isIntersecting; }).observe($('#hugs'));
setInterval(() => { if (hugsVisible && !RM) { globalHugs += 1 + Math.floor(Math.random() * 3); hugCountEl.textContent = globalHugs.toLocaleString('en-US'); } }, 1300);

/* ------------------------------------------------------------------ */
/* 8. Reveals, counters, nav                                           */
/* ------------------------------------------------------------------ */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  const n = e.target.querySelector('[data-count]');
  if (n) countUp(n);
}), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach(el => io.observe(el));
function countUp(el) {
  const to = +el.dataset.count;
  if (RM || to === 0) { el.textContent = to.toLocaleString('en-US'); return; }
  const t0 = performance.now(), dur = 1600;
  const tick = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(to * e).toLocaleString('en-US'); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

const nav = $('#nav');
function onScroll() { nav.classList.toggle('scrolled', scrollY > 40); updateWalker(); }
addEventListener('scroll', onScroll, { passive: true });

/* FAQ */
$$('.q').forEach(q => q.addEventListener('click', () => {
  const open = q.getAttribute('aria-expanded') === 'true';
  $$('.q').forEach(o => o.setAttribute('aria-expanded', 'false'));
  q.setAttribute('aria-expanded', String(!open));
}));

/* newsletter (demo) */
const form = $('#newsForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const inp = $('#email', form);
  if (!/^\S+@\S+\.\S+$/.test(inp.value)) { inp.classList.remove('bad'); inp.offsetWidth; inp.classList.add('bad'); inp.focus(); return; }
  form.classList.add('done');
  $('.news-done', form).textContent = "You're on the list. We'll nudge you softly on adoption morning.";
  const r = form.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 20, 12);
});

/* footer peekers */
$('#peek').innerHTML = [['mikan', 9, -8], ['sasa', 21, 5], ['wata', 35, -5], ['kuro', 53, -3], ['kinako', 77, 6]].map(([id, x, r]) =>
  `<div class="pk" style="left:${x}%;rotate:${r}deg">${svgUse(id)}</div>`).join('');

/* init after layout/fonts */
function init() { measure(); buildTrail(); onScroll(); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
addEventListener('load', init);
init();
})();
