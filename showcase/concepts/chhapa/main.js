/* CHHAPA छापा — hand-block printing atelier. Concept by Moryasshan. */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rand = (a, b) => a + Math.random() * (b - a);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const DEV = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

  /* ------------------------------------------------------------------
   * Motifs — every block is drawn here, 100×100 units.
   * draw(F, L): F paints the "datta" (fill block), L the "rekh" (outline block)
   * ------------------------------------------------------------------ */
  const ln = (L, w = 2) => `stroke="${L}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  const dot = (L, w = 3.4, gap = 6) => `stroke="${L}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="0 ${gap}" fill="none"`;
  const ring = (cx, cy, n, dist, rx, ry, L, sw = 1.4, off = 0) => {
    let s = '';
    for (let i = 0; i < n; i++) s += `<ellipse cx="${cx}" cy="${cy - dist}" rx="${rx}" ry="${ry}" transform="rotate(${off + i * 360 / n} ${cx} ${cy})" ${ln(L, sw)}/>`;
    return s;
  };
  const P_KAIRI = 'M50 90 C28 90 16 74 19 57 C22 40 38 33 50 29 C62 25 68 17 64 8 C78 14 84 30 82 47 C80 71 69 90 50 90 Z';
  const P_PET = 'M50 50 C41 41 41 25 50 15 C59 25 59 41 50 50 Z';
  const P_PET2 = 'M50 50 C45 45 45 36 50 30 C55 36 55 45 50 50 Z';
  const P_LEAF = 'M0 0 C5 -7 15 -8 23 0 C15 8 5 7 0 0 Z';
  const P_HIB = 'M50 50 C38 44 30 30 35 19 C39 13 45 17 50 13 C55 17 61 13 65 19 C70 30 62 44 50 50 Z';
  const P_FEATHER = 'M50 86 C45 70 43 52 50 34 C57 52 55 70 50 86 Z';

  const MOTIFS = {
    kairi: {
      name: 'Kairi', hi: 'कैरी', en: 'Paisley', meta: 'Sheesham · carved 1987 · 9 × 11 cm',
      draw(F, L) {
        let s = F !== 'none' ? `<path d="${P_KAIRI}" fill="${F}"/>` : '';
        if (L !== 'none') {
          s += `<path d="${P_KAIRI}" ${ln(L, 2.6)}/>
            <path d="${P_KAIRI}" ${dot(L, 3.4, 6.2)} transform="translate(50 58) scale(1.11) translate(-50 -58)"/>
            <path d="${P_KAIRI}" ${ln(L, 1.7)} transform="translate(52 63) scale(.68) translate(-50 -60)"/>
            <path d="${P_KAIRI}" ${dot(L, 2.4, 4.6)} transform="translate(52 64) scale(.5) translate(-50 -60)"/>
            ${ring(51, 67, 8, 6.5, 2.4, 4.6, L, 1.3)}<circle cx="51" cy="67" r="2.2" fill="${L}"/>
            <path d="M57 36 C63 32 67 25 66 17" ${ln(L, 1.4)}/><circle cx="66" cy="15" r="1.6" fill="${L}"/>`;
        }
        return s;
      }
    },
    bel: {
      name: 'Bel', hi: 'बेल', en: 'Vine leaf', meta: 'Rosewood · carved 1994 · 10 × 10 cm',
      draw(F, L) {
        const leaves = [[20, 82, -128, 1], [30, 69, -18, 0.95], [36, 57, -150, 1], [49, 48, -32, 1.05], [55, 36, -142, 0.95], [64, 26, -28, 0.9], [74, 15, -130, 0.8], [70, 58, 10, 0.75], [82, 52, -40, 0.7]];
        let s = '';
        if (L !== 'none') s += `<path d="M10 92 C28 76 24 60 40 52 C56 44 54 28 72 14 C76 11 80 10 86 10" ${ln(L, 2.6)}/><path d="M47 49 C58 56 70 60 84 52" ${ln(L, 1.8)}/>`;
        for (const [x, y, r, k] of leaves) {
          const tr = `transform="translate(${x} ${y}) rotate(${r}) scale(${k})"`;
          if (F !== 'none') s += `<path d="${P_LEAF}" fill="${F}" ${tr}/>`;
          if (L !== 'none') s += `<path d="${P_LEAF}" ${ln(L, 1.5)} ${tr}/><path d="M3 0 L19 0 M8 0 L12 -3.5 M8 0 L12 3.5 M13 0 L16 -2.5 M13 0 L16 2.5" ${ln(L, 0.9)} ${tr}/>`;
        }
        if (F !== 'none') s += `<circle cx="87" cy="10" r="4" fill="${F}"/><circle cx="12" cy="90" r="3.5" fill="${F}"/>`;
        if (L !== 'none') {
          s += `<circle cx="87" cy="10" r="4" ${ln(L, 1.3)}/><circle cx="12" cy="90" r="3.5" ${ln(L, 1.3)}/>
            <path d="M40 52 C33 55 28 50 31 45 C33 42 37 44 35 47" ${ln(L, 1.2)}/>
            <path d="M58 41 C66 40 69 46 65 49 C62 51 60 48 62 46" ${ln(L, 1.2)}/>
            <path d="M26 72 C20 66 23 60 28 62" ${ln(L, 1.2)}/>`;
          for (let i = 0; i < 9; i++) s += `<circle cx="${14 + i * 9}" cy="${96 - i * 1.2}" r="1.1" fill="${L}"/>`;
        }
        return s;
      }
    },
    chakra: {
      name: 'Phool Chakra', hi: 'फूल चक्र', en: 'Flower of life', meta: 'Sheesham · carved 1971 · ⌀ 10 cm',
      draw(F, L) {
        let s = '';
        if (F !== 'none') s += `<path fill-rule="evenodd" fill="${F}" d="M9 50a41 41 0 1 0 82 0a41 41 0 1 0 -82 0Z M20 50a30 30 0 1 0 60 0a30 30 0 1 0 -60 0Z"/><circle cx="50" cy="50" r="15" fill="${F}"/>`;
        if (L !== 'none') {
          s += `<circle cx="50" cy="50" r="41" ${ln(L, 2.4)}/><circle cx="50" cy="50" r="46.5" ${dot(L, 3.2, 6.08)}/><circle cx="50" cy="50" r="30" ${ln(L, 1.7)}/><circle cx="50" cy="50" r="15" ${ln(L, 1.5)}/>`;
          for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3;
            s += `<circle cx="${(50 + 15 * Math.cos(a)).toFixed(2)}" cy="${(50 + 15 * Math.sin(a)).toFixed(2)}" r="15" ${ln(L, 1.5)}/>`;
          }
          s += ring(50, 50, 16, 35.5, 1.9, 3.8, L, 1.3);
          s += `<circle cx="50" cy="50" r="2.6" fill="${L}"/>`;
        }
        return s;
      }
    },
    chaukor: {
      name: 'Chaukor', hi: 'चौकोर', en: 'Four-petal mandala', meta: 'Teak · carved 2003 · 10 × 10 cm',
      draw(F, L) {
        let s = '';
        const main = [0, 90, 180, 270], diag = [45, 135, 225, 315];
        if (F !== 'none') {
          main.forEach(r => { s += `<path d="${P_PET}" fill="${F}" transform="rotate(${r} 50 50)"/>`; });
          diag.forEach(r => { s += `<path d="${P_PET2}" fill="${F}" transform="rotate(${r} 50 50) translate(0 -7)"/>`; });
          s += `<circle cx="50" cy="50" r="6" fill="${F}"/>`;
          [[22, 22], [78, 22], [22, 78], [78, 78]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="5" fill="${F}"/>`; });
        }
        if (L !== 'none') {
          s += `<rect x="8" y="8" width="84" height="84" rx="3" ${ln(L, 2.4)}/><rect x="14.5" y="14.5" width="71" height="71" ${dot(L, 3, 5.9)}/>`;
          main.forEach(r => { s += `<path d="${P_PET}" ${ln(L, 1.8)} transform="rotate(${r} 50 50)"/><path d="M50 45 L50 22 M50 36 L45 30 M50 36 L55 30" ${ln(L, 1.1)} transform="rotate(${r} 50 50)"/>`; });
          diag.forEach(r => { s += `<path d="${P_PET2}" ${ln(L, 1.4)} transform="rotate(${r} 50 50) translate(0 -7)"/>`; });
          s += `<circle cx="50" cy="50" r="6" ${ln(L, 1.6)}/><circle cx="50" cy="50" r="1.8" fill="${L}"/>`;
          [[22, 22], [78, 22], [22, 78], [78, 78]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="5" ${ln(L, 1.3)}/><circle cx="${x}" cy="${y}" r="1.4" fill="${L}"/>`; });
        }
        return s;
      }
    },
    gudhal: {
      name: 'Gudhal', hi: 'गुड़हल', en: 'Hibiscus', meta: 'Sheesham · carved 1979 · 11 × 11 cm',
      draw(F, L) {
        let s = '';
        for (let i = 0; i < 5; i++) {
          const tr = `transform="rotate(${i * 72 + 8} 50 50)"`;
          if (F !== 'none') s += `<path d="${P_HIB}" fill="${F}" ${tr}/>`;
          if (L !== 'none') s += `<path d="${P_HIB}" ${ln(L, 2)} ${tr}/><path d="M50 45 L50 20 M50 42 C46 35 42 28 40 22 M50 42 C54 35 58 28 60 22" ${ln(L, 0.95)} ${tr}/>`;
        }
        if (F !== 'none') s += `<circle cx="50" cy="50" r="7" fill="${F}"/>`;
        if (L !== 'none') {
          s += `<circle cx="50" cy="50" r="46" ${dot(L, 3, 6.02)}/><circle cx="50" cy="50" r="7" ${ln(L, 1.6)}/>${ring(50, 50, 10, 11, 1.1, 2, L, 1)}
            <path d="M50 50 C56 42 62 36 71 30" ${ln(L, 1.8)}/>
            <circle cx="71" cy="30" r="2" fill="${L}"/><circle cx="74.5" cy="26" r="1.6" fill="${L}"/><circle cx="67" cy="27" r="1.6" fill="${L}"/><circle cx="74" cy="33" r="1.4" fill="${L}"/>`;
        }
        return s;
      }
    },
    mor: {
      name: 'Mor Pankh', hi: 'मोर पंख', en: 'Peacock fan', meta: 'Sheesham · carved 1965 · 12 × 9 cm',
      draw(F, L) {
        let s = '';
        for (let i = 0; i < 9; i++) {
          const tr = `transform="rotate(${-56 + i * 14} 50 86)"`;
          if (F !== 'none') s += `<path d="${P_FEATHER}" fill="${F}" ${tr}/>`;
          if (L !== 'none') s += `<path d="${P_FEATHER}" ${ln(L, 1.6)} ${tr}/><circle cx="50" cy="45" r="4" ${ln(L, 1.3)} ${tr}/><circle cx="50" cy="45" r="1.3" fill="${L}" ${tr}/><circle cx="50" cy="28.5" r="1.9" fill="${L}" ${tr}/>`;
        }
        if (F !== 'none') s += `<path d="M31 86 A19 19 0 0 1 69 86 Z" fill="${F}"/>`;
        if (L !== 'none') s += `<path d="M31 86 A19 19 0 0 1 69 86 Z" ${ln(L, 2)}/><path d="M39 86 A11 11 0 0 1 61 86" ${ln(L, 1.3)}/><path d="M24 86 A26 26 0 0 1 76 86" ${dot(L, 2.6, 5.4)}/><path d="M14 92 L86 92" ${dot(L, 2.6, 5)}/><circle cx="50" cy="86" r="2" fill="${L}"/>`;
        return s;
      }
    }
  };
  const ORDER = ['kairi', 'chakra', 'chaukor', 'bel', 'gudhal', 'mor'];
  const motif = (name, F, L) => `<g transform="translate(50 50) scale(.9) translate(-50 -50)">${MOTIFS[name].draw(F, L)}</g>`;

  function carvedBlock(name, ink, round) {
    const isRound = round ?? name === 'chakra';
    const body = isRound
      ? (fill, dy = 0, extra = '') => `<circle cx="50" cy="${50 + dy}" r="62" fill="${fill}" ${extra}/>`
      : (fill, dy = 0, extra = '') => `<rect x="-12" y="${-12 + dy}" width="124" height="124" rx="10" fill="${fill}" ${extra}/>`;
    return `<svg viewBox="-14 -14 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${body('url(#woodSide)', 7)}
      ${body('url(#woodGrad)')}
      ${body('#fff', 0, 'filter="url(#woodGrain)" opacity=".85"')}
      ${isRound ? '<circle cx="50" cy="50" r="59" fill="none" stroke="rgba(255,226,180,.35)"/>' : '<rect x="-9" y="-9" width="118" height="118" rx="8" fill="none" stroke="rgba(255,226,180,.35)"/>'}
      <g opacity=".5">${motif(name, '#4e2a12', 'none')}</g>
      <g transform="translate(1.3 1.6)">${motif(name, 'none', '#36180a')}</g>
      <g transform="translate(-.6 -.7)">${motif(name, 'none', '#f4cf9c')}</g>
      ${motif(name, 'none', '#b47a46')}
      ${ink ? `<g opacity=".62">${motif(name, 'none', ink)}</g>` : ''}
    </svg>`;
  }

  const potSVG = c => `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="42" rx="15" ry="3.5" fill="rgba(0,0,0,.35)"/><path d="M9 19 C4 34 13 43 24 43 C35 43 44 34 39 19 Z" fill="url(#potGlaze)"/><path d="M13 30 C17 33 31 33 35 30" stroke="rgba(255,220,180,.3)" fill="none"/><path d="M10.5 25 C16 29.5 32 29.5 37.5 25" stroke="#f3e3c8" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="0 3.2" fill="none"/><ellipse cx="24" cy="18.5" rx="15.5" ry="5.6" fill="#5e260d"/><ellipse cx="24" cy="18.5" rx="12.6" ry="4.1" fill="${c}"/><ellipse cx="20" cy="17.4" rx="4" ry="1.1" fill="rgba(255,255,255,.4)"/></svg>`;

  // a pattern <defs> entry: motif repeated with a half-drop "butti" between
  function patternDef(id, name, F, L, bg, size, opts = {}) {
    const s = size, k = s / 100;
    const small = opts.small || name;
    const sk = (opts.smallScale || 0.42) * k;
    const sF = opts.sF || F, sL = opts.sL || L;
    const at = (x, y, sc, nm, f, l, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc}) translate(-50 -50)">${motif(nm, f, l)}</g>`;
    let inner = `<rect width="${s}" height="${s}" fill="${bg}"/>` + at(s / 2, s / 2, k * 0.86, name, F, L, opts.rot || 0);
    if (!opts.noButti) for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s]]) inner += at(x, y, sk, small, sF, sL);
    return `<pattern id="${id}" x="${opts.x || 0}" y="${opts.y || 0}" width="${s}" height="${s}" patternUnits="userSpaceOnUse" ${opts.transform ? `patternTransform="${opts.transform}"` : ''}>${inner}</pattern>`;
  }

  const DYES = [
    { id: 'laal', name: 'Laal — madder red', c: '#e8432d', line: '#f3e3c8' },
    { id: 'hara', name: 'Hara — leaf green', c: '#2f8f4e', line: '#f3e3c8' },
    { id: 'narangi', name: 'Narangi — turmeric orange', c: '#f08a24', line: '#f3e3c8' },
    { id: 'neel', name: 'Neel — indigo', c: '#4a63c4', line: '#f3e3c8' },
    { id: 'kora', name: 'Kora — unbleached cream', c: '#f3e3c8', line: '#a8241a' }
  ];

  /* ------------------------------------------------------------------
   * Weave texture (generated)
   * ------------------------------------------------------------------ */
  function makeWeave(size, base) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 2) { x.fillStyle = Math.random() < 0.5 ? `rgba(255,214,196,${Math.random() * 0.06})` : `rgba(18,0,6,${Math.random() * 0.12})`; x.fillRect(0, y, size, 1); }
    for (let i = 0; i < size; i += 2) { x.fillStyle = Math.random() < 0.5 ? `rgba(255,214,196,${Math.random() * 0.05})` : `rgba(18,0,6,${Math.random() * 0.1})`; x.fillRect(i, 0, 1, size); }
    for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,215,190,${rand(0.03, 0.09)})`; x.fillRect(rand(0, size - 20), (Math.random() * size) | 0, rand(4, 20), 1); }
    for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(20,0,6,${rand(0.06, 0.14)})`; x.fillRect((Math.random() * size) | 0, rand(0, size - 20), 1, rand(4, 16)); }
    const id = x.getImageData(0, 0, size, size), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(id, 0, 0);
    return c;
  }
  const weave = makeWeave(256, '#6e0f2a');
  const weaveURL = weave.toDataURL('image/png');
  document.documentElement.style.setProperty('--weave', `url(${weaveURL})`);

  // ink tooth: speckle + thread gaps, punched out of every print
  const inkTex = document.createElement('canvas'); inkTex.width = inkTex.height = 160;
  (() => {
    const x = inkTex.getContext('2d');
    const im = x.createImageData(160, 160);
    for (let i = 0; i < im.data.length; i += 4) { const r = Math.random(); im.data[i + 3] = r < 0.1 ? 235 : r < 0.3 ? 105 : 0; }
    x.putImageData(im, 0, 0);
    for (let y = 0; y < 160; y += 2) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.34})`; x.fillRect(0, y, 160, 1); }
    for (let i = 0; i < 160; i += 2) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.16})`; x.fillRect(i, 0, 1, 160); }
    for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(0,0,0,.6)'; x.beginPath(); x.ellipse(rand(0, 160), rand(0, 160), rand(1, 5), rand(0.6, 2.4), rand(0, 3), 0, 7); x.fill(); }
  })();

  /* ------------------------------------------------------------------
   * The printing table
   * ------------------------------------------------------------------ */
  const hero = document.getElementById('hero');
  const cloth = document.getElementById('cloth');
  const cctx = cloth.getContext('2d');
  const blockEl = document.getElementById('blockCursor');
  const blockArt = blockEl.querySelector('.block-art');
  const tag = document.getElementById('tag');
  const bench = document.querySelector('.bench');
  const hint = document.querySelector('.hint');
  const impEl = document.getElementById('impressions');
  const repeatBtn = document.getElementById('repeatBtn');
  const washBtn = document.getElementById('washBtn');

  hero.style.backgroundImage = `radial-gradient(55% 60% at 70% 40%, rgba(150,26,58,.35), transparent 70%), radial-gradient(50% 50% at 15% 85%, rgba(40,2,14,.4), transparent 70%), url(${weaveURL})`;
  hero.style.backgroundSize = 'auto, auto, 256px 256px';

  let W = 0, H = 0, stampSize = 100, bs = 128;
  const state = { motif: 'kairi', dye: DYES[0] };
  let impressions = 0;

  function sizeCloth() {
    const w = hero.clientWidth, h = hero.clientHeight;
    if (w === W && h === H) return;
    const old = W ? (() => { const c = document.createElement('canvas'); c.width = cloth.width; c.height = cloth.height; c.getContext('2d').drawImage(cloth, 0, 0); return c; })() : null;
    W = w; H = h;
    cloth.width = Math.round(W * DPR); cloth.height = Math.round(H * DPR);
    if (old) cctx.drawImage(old, 0, 0);
    stampSize = W < 760 ? 74 : W < 1100 ? 88 : 100;
    bs = Math.round(stampSize * 1.28);
    blockEl.style.setProperty('--bs', bs + 'px');
  }
  sizeCloth();

  // rasterised masks for each motif (white), tinted at stamp time
  const masks = {};
  const maskPromises = ORDER.map(name => {
    const mk = inner => {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 100 100">${inner}</svg>`);
      return img;
    };
    const m = masks[name] = { fill: mk(motif(name, '#fff', 'none')), line: mk(motif(name, 'none', '#fff')), ready: false };
    return Promise.all([m.fill.decode(), m.line.decode()]).then(() => { m.ready = true; }).catch(() => { m.ready = true; });
  });

  const tA = document.createElement('canvas'), tB = document.createElement('canvas');
  const xA = tA.getContext('2d'), xB = tB.getContext('2d');
  const patA = xA.createPattern(inkTex, 'repeat'), patB = xB.createPattern(inkTex, 'repeat');
  function tinted(cv, x, pat, img, color, s, tooth) {
    if (cv.width !== s) { cv.width = cv.height = s; } else x.clearRect(0, 0, s, s);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    x.drawImage(img, 0, 0, s, s);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color; x.fillRect(0, 0, s, s);
    x.globalCompositeOperation = 'destination-out';
    const ox = Math.random() * 160, oy = Math.random() * 160;
    x.save(); x.translate(-ox, -oy); x.globalAlpha = tooth; x.fillStyle = pat; x.fillRect(ox, oy, s, s); x.restore();
    // uneven hand pressure: one side prints lighter
    const a = Math.random() * Math.PI * 2, h = s / 2;
    const g = x.createLinearGradient(h + Math.cos(a) * h, h + Math.sin(a) * h, h - Math.cos(a) * h, h - Math.sin(a) * h);
    g.addColorStop(0, `rgba(0,0,0,${rand(0.15, 0.5)})`); g.addColorStop(0.55, 'rgba(0,0,0,0)');
    x.globalAlpha = 1; x.fillStyle = g; x.fillRect(0, 0, s, s);
    // patchy ink pickup from the felt pad
    for (let i = 0; i < 3; i++) {
      const cx = rand(0, s), cy = rand(0, s), rr = rand(0.12, 0.3) * s;
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
      rg.addColorStop(0, `rgba(0,0,0,${rand(0.2, 0.5) * tooth})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = rg; x.fillRect(0, 0, s, s);
    }
    x.globalCompositeOperation = 'source-over';
    return cv;
  }

  function stamp(x, y, o = {}) {
    const name = o.motif || state.motif, dye = o.dye || state.dye;
    const m = masks[name];
    if (!m || !m.ready) return;
    const size = o.size || stampSize;
    const s = Math.round(size * DPR);
    const rot = o.rot ?? rand(-0.09, 0.09);
    const F = tinted(tA, xA, patA, m.fill, dye.c, s, rand(0.6, 1));
    const L = tinted(tB, xB, patB, m.line, dye.line, s, rand(0.45, 0.85));
    cctx.save();
    cctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cctx.translate(x, y); cctx.rotate(rot);
    const h = size / 2;
    // ink bleed into the threads
    cctx.globalAlpha = 0.2; cctx.filter = 'blur(2.2px)';
    cctx.drawImage(F, -h, -h, size, size);
    cctx.filter = 'none';
    // imperfect registration between the fill block and the outline block
    const rx = o.reg ?? rand(-2.6, 2.6), ry = o.reg ?? rand(-2.6, 2.6);
    cctx.globalAlpha = rand(0.84, 0.96);
    cctx.drawImage(F, -h + rx, -h + ry, size, size);
    cctx.globalAlpha = rand(0.86, 0.98);
    cctx.drawImage(L, -h, -h, size, size);
    cctx.restore();
    impressions++;
    impEl.textContent = impressions.toLocaleString('en-IN');
    if (!RM && !o.quiet) {
      const wEl = document.createElement('div');
      wEl.className = 'wet';
      wEl.style.cssText = `left:${x - h}px;top:${y - h}px;width:${size}px;height:${size}px`;
      hero.appendChild(wEl);
      setTimeout(() => wEl.remove(), 1700);
    }
  }

  /* ---------- the block that follows the hand ---------- */
  let bx = -500, by = -500, tx = -500, ty = -500, raf = 0, follow = 0.32, baseRot = -4, shown = false;
  function renderBlock() {
    blockArt.innerHTML = carvedBlock(state.motif, state.dye.c);
  }
  function tick() {
    bx += (tx - bx) * follow; by += (ty - by) * follow;
    const tilt = clamp((tx - bx) * 0.12, -10, 10);
    blockEl.style.transform = `translate3d(${bx - bs / 2}px, ${by - bs / 2}px, 0) rotate(${baseRot + tilt}deg)`;
    if (Math.abs(tx - bx) > 0.3 || Math.abs(ty - by) > 0.3) raf = requestAnimationFrame(tick);
    else raf = 0;
  }
  function moveTo(x, y, instant) {
    tx = x; ty = y;
    if (instant || RM) { bx = x; by = y; }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function show(on) { shown = on; blockEl.classList.toggle('on', on); }

  let pressing = false;
  function press(x, y, o) {
    if (pressing && !o) return;
    pressing = true;
    blockEl.classList.add('down');
    setTimeout(() => stamp(x, y, o), RM ? 0 : 70);
    setTimeout(() => { blockEl.classList.remove('down'); pressing = false; }, RM ? 0 : 170);
    if (!o && hint) hint.classList.add('gone');
  }

  const overUI = e => tag.contains(e.target) || bench.contains(e.target);
  const local = e => { const r = hero.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  hero.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || repeating) return;
    if (overUI(e)) { show(false); return; }
    const [x, y] = local(e);
    if (!shown) { moveTo(x, y, true); show(true); } else moveTo(x, y);
  });
  hero.addEventListener('pointerleave', () => { if (!repeating) show(false); });
  cloth.addEventListener('pointerdown', e => {
    if (e.button !== 0 || repeating) return;
    const [x, y] = local(e);
    if (e.pointerType === 'touch') { moveTo(x, y, true); show(true); setTimeout(() => { if (!repeating) show(false); }, 700); }
    else moveTo(x, y, true);
    press(x, y);
  });
  cloth.addEventListener('focus', () => { if (!shown) { moveTo(W * 0.62, H * 0.48, true); show(true); } });
  cloth.addEventListener('blur', () => { if (!repeating) show(false); });
  cloth.addEventListener('keydown', e => {
    const step = e.shiftKey ? 60 : 20;
    const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (k) { e.preventDefault(); moveTo(clamp(tx + k[0], 0, W), clamp(ty + k[1], 0, H)); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(tx, ty); }
  });

  /* ---------- tools: blocks + dye pots ---------- */
  const blockPicker = document.getElementById('blockPicker');
  const potPicker = document.getElementById('potPicker');
  function radio(group, btn) {
    group.querySelectorAll('.pick').forEach(b => { b.setAttribute('aria-checked', b === btn ? 'true' : 'false'); b.tabIndex = b === btn ? 0 : -1; });
  }
  function radioKeys(group) {
    group.addEventListener('keydown', e => {
      const items = [...group.querySelectorAll('.pick')];
      const i = items.indexOf(document.activeElement);
      if (i < 0) return;
      const d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = items[(i + d + items.length) % items.length];
      n.focus(); n.click();
    });
  }
  ORDER.forEach((name, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pick'; b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', `${MOTIFS[name].name} (${MOTIFS[name].en}) block`);
    b.innerHTML = carvedBlock(name) + `<span class="tip">${MOTIFS[name].name} · ${MOTIFS[name].en}</span>`;
    b.addEventListener('click', () => { state.motif = name; radio(blockPicker, b); renderBlock(); });
    blockPicker.appendChild(b);
    if (!i) radio(blockPicker, b);
  });
  DYES.forEach((d, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pick pot'; b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', `${d.name} dye`);
    b.innerHTML = potSVG(d.c) + `<span class="tip">${d.name}</span>`;
    b.addEventListener('click', () => { state.dye = d; radio(potPicker, b); renderBlock(); });
    potPicker.appendChild(b);
    if (!i) radio(potPicker, b);
  });
  radioKeys(blockPicker); radioKeys(potPicker);
  renderBlock();

  /* ---------- repeat print & wash ---------- */
  let repeating = false;
  function covered(x, y) {
    const hr = hero.getBoundingClientRect();
    for (const el of [tag, bench]) {
      const r = el.getBoundingClientRect();
      if (x > r.left - hr.left + 30 && x < r.right - hr.left - 30 && y > r.top - hr.top + 30 && y < r.bottom - hr.top - 30) return true;
    }
    return false;
  }
  async function repeatPrint() {
    if (repeating) { repeating = false; return; }
    repeating = true;
    repeatBtn.classList.add('running'); repeatBtn.querySelector('span').textContent = 'Stop';
    repeatBtn.setAttribute('aria-pressed', 'true');
    hint && hint.classList.add('gone');
    const g = stampSize * 1.04, rowH = g * 0.92;
    const cols = Math.ceil(W / g) + 1, rows = Math.ceil(H / rowH) + 1;
    follow = 0.55; show(true);
    moveTo(g * 0.3, rowH * 0.3, false);
    outer:
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!repeating) break outer;
        const x = c * g + (r % 2 ? g / 2 : 0) + g * 0.25 + rand(-1.5, 1.5);
        const y = r * rowH + g * 0.3 + rand(-1.5, 1.5);
        if (x > W + g / 2 || covered(x, y)) continue;
        moveTo(x, y);
        await wait(RM ? 0 : 40);
        press(x, y, { rot: rand(-0.03, 0.03) });
        await wait(RM ? 5 : 80);
      }
    }
    repeating = false; follow = 0.32;
    repeatBtn.classList.remove('running'); repeatBtn.querySelector('span').textContent = 'Repeat print';
    repeatBtn.setAttribute('aria-pressed', 'false');
    show(false);
  }
  repeatBtn.setAttribute('aria-pressed', 'false');
  repeatBtn.addEventListener('click', repeatPrint);
  washBtn.addEventListener('click', () => {
    repeating = false;
    const done = () => { cctx.setTransform(1, 0, 0, 1, 0, 0); cctx.clearRect(0, 0, cloth.width, cloth.height); impressions = 0; impEl.textContent = '0'; cloth.style.transition = 'opacity .6s'; cloth.style.opacity = 1; cloth.style.filter = ''; };
    if (RM) return done();
    cloth.style.transition = 'opacity .8s, filter .8s'; cloth.style.opacity = 0; cloth.style.filter = 'blur(6px) saturate(.6)';
    setTimeout(done, 820);
  });

  // a cloth already half-printed when you arrive: a two-block jaal on the right
  Promise.all(maskPromises).then(async () => {
    const g = stampSize * 1.06, rowH = g * 0.95;
    const x0 = W < 760 ? 0 : W * 0.55;
    const spots = [];
    for (let r = 0; r * rowH < H + g; r++) {
      for (let c = 0; x0 + c * g < W + g; c++) {
        spots.push({ x: x0 + c * g + g * 0.5, y: r * rowH + g * 0.3, main: true });
        spots.push({ x: x0 + c * g + g, y: r * rowH + g * 0.3 + rowH / 2, main: false });
      }
    }
    const mobileSkip = W < 760;
    for (const p of spots) {
      if (mobileSkip && p.y < H * 0.5) continue;
      if (covered(p.x, p.y)) continue;
      if (p.main) stamp(p.x + rand(-3, 3), p.y + rand(-3, 3), { motif: 'kairi', dye: DYES[0], rot: rand(-0.07, 0.07), quiet: true });
      else stamp(p.x + rand(-2, 2), p.y + rand(-2, 2), { motif: 'chakra', dye: DYES[2], size: stampSize * 0.46, rot: rand(-0.3, 0.3), quiet: true });
      if (!RM) await wait(28);
    }
  });

  /* ------------------------------------------------------------------
   * Craft: four illustrated panels + horizontal pinned scroll
   * ------------------------------------------------------------------ */
  const ART = {
    carve() {
      let shav = '';
      const shavings = [[300, 300, 0.9, 10], [330, 270, 0.7, -30], [270, 330, 1, 40], [345, 320, 0.6, 80], [250, 300, 0.7, -60]];
      for (const [x, y, k, r] of shavings) shav += `<path transform="translate(${x} ${y}) rotate(${r}) scale(${k})" d="M0 0 C10 -14 30 -12 32 2 C34 14 18 18 12 10 C8 4 14 -2 20 2" fill="none" stroke="#e1ad72" stroke-width="3" stroke-linecap="round"/>`;
      return `<svg viewBox="0 0 400 400" aria-hidden="true">
        <defs>${patternDef('pcarve', 'chaukor', '#2f8f4e', '#f3e3c8', '#6e0f2a', 46, { small: 'gudhal', sF: '#f08a24' })}</defs>
        <ellipse cx="190" cy="330" rx="160" ry="26" fill="rgba(0,0,0,.35)"/>
        <g transform="translate(36 70) rotate(-7 150 120)">
          <svg x="0" y="0" width="290" height="290" viewBox="-14 -14 128 128" overflow="visible">${carvedBlock('chaukor', null, false).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
        </g>
        <g transform="rotate(38 300 110)">
          <rect x="286" y="10" width="26" height="120" rx="10" fill="url(#woodGrad)"/>
          <rect x="286" y="10" width="26" height="120" rx="10" fill="#fff" filter="url(#woodGrain)" opacity=".7"/>
          <rect x="284" y="124" width="30" height="10" rx="3" fill="#c9a24a"/>
          <rect x="292" y="134" width="14" height="74" fill="#cfcac0"/>
          <path d="M292 208 L306 208 L299 228 Z" fill="#efebe3"/>
          <rect x="292" y="134" width="5" height="74" fill="rgba(255,255,255,.45)"/>
        </g>
        ${shav}
        <g opacity=".9"><rect x="40" y="356" width="320" height="22" rx="3" fill="url(#pcarve)"/></g>
      </svg>`;
    },
    dye() {
      const pot = (x, y, k, c) => `<g transform="translate(${x} ${y}) scale(${k})">${potSVG(c).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
      let drips = '';
      for (let i = 0; i < 5; i++) drips += `<circle class="drip" style="animation-delay:${i * 0.4}s" cx="250" cy="${152 + i * 4}" r="${4 - i * 0.4}" fill="#e8432d"/>`;
      return `<svg viewBox="0 0 400 400" aria-hidden="true">
        <ellipse cx="200" cy="350" rx="170" ry="22" fill="rgba(0,0,0,.35)"/>
        <g class="steam" fill="none" stroke="rgba(243,227,200,.45)" stroke-width="3" stroke-linecap="round">
          <path d="M110 150 C100 130 122 118 110 96 C100 78 116 64 110 50"/>
          <path d="M290 170 C280 150 302 138 290 116 C280 98 296 84 290 70"/>
        </g>
        ${pot(20, 140, 4.4, '#4a63c4')}
        ${pot(196, 160, 4.2, '#f08a24')}
        ${pot(108, 200, 3.4, '#e8432d')}
        <g transform="rotate(-24 230 100)">
          <rect x="226" y="20" width="10" height="120" rx="5" fill="url(#woodGrad)"/>
          <path d="M210 140 C210 160 252 160 252 140 Z" fill="#7a4a26"/>
          <path d="M214 141 C216 152 246 152 248 141 Z" fill="#e8432d"/>
        </g>
        ${drips}
      </svg>`;
    },
    stamp() {
      const fresh = `<g transform="translate(258.5 199.5) scale(${0.89 * 0.86}) translate(-50 -50)">${motif('kairi', '#e8432d', '#f3e3c8')}</g>`;
      return `<svg viewBox="0 0 400 400" aria-hidden="true">
        <defs>
          ${patternDef('pstamp', 'kairi', '#e8432d', '#f3e3c8', '#6e0f2a', 89, { small: 'chakra', sF: '#f08a24', x: 36, y: 66 })}
          <clipPath id="printedClip"><rect x="36" y="66" width="328" height="89"/><rect x="36" y="155" width="178" height="89"/></clipPath>
        </defs>
        <rect x="8" y="38" width="384" height="324" rx="10" fill="url(#woodGrad)"/>
        <rect x="8" y="38" width="384" height="324" rx="10" fill="#fff" filter="url(#woodGrain)" opacity=".75"/>
        <rect x="36" y="66" width="328" height="268" fill="#6e0f2a"/>
        <rect x="36" y="66" width="328" height="268" fill="url(#pstamp)" clip-path="url(#printedClip)"/>
        <g class="fresh">${fresh}</g>
        <rect x="36" y="66" width="328" height="268" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
        <g transform="translate(300 300)">
          <rect x="0" y="0" width="70" height="44" rx="4" fill="#3b200e"/>
          <rect x="5" y="5" width="60" height="34" rx="2" fill="#e8432d"/>
          <rect x="5" y="5" width="60" height="34" rx="2" fill="#fff" filter="url(#woodGrain)" opacity=".25"/>
        </g>
        <g class="press-shadow"><rect x="220" y="166" width="88" height="88" rx="8" fill="rgba(20,0,6,.45)"/></g>
        <g class="press-body">
          <rect x="216.5" y="157.5" width="84" height="84" rx="7" fill="url(#woodSide)"/>
          <rect x="216.5" y="153.5" width="84" height="84" rx="7" fill="url(#woodGrad)"/>
          <rect x="216.5" y="153.5" width="84" height="84" rx="7" fill="#fff" filter="url(#woodGrain)" opacity=".85"/>
          <rect x="219.5" y="156.5" width="78" height="78" rx="5" fill="none" stroke="rgba(255,226,180,.4)"/>
          <circle cx="258.5" cy="195.5" r="21" fill="#4e2a12" opacity=".5"/>
          <circle cx="258.5" cy="193.5" r="19" fill="url(#woodGrad)"/>
          <circle cx="258.5" cy="193.5" r="13" fill="none" stroke="rgba(255,226,180,.45)" stroke-width="1.5"/>
          <ellipse cx="253" cy="187" rx="6" ry="3" fill="rgba(255,240,210,.35)"/>
        </g>
      </svg>`;
    },
    wash() {
      let waves = '';
      for (let i = 0; i < 6; i++) {
        const y = 250 + i * 22;
        waves += `<path class="wave" style="animation-delay:${-i * 0.6}s" d="M-40 ${y} C 0 ${y - 10}, 40 ${y - 10}, 80 ${y} S 160 ${y + 10}, 200 ${y} S 280 ${y - 10}, 320 ${y} S 400 ${y + 10}, 440 ${y}" fill="none" stroke="${i % 2 ? '#4a63c4' : '#f3e3c8'}" stroke-opacity="${0.75 - i * 0.08}" stroke-width="3" stroke-linecap="round"/>`;
      }
      let rays = '';
      for (let i = 0; i < 16; i++) rays += `<path d="M300 96 L300 54" transform="rotate(${i * 22.5} 300 96)" stroke="#f08a24" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 7"/>`;
      return `<svg viewBox="0 0 400 400" aria-hidden="true">
        <defs>${patternDef('pwash', 'gudhal', '#e8432d', '#6e0f2a', '#f3e3c8', 54, { small: 'bel', sF: '#2f8f4e' })}</defs>
        <g class="sun">${rays}<circle cx="300" cy="96" r="30" fill="#f08a24"/><circle cx="300" cy="96" r="22" fill="none" stroke="#6e0f2a" stroke-width="2" stroke-dasharray="0 5" stroke-linecap="round"/></g>
        <path d="M30 120 L190 120" stroke="#b98252" stroke-width="5" stroke-linecap="round"/>
        <path class="cloth-flow" d="M50 120 L170 120 C176 170 160 220 186 262 C210 300 250 296 300 312 C330 322 352 330 380 326 L370 352 C320 360 270 344 230 330 C180 312 150 290 128 250 C108 214 52 180 50 120 Z" fill="url(#pwash)"/>
        <path d="M50 120 C52 180 108 214 128 250 C150 290 180 312 230 330 C270 344 320 360 370 352" fill="none" stroke="rgba(110,15,42,.4)" stroke-width="2"/>
        ${waves}
      </svg>`;
    }
  };
  document.querySelectorAll('.panel-art').forEach(el => { el.innerHTML = ART[el.dataset.art](); });
  // small CSS for the panel animations, kept beside the art that needs it
  const st = document.createElement('style');
  st.textContent = `
    .press-body,.press-shadow{transform-box:fill-box;transform-origin:center}
    .panel.live .press-body{animation:pb 1.8s cubic-bezier(.6,0,.3,1) infinite}
    .panel.live .press-shadow{animation:ps 1.8s cubic-bezier(.6,0,.3,1) infinite}
    .panel.live .fresh{animation:fr 1.8s steps(1) infinite}
    @keyframes pb{0%,100%{transform:translate(-26px,-30px) scale(1.14)}45%,58%{transform:none}}
    @keyframes ps{0%,100%{transform:translate(10px,14px) scale(1.04);opacity:.45}45%,58%{transform:none;opacity:1}}
    @keyframes fr{0%{opacity:0}52%{opacity:1}}
    .panel.live .wave{animation:wv 4s ease-in-out infinite alternate}
    @keyframes wv{to{transform:translateX(-40px)}}
    .panel.live .steam path{animation:stm 3s ease-in-out infinite alternate}
    @keyframes stm{to{transform:translateY(-12px);opacity:.3}}
    .panel.live .drip{animation:drip 2s ease-in infinite}
    @keyframes drip{0%{transform:translateY(0);opacity:1}100%{transform:translateY(120px);opacity:0}}
    .sun{transform-box:fill-box;transform-origin:center}
    .panel.live .sun{animation:spin 30s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media (prefers-reduced-motion:reduce){.panel.live *{animation:none!important}}`;
  document.head.appendChild(st);

  const craft = document.getElementById('craft');
  const track = document.getElementById('craftTrack');
  const bar = document.getElementById('craftBar');
  const num = document.getElementById('craftNum');
  const panels = [...track.children];
  function craftScroll() {
    const r = craft.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
    const max = track.scrollWidth - innerWidth;
    // ease between panels so each one "settles"
    const seg = p * 3, i = Math.floor(seg), f = seg - i;
    const eased = i + (f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2);
    const pos = Math.min(3, eased) / 3;
    track.style.transform = `translate3d(${-pos * max}px,0,0)`;
    bar.style.transform = `scaleX(${p})`;
    const idx = Math.round(seg);
    num.textContent = DEV[idx + 1];
    panels.forEach((pn, k) => pn.classList.toggle('live', Math.abs(k - seg) < 0.75 && r.top < innerHeight && r.bottom > 0));
  }

  /* ------------------------------------------------------------------
   * Block library
   * ------------------------------------------------------------------ */
  const BACKS = {
    kairi: ['#e8432d', '#f3e3c8', '#6e0f2a', 'chakra', '#f08a24', 'Rekh + datta · 2 colours · madder & cream'],
    chakra: ['#f08a24', '#f3e3c8', '#22306b', 'mor', '#e8432d', 'Printed on indigo dabu ground · 2 colours'],
    chaukor: ['#2f8f4e', '#f3e3c8', '#6e0f2a', 'chakra', '#f08a24', 'The quilt block · 3 colours'],
    bel: ['#2f8f4e', '#6e0f2a', '#f3e3c8', 'gudhal', '#e8432d', 'Border & runner vine · 2 colours'],
    gudhal: ['#e8432d', '#2c0510', '#f3e3c8', 'bel', '#2f8f4e', 'Sanganeri bloom on kora cotton · 3 colours'],
    mor: ['#f08a24', '#f3e3c8', '#6e0f2a', 'kairi', '#e8432d', 'Our oldest block · 2 colours']
  };
  const grid = document.getElementById('blockGrid');
  ORDER.forEach((name, i) => {
    const M = MOTIFS[name], b = BACKS[name];
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'bcard rv';
    card.style.transitionDelay = (i % 3) * 0.1 + 's';
    card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', `${M.name}, ${M.en} block. ${M.meta}. Show printed pattern.`);
    card.innerHTML = `<span class="bcard-in">
      <span class="bface bfront"><span class="flip-hint">Turn over ↻</span><span class="bart">${carvedBlock(name)}</span>
        <span class="bname"><span class="bt">${M.name}</span><span lang="hi">${M.hi}</span></span><span class="bmeta">${M.en} · ${M.meta}</span></span>
      <span class="bface bback"><svg viewBox="0 0 300 375" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${patternDef('bp-' + name, name, b[0], b[1], b[2], 92, { small: b[3], sF: b[4], sL: b[1] })}</defs><rect width="300" height="375" fill="url(#bp-${name})"/></svg>
        <span class="blabel"><b>${M.name} <span lang="hi">${M.hi}</span></b>${b[5]}</span></span>
    </span>`;
    card.addEventListener('click', () => { const f = card.classList.toggle('flip'); card.setAttribute('aria-pressed', f); });
    grid.appendChild(card);
  });

  /* ------------------------------------------------------------------
   * Products (drawn) + bag
   * ------------------------------------------------------------------ */
  const PRODUCT = {
    dupatta() {
      let tassels = '';
      for (let i = 0; i < 13; i++) {
        const x = 92 + i * 18, y = 352 + Math.sin(i * 0.9) * 4;
        tassels += `<path d="M${x} ${y} L${x + 1} ${y + 18}" stroke="#f3e3c8" stroke-width="2"/><circle cx="${x + 1}" cy="${y + 21}" r="3.6" fill="${i % 2 ? '#f08a24' : '#e8432d'}"/>`;
      }
      return `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          ${patternDef('pd', 'kairi', '#e8432d', '#f3e3c8', '#6e0f2a', 58, { small: 'chakra', sF: '#f08a24', sL: '#f3e3c8' })}
          <linearGradient id="folds" x1="0" x2="1">
            <stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".12" stop-color="#000" stop-opacity="0"/>
            <stop offset=".24" stop-color="#000" stop-opacity=".28"/><stop offset=".36" stop-color="#fff" stop-opacity=".08"/>
            <stop offset=".5" stop-color="#000" stop-opacity=".25"/><stop offset=".63" stop-color="#fff" stop-opacity=".06"/>
            <stop offset=".78" stop-color="#000" stop-opacity=".3"/><stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/>
          </linearGradient>
          <linearGradient id="bgd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efdcbc"/><stop offset="1" stop-color="#dcc29a"/></linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#bgd)"/>
        <ellipse cx="200" cy="384" rx="150" ry="10" fill="rgba(70,30,10,.18)"/>
        <path d="M84 62 L316 62 L322 352 C260 362 140 362 80 352 Z" fill="url(#pd)"/>
        <path d="M84 62 L316 62 L322 352 C260 362 140 362 80 352 Z" fill="url(#folds)"/>
        <path d="M80 340 C140 350 260 350 322 340 L322 352 C260 362 140 362 80 352 Z" fill="#e8432d" opacity=".85"/>
        ${tassels}
        <rect x="56" y="50" width="288" height="14" rx="7" fill="url(#woodGrad)"/>
        <circle cx="56" cy="57" r="10" fill="#7a4a26"/><circle cx="344" cy="57" r="10" fill="#7a4a26"/>
      </svg>`;
    },
    quilt() {
      const slab = (y, id, edge) => `
        <path d="M70 ${y} L330 ${y} L360 ${y + 40} L100 ${y + 40} Z" fill="url(#${id})"/>
        <path d="M70 ${y} L330 ${y} L360 ${y + 40} L100 ${y + 40} Z" fill="none" stroke="rgba(243,227,200,.5)" stroke-width="1.4" stroke-dasharray="4 5"/>
        <path d="M100 ${y + 40} L360 ${y + 40} L360 ${y + 74} L100 ${y + 74} Z" fill="url(#${id})"/>
        <path d="M100 ${y + 40} L360 ${y + 40} L360 ${y + 74} L100 ${y + 74} Z" fill="rgba(30,0,10,.28)"/>
        <path d="M100 ${y + 40} C180 ${y + 46} 280 ${y + 46} 360 ${y + 40}" fill="none" stroke="${edge}" stroke-width="5"/>
        <path d="M70 ${y} L100 ${y + 40} L100 ${y + 74} L70 ${y + 36} Z" fill="url(#${id})"/><path d="M70 ${y} L100 ${y + 40} L100 ${y + 74} L70 ${y + 36} Z" fill="rgba(30,0,10,.45)"/>`;
      return `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          ${patternDef('q1', 'chakra', '#2f8f4e', '#6e0f2a', '#f3e3c8', 50, { small: 'gudhal', sF: '#e8432d', transform: 'skewX(36)' })}
          ${patternDef('q2', 'chaukor', '#f08a24', '#f3e3c8', '#6e0f2a', 46, { small: 'chakra', sF: '#2f8f4e', transform: 'skewX(36)' })}
          ${patternDef('q3', 'gudhal', '#e8432d', '#2c0510', '#f3e3c8', 54, { small: 'bel', sF: '#2f8f4e', transform: 'skewX(36)' })}
          <linearGradient id="bgq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9d3ae"/><stop offset="1" stop-color="#d4b78c"/></linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#bgq)"/>
        <ellipse cx="216" cy="344" rx="170" ry="16" fill="rgba(70,30,10,.22)"/>
        ${slab(250, 'q1', '#2f8f4e')}
        ${slab(176, 'q2', '#f08a24')}
        ${slab(102, 'q3', '#e8432d')}
      </svg>`;
    },
    runner() {
      let fr = '';
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const x1 = 150 + t * 100, y1 = 92;
        fr += `<path d="M${x1} ${y1} L${x1 + (t - 0.5) * 4} ${y1 - 12}" stroke="#f3e3c8" stroke-width="1.6"/>`;
        const x2 = 96 + t * 208, y2 = 382;
        fr += `<path d="M${x2} ${y2} L${x2 + (t - 0.5) * 8} ${y2 + 14}" stroke="#f3e3c8" stroke-width="2.2"/>`;
      }
      return `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          ${patternDef('pr', 'bel', '#2f8f4e', '#f3e3c8', '#22306b', 56, { small: 'gudhal', sF: '#f08a24', sL: '#f3e3c8' })}
          <linearGradient id="table" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3317"/><stop offset="1" stop-color="#8a5a32"/></linearGradient>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".5" stop-color="#000" stop-opacity="0"/></linearGradient>
        </defs>
        <rect width="400" height="400" fill="#e4cda6"/>
        <path d="M60 60 L340 60 L420 400 L-20 400 Z" fill="url(#table)"/>
        <path d="M60 60 L340 60 L420 400 L-20 400 Z" fill="#fff" filter="url(#woodGrain)" opacity=".5"/>
        <path d="M150 92 L250 92 L304 382 L96 382 Z" fill="url(#pr)"/>
        <path d="M150 92 L250 92 L304 382 L96 382 Z" fill="url(#fade)"/>
        <path d="M150 92 L250 92 L304 382 L96 382 Z" fill="none" stroke="#f3e3c8" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round"/>
        ${fr}
        <ellipse cx="284" cy="226" rx="26" ry="9" fill="rgba(0,0,0,.3)"/>
        <path d="M262 186 C262 222 306 222 306 186 Z" fill="url(#potGlaze)"/>
        <ellipse cx="284" cy="186" rx="22" ry="7" fill="#5e260d"/><ellipse cx="284" cy="186" rx="18" ry="5" fill="#f3e3c8"/>
      </svg>`;
    }
  };
  document.querySelectorAll('.p-art').forEach(el => { el.innerHTML = PRODUCT[el.dataset.product](); });

  const bagCount = document.getElementById('bagCount');
  const bagLink = document.querySelector('.bag');
  let bag = 0;
  document.querySelectorAll('.add').forEach(btn => btn.addEventListener('click', () => {
    const on = !btn.classList.contains('added');
    btn.classList.toggle('added', on);
    btn.textContent = on ? 'In your bag ✓' : 'Add to bag';
    bag += on ? 1 : -1;
    bagCount.textContent = bag;
    bagLink.setAttribute('aria-label', `Bag, ${bag} item${bag === 1 ? '' : 's'}`);
    bagLink.classList.remove('bump'); void bagLink.offsetWidth; bagLink.classList.add('bump');
  }));

  /* ------------------------------------------------------------------
   * Story mandala + footer border band
   * ------------------------------------------------------------------ */
  (function buildMandala() {
    const at = (x, y, sc, rot, nm, F, L) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc}) translate(-50 -50)">${motif(nm, F, L)}</g>`;
    let s = `<svg viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="196" fill="#6e0f2a"/><circle cx="200" cy="200" r="196" fill="url(#mweave)"/>`;
    s += `<circle cx="200" cy="200" r="188" fill="none" stroke="#f3e3c8" stroke-width="3" stroke-dasharray="0 9" stroke-linecap="round"/>`;
    for (let i = 0; i < 18; i++) {
      const a = i * 20, rad = (a - 90) * Math.PI / 180;
      s += at(200 + Math.cos(rad) * 150, 200 + Math.sin(rad) * 150, 0.44, a, 'mor', i % 2 ? '#f08a24' : '#2f8f4e', '#f3e3c8');
    }
    s += `<circle cx="200" cy="200" r="118" fill="none" stroke="#f3e3c8" stroke-width="2"/>`;
    for (let i = 0; i < 9; i++) {
      const a = i * 40, rad = (a - 90) * Math.PI / 180;
      s += at(200 + Math.cos(rad) * 88, 200 + Math.sin(rad) * 88, 0.42, a, 'kairi', '#e8432d', '#f3e3c8');
    }
    s += at(200, 200, 0.92, 0, 'chakra', '#f08a24', '#f3e3c8');
    s += `<defs><pattern id="mweave" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="rgba(0,0,0,.12)"/><rect width="1" height="4" fill="rgba(255,220,200,.05)"/></pattern></defs></svg>`;
    document.getElementById('mandala').innerHTML = s;
  })();
  const mandala = document.getElementById('mandala');
  const storyEl = document.getElementById('story');
  function storyScroll() {
    const r = storyEl.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = (innerHeight - r.top) / (innerHeight + r.height);
    mandala.style.transform = `rotate(${(p - 0.5) * 70}deg) scale(${0.92 + p * 0.1})`;
  }

  (function band() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="64" viewBox="0 0 128 64"><rect width="128" height="64" fill="#6e0f2a"/>
      <g transform="translate(4 4) scale(.56)">${motif('mor', '#f08a24', '#f3e3c8')}</g>
      <g transform="translate(68 4) scale(.56)">${motif('mor', '#2f8f4e', '#f3e3c8')}</g>
      <circle cx="64" cy="10" r="3" fill="#f3e3c8"/><circle cx="0" cy="10" r="3" fill="#f3e3c8"/><circle cx="128" cy="10" r="3" fill="#f3e3c8"/></svg>`;
    document.querySelector('.border-band').style.backgroundImage = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  })();

  /* ------------------------------------------------------------------
   * Reveals, scroll, resize, forms
   * ------------------------------------------------------------------ */
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; craftScroll(); if (!RM) storyScroll(); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { sizeCloth(); craftScroll(); }, 120); });
  craftScroll(); storyScroll();

  const news = document.getElementById('news');
  news.addEventListener('submit', e => { e.preventDefault(); news.hidden = true; document.querySelector('.news-ok').hidden = false; });
})();
