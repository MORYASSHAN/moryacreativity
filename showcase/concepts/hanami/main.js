/* HANAMI 花見 — interactions */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------------------------------------------------------
     1. ENSŌ — brush circle generated as a tapered polygon,
        revealed by animated stroke masks
  --------------------------------------------------------- */
  function buildEnso() {
    const C = 300, R = 224, N = 220;
    const a0 = (104 * Math.PI) / 180;           // start: lower left
    const sweep = (326 * Math.PI) / 180;        // leave an open gap
    const centre = [], outer = [], inner = [], widths = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = a0 + sweep * t;
      const r = R + 5 * Math.sin(t * Math.PI * 2.4 + 0.6) - 10 * t * t;
      let w = 6 + 29 * Math.pow(1 - t, 0.62) * (1 + 0.12 * Math.sin(t * 19));
      w *= 1 + 0.42 * Math.exp(-t * 32);       // pressure at the first touch
      const cx = C + r * Math.cos(a), cy = C + r * Math.sin(a);
      centre.push([cx, cy]);
      widths.push(w);
      outer.push([C + (r + w / 2) * Math.cos(a), C + (r + w / 2) * Math.sin(a)]);
      inner.push([C + (r - w / 2) * Math.cos(a), C + (r - w / 2) * Math.sin(a)]);
    }
    const f = (p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    // rounded start cap
    const s0 = outer[0], s1 = inner[0];
    let d = 'M' + f(s1) + ' A ' + (widths[0] / 2).toFixed(1) + ' ' + (widths[0] / 2).toFixed(1) + ' 0 0 1 ' + f(s0);
    for (let i = 1; i < outer.length; i++) d += ' L' + f(outer[i]);
    d += ' L' + f(centre[centre.length - 1]);
    for (let i = inner.length - 1; i >= 0; i--) d += ' L' + f(inner[i]);
    d += 'Z';
    $('#ensoInk').setAttribute('d', d);

    // centre line (slightly overshooting at start so the cap is covered)
    const back = [centre[0][0] + (centre[0][0] - centre[2][0]) * 8, centre[0][1] + (centre[0][1] - centre[2][1]) * 8];
    const line = 'M' + f(back) + centre.map((p) => ' L' + f(p)).join('');
    $('#ensoInkReveal').setAttribute('d', line);
    // photo wash follows the brush on a smaller radius
    const lineIn = 'M' + centre.map((p) => f([C + (p[0] - C) * 0.84, C + (p[1] - C) * 0.84])).join(' L');
    $('#ensoPhotoStroke').setAttribute('d', lineIn);

    // dry-brush streaks (kasure) in the tail
    const dry = $('#ensoDry');
    for (let k = 0; k < 9; k++) {
      const off = rand(-0.45, 0.45);
      const from = Math.floor(N * rand(0.42, 0.62));
      let dd = '';
      for (let i = from; i <= N; i++) {
        const t = i / N, a = a0 + sweep * t;
        const r = R + 5 * Math.sin(t * Math.PI * 2.4 + 0.6) - 10 * t * t + off * widths[i];
        dd += (i === from ? 'M' : ' L') + f([C + r * Math.cos(a), C + r * Math.sin(a)]);
      }
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', dd);
      p.setAttribute('stroke-width', rand(0.8, 2.6).toFixed(2));
      p.setAttribute('stroke-dasharray', `${rand(10, 60) | 0} ${rand(4, 26) | 0} ${rand(20, 90) | 0} ${rand(3, 14) | 0}`);
      p.setAttribute('opacity', rand(0.55, 0.95).toFixed(2));
      dry.appendChild(p);
    }

    const ink = $('#ensoInkReveal'), wash = $('#ensoPhotoStroke'), disk = $('#ensoDisk');
    if (reduce) {
      ink.style.strokeDashoffset = 0; wash.style.strokeDashoffset = 0; disk.setAttribute('r', 214);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ink.style.transition = 'stroke-dashoffset 2.3s cubic-bezier(.62,.02,.28,1) .35s';
      wash.style.transition = 'stroke-dashoffset 2.6s cubic-bezier(.62,.02,.28,1) .75s';
      ink.style.strokeDashoffset = 0;
      wash.style.strokeDashoffset = 0;
      const t0 = performance.now() + 1500, dur = 2100;
      const grow = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        const e = 1 - Math.pow(1 - t, 3);
        disk.setAttribute('r', (214 * e).toFixed(1));
        if (t < 1) requestAnimationFrame(grow);
      };
      requestAnimationFrame(grow);
    }));
  }

  /* ---------------------------------------------------------
     2. SAKURA PETALS — sprites rotated on two axes, cursor wind
  --------------------------------------------------------- */
  function petals() {
    const cv = $('#petals');
    if (reduce || !cv) return;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    const PW = 36, PH = 44;

    function sprite(front, blur) {
      const pad = blur ? 10 : 2;
      const c = document.createElement('canvas');
      c.width = PW + pad * 2; c.height = PH + pad * 2;
      const g = c.getContext('2d');
      if (blur) g.filter = 'blur(2.6px)';
      g.translate(c.width / 2, c.height / 2);
      const w = PW, h = PH;
      g.beginPath();
      g.moveTo(0, h / 2);
      g.bezierCurveTo(w * 0.62, h * 0.22, w * 0.56, -h * 0.36, w * 0.17, -h / 2);
      g.lineTo(0, -h * 0.34);
      g.lineTo(-w * 0.17, -h / 2);
      g.bezierCurveTo(-w * 0.56, -h * 0.36, -w * 0.62, h * 0.22, 0, h / 2);
      g.closePath();
      const gr = g.createLinearGradient(0, h / 2, 0, -h / 2);
      if (front) { gr.addColorStop(0, '#ef9fb4'); gr.addColorStop(0.35, '#f8cdd8'); gr.addColorStop(1, '#fff3f6'); }
      else { gr.addColorStop(0, '#d9798f'); gr.addColorStop(0.5, '#eeaabd'); gr.addColorStop(1, '#f7d2dc'); }
      g.fillStyle = gr; g.fill();
      g.strokeStyle = front ? 'rgba(214,120,150,.28)' : 'rgba(170,70,100,.3)';
      g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(0, h / 2 - 2); g.quadraticCurveTo(1.5, 0, 0, -h * 0.26); g.stroke();
      return c;
    }
    const S = { front: sprite(true, false), back: sprite(false, false), frontB: sprite(true, true), backB: sprite(false, true) };

    const list = [];
    function make(p, initial) {
      const z = Math.random() < 0.12 ? rand(1.25, 1.7) : rand(0.45, 1.15);
      p.z = z;
      p.s = (0.32 + Math.random() * 0.22) * z;
      p.x = rand(-60, W + 60);
      p.y = initial ? rand(-H * 0.1, H) : rand(-120, -30);
      p.vx = 0; p.vy = (0.32 + Math.random() * 0.45) * z;
      p.rx = rand(0, 6.28); p.ry = rand(0, 6.28); p.rz = rand(0, 6.28);
      p.wx = rand(0.6, 2.2) * (Math.random() < 0.5 ? -1 : 1);
      p.wy = rand(0.5, 1.8) * (Math.random() < 0.5 ? -1 : 1);
      p.wz = rand(-0.8, 0.8);
      p.ph = rand(0, 6.28); p.fq = rand(0.6, 1.4); p.amp = rand(0.25, 0.9);
      p.kick = 0;
      return p;
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      const target = clamp(Math.round((W * H) / 22000), 18, 72);
      while (list.length < target) list.push(make({}, true));
      list.length = target;
    }
    resize();
    addEventListener('resize', resize);

    const wind = { x: 0.35, y: 0, base: 0.35 };
    const mouse = { x: -999, y: -999, vx: 0, vy: 0, lx: null, ly: null, lt: 0 };
    addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (mouse.lx !== null) {
        const dt = Math.max(8, now - mouse.lt);
        mouse.vx = lerp(mouse.vx, ((e.clientX - mouse.lx) / dt) * 16, 0.5);
        mouse.vy = lerp(mouse.vy, ((e.clientY - mouse.ly) / dt) * 16, 0.5);
      }
      mouse.lx = mouse.x = e.clientX; mouse.ly = mouse.y = e.clientY; mouse.lt = now;
    }, { passive: true });
    addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });

    let last = performance.now(), t = 0, gustT = 4;
    function frame(now) {
      const dt = clamp((now - last) / 1000, 0, 0.05); last = now; t += dt;
      const k = dt * 60;
      // natural gusts
      gustT -= dt;
      if (gustT < 0) { wind.base = rand(0.1, 1.4); gustT = rand(3, 7); }
      // cursor velocity feeds the global wind
      wind.x += clamp(mouse.vx * 0.012, -0.5, 0.5) * k;
      wind.y += clamp(mouse.vy * 0.006, -0.3, 0.3) * k;
      wind.x += (wind.base - wind.x) * 0.012 * k;
      wind.y += (0 - wind.y) * 0.03 * k;
      wind.x = clamp(wind.x, -7, 7);
      mouse.vx *= Math.pow(0.86, k); mouse.vy *= Math.pow(0.86, k);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of list) {
        const sway = Math.sin(t * p.fq + p.ph) * p.amp;
        const flat = Math.abs(Math.cos(p.rx) * Math.cos(p.ry));
        // local swirl around cursor
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 160 * 160) {
          const f = 1 - Math.sqrt(d2) / 160;
          p.vx += mouse.vx * 0.06 * f * k;
          p.vy += mouse.vy * 0.04 * f * k;
          p.kick = Math.min(4, p.kick + (Math.abs(mouse.vx) + Math.abs(mouse.vy)) * 0.02 * f);
        }
        p.kick *= Math.pow(0.97, k);
        const tvx = (wind.x + sway) * p.z;
        const tvy = p.vy * (0.55 + 0.6 * (1 - flat)) + wind.y * p.z;
        p.vx += (tvx - p.vx) * 0.035 * k;
        p.x += p.vx * k;
        p.y += lerp(tvy, tvy + p.vx * 0.05, 0.5) * k;
        p.rx += p.wx * dt * (1 + p.kick);
        p.ry += p.wy * dt * (1 + p.kick);
        p.rz += (p.wz + p.vx * 0.04) * dt * (1 + p.kick * 0.5);
        if (p.y > H + 50) make(p, false);
        if (p.x > W + 70) p.x = -60; else if (p.x < -70) p.x = W + 60;

        const sx = Math.cos(p.ry), sy = Math.cos(p.rx);
        const front = sx * sy >= 0;
        const blur = p.z > 1.22;
        const img = blur ? (front ? S.frontB : S.backB) : (front ? S.front : S.back);
        const cz = Math.cos(p.rz), sz = Math.sin(p.rz);
        const sc = p.s * dpr;
        const ax = Math.abs(sx) < 0.08 ? 0.08 * Math.sign(sx || 1) : sx;
        ctx.globalAlpha = blur ? 0.7 : clamp(0.55 + p.z * 0.4, 0.5, 0.95);
        ctx.setTransform(cz * ax * sc, sz * ax * sc, -sz * sy * sc, cz * sy * sc, p.x * dpr, p.y * dpr);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
      }
      raf = requestAnimationFrame(frame);
    }
    let raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
  }

  /* ---------------------------------------------------------
     3. JOURNEY — horizontal, scroll-driven ink route
  --------------------------------------------------------- */
  const ICONS = {
    castle: '<path d="M12 68h56M18 68V54h44v14M14 54l26-11 26 11M24 43h32M21 43l19-10 19 10M30 33h20M28 33l12-8 12 8M40 25v-6M36 68v-8h8v8"/><path class="sh" d="M37 19h6"/>',
    lantern: '<path d="M40 8v8M30 16h20M29 20c0-3 22-3 22 0v30c0 3-22 3-22 0zM29 28h22M29 42h22M34 53v6h12v-6M40 59v12M24 71h32"/><circle class="pk" cx="40" cy="35" r="3"/>',
    tea: '<path d="M14 44h52c-2 15-12 22-26 22S16 59 14 44zM28 66h24M31 36c-5-7 5-9 0-16M41 36c-5-7 5-9 0-16M51 36c-5-7 5-9 0-16"/><circle class="pk" cx="62" cy="18" r="4"/>',
    river: '<path d="M30 34V24h20v10M26 34l14-7 14 7M34 24l6-5 6 5M22 34h36M6 46c8-5 16-5 24 0s16 5 24 0 16-5 24 0M6 56c8-5 16-5 24 0s16 5 24 0 16-5 24 0M6 66c8-5 16-5 24 0s16 5 24 0 16-5 24 0"/>',
    boat: '<path d="M10 50h60l-9 10H19zM40 50V20M40 22l16 24H40M8 68c10-4 21-4 32 0s21 4 32 0"/><circle class="pk" cx="22" cy="30" r="3.4"/><circle class="pk" cx="60" cy="24" r="3"/><path class="sh" d="M22 33v6M60 27v6"/>',
    heron: '<path d="M18 66l12-22c4-8 2-14-5-18 9 0 15 5 15 13 0 7 9 9 20 2-7 13-18 19-31 19M30 44l-6 22M37 47l3 19M25 26l-12 3"/><circle class="pk" cx="64" cy="16" r="4"/>',
    mountain: '<path d="M4 64l22-30 13 15 11-13 26 28zM4 70h72"/><circle class="pk" cx="22" cy="48" r="2.6"/><circle class="pk" cx="30" cy="55" r="2.6"/><circle class="pk" cx="45" cy="52" r="2.6"/><circle class="pk" cx="52" cy="44" r="2.6"/><circle class="pk" cx="58" cy="57" r="2.6"/><circle class="pk" cx="16" cy="58" r="2.6"/>'
  };
  const DAYS = [
    { k: '一', date: 'Wed 7 Apr', place: 'Matsumoto', jp: '松本', icon: 'castle', title: 'The crow castle at dusk',
      text: 'The limited express climbs into the Alps as the peaks turn rose. Walk the moat of the black keep, its reflection doubled in still water, then sink into a cedar bath.', stay: 'Tsukikage-an' },
    { k: '二', date: 'Thu 8 Apr', place: 'Narai-juku', jp: '奈良井宿', icon: 'lantern', title: 'A post road, unhurried',
      text: 'Six kilometres of the old Nakasendō over Torii Pass to a street of lattice-fronted inns. Dinner by the irori hearth; the lanterns go out at nine.', stay: 'Kiso Hatago' },
    { k: '三', date: 'Fri 9 Apr', place: 'Kanazawa', jp: '金沢', icon: 'tea', title: 'Gold leaf and a garden at dawn',
      text: 'Tea in a pavilion before the garden gates open, then the samurai lanes of Nagamachi, earthen walls and narrow canals, and an evening walk under lit trees.', stay: 'Asagiri House' },
    { k: '四', date: 'Sat 10 Apr', place: 'Inuyama', jp: '犬山', icon: 'river', title: 'The oldest wooden keep',
      text: 'Climb ladder-steep stairs inside a tower raised in 1537 to a balcony above the Kiso river. If the wind is right, the petals fall like snow: hanafubuki.', stay: 'Kawa-no-oto' },
    { k: '五', date: 'Sun 11 Apr', place: 'Hikone', jp: '彦根', icon: 'boat', title: 'Lanterns on the moat',
      text: 'An afternoon on the shore of Lake Biwa, then a flat-bottomed boat poled slowly under twelve hundred cherry trees lit from below.', stay: 'Biwa-no-yado' },
    { k: '六', date: 'Mon 12 Apr', place: 'Himeji', jp: '姫路', icon: 'heron', title: 'The white heron',
      text: 'The great white castle at opening time, before the tour groups arrive. Lunch in the Kōko-en gardens; the afternoon is entirely yours.', stay: 'Shirasagi-tei' },
    { k: '七', date: 'Tue 13 Apr', place: 'Yoshino', jp: '吉野', icon: 'mountain', title: 'A mountain of thirty thousand trees',
      text: 'Thirteen centuries of planting climb the ridge in four groves, from the lower to the inner. We walk up through all of them and sleep in a temple at the top.', stay: 'Chikurin-in shukubō' }
  ];

  function journey() {
    const section = $('#journey'), track = $('#track'), end = $('.journey__end');
    DAYS.forEach((d, i) => {
      const el = document.createElement('div');
      el.className = 'station';
      el.innerHTML = `
        <div class="station__head"><span class="station__dot"></span><span class="station__day">Day 0${i + 1} · ${d.date}</span></div>
        <article class="station__card">
          <span class="station__kanji" lang="ja" aria-hidden="true">${d.k}日</span>
          <svg class="station__icon" viewBox="0 0 80 80" aria-hidden="true">${ICONS[d.icon]}</svg>
          <h3 class="station__place"><b>${d.place}</b><span lang="ja">${d.jp}</span></h3>
          <p class="station__title">${d.title}</p>
          <p class="station__text">${d.text}</p>
          <p class="station__stay"><span>Stay</span><b>${d.stay}</b></p>
        </article>`;
      track.insertBefore(el, end);
    });
    const stations = $$('.station', track);
    const dots = stations.map((s) => $('.station__dot', s));
    const ghost = $('#routeGhost'), ink = $('#routeInk'), svg = $('#route');
    const hudDay = $('#hudDay'), hudLabel = $('#hudLabel'), hudPlace = $('#hudPlace'), hudBar = $('#hudBar');
    let trackW = 0, len = 0, lut = [], pts = [];

    function layout() {
      track.style.transform = 'none';
      trackW = track.scrollWidth;
      const h = track.offsetHeight;
      svg.setAttribute('width', trackW); svg.setAttribute('height', h);
      svg.style.width = trackW + 'px';
      section.style.height = Math.max(innerHeight * 2, trackW - innerWidth + innerHeight) + 'px';
      const tr = track.getBoundingClientRect();
      pts = dots.map((d) => { const r = d.getBoundingClientRect(); return { x: r.left - tr.left + r.width / 2, y: r.top - tr.top + r.height / 2 }; });
      const start = { x: Math.max(0, pts[0].x - innerWidth * 0.32), y: h * 0.62 };
      const endP = { x: trackW - 20, y: h * 0.48 };
      const all = [start, ...pts, endP];
      let d = `M${start.x} ${start.y}`;
      for (let i = 1; i < all.length; i++) {
        const a = all[i - 1], b = all[i], dx = (b.x - a.x) * 0.5;
        d += ` C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
      }
      ghost.setAttribute('d', d); ink.setAttribute('d', d);
      len = ink.getTotalLength();
      ink.style.strokeDasharray = `${len} ${len}`;
      lut = [];
      for (let i = 0; i <= 240; i++) { const l = (len * i) / 240; lut.push([ink.getPointAtLength(l).x, l]); }
      update();
    }
    function lenAtX(x) {
      if (x <= lut[0][0]) return 0;
      for (let i = 1; i < lut.length; i++) {
        if (lut[i][0] >= x) { const a = lut[i - 1], b = lut[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1)); }
      }
      return len;
    }
    let cur = -1;
    function update() {
      const rect = section.getBoundingClientRect();
      const max = section.offsetHeight - innerHeight;
      const p = clamp(-rect.top / max, 0, 1);
      const tx = -(trackW - innerWidth) * p;
      track.style.transform = `translate3d(${tx.toFixed(1)}px,0,0)`;
      const pen = -tx + innerWidth * (innerWidth < 700 ? 0.2 : 0.56);
      ink.style.strokeDashoffset = (len - lenAtX(pen)).toFixed(1);
      let c = 0;
      pts.forEach((pt, i) => {
        const passed = pt.x < pen;
        stations[i].classList.toggle('is-passed', passed);
        if (passed) c = i;
      });
      if (c !== cur) {
        stations.forEach((s, i) => s.classList.toggle('is-current', i === c && pts[c].x < pen));
        cur = c;
        hudDay.textContent = DAYS[c].k;
        hudLabel.textContent = `Day 0${c + 1} / 07`;
        hudPlace.textContent = DAYS[c].place;
      }
      stations[c].classList.toggle('is-current', pts[c].x < pen);
      hudBar.style.transform = `scaleX(${p.toFixed(3)})`;
    }
    let ticking = false;
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
    document.fonts && document.fonts.ready.then(layout);
    layout();
  }

  /* ---------------------------------------------------------
     4. BLOOM FRONT — stylised map + gantt + scrubber
  --------------------------------------------------------- */
  const COAST = {
    honshu: [[130.92,33.95],[131.4,34.42],[132.07,34.9],[132.7,35.4],[133.05,35.55],[133.3,35.58],[133.4,35.47],[134.2,35.53],[134.6,35.65],[135.1,35.75],[135.4,35.52],[135.75,35.5],[136.05,35.68],[135.95,35.95],[136.1,36.2],[136.3,36.35],[136.6,36.62],[136.75,36.9],[136.7,37.2],[136.9,37.4],[137.35,37.5],[136.95,37.05],[136.98,36.86],[137.2,36.75],[137.85,37.04],[138.25,37.17],[138.55,37.37],[139.05,37.92],[139.45,38.23],[139.7,38.65],[139.83,38.92],[140.05,39.72],[139.72,39.95],[140.0,40.2],[139.92,40.65],[140.2,40.78],[140.35,41.25],[140.75,40.85],[141.2,41.3],[140.92,41.52],[141.45,41.43],[141.4,40.95],[141.5,40.52],[141.8,40.2],[141.98,39.64],[141.9,39.27],[141.73,39.05],[141.6,38.9],[141.5,38.3],[141.3,38.42],[141.0,38.25],[140.95,37.8],[140.9,37.05],[140.65,36.6],[140.6,36.3],[140.87,35.73],[140.45,35.45],[140.3,35.15],[139.85,34.92],[139.82,35.3],[140.1,35.6],[139.8,35.65],[139.65,35.45],[139.62,35.15],[139.15,35.25],[139.07,35.1],[138.85,34.6],[138.85,35.08],[138.4,34.95],[138.22,34.6],[137.7,34.67],[137.02,34.58],[136.9,34.7],[136.85,35.05],[136.62,34.95],[136.52,34.7],[136.85,34.3],[136.2,34.05],[136.1,33.9],[135.77,33.43],[135.35,33.68],[135.15,33.9],[135.15,34.23],[135.4,34.62],[135.2,34.68],[134.95,34.65],[134.7,34.77],[133.95,34.6],[133.35,34.45],[133.1,34.38],[132.55,34.22],[132.45,34.35],[132.2,34.15],[131.8,34.03],[131.55,34.0],[131.25,33.93]],
    kyushu: [[130.95,33.92],[130.55,33.88],[130.4,33.62],[130.2,33.6],[129.95,33.47],[129.7,33.35],[129.55,33.22],[129.7,32.95],[129.75,32.7],[129.95,32.62],[130.25,32.6],[130.1,32.4],[130.2,32.1],[130.25,31.85],[130.2,31.4],[130.4,31.25],[130.65,31.2],[130.55,31.55],[130.75,31.35],[130.68,31.0],[131.05,31.35],[131.35,31.4],[131.45,31.9],[131.7,32.55],[131.9,32.95],[131.65,33.25],[131.72,33.6],[131.35,33.55],[131.0,33.75]],
    shikoku: [[132.7,33.85],[132.4,33.55],[132.0,33.35],[132.45,33.25],[132.55,32.95],[133.0,32.72],[133.25,33.0],[133.55,33.48],[133.9,33.5],[134.18,33.25],[134.35,33.6],[134.6,33.85],[134.62,34.15],[134.4,34.3],[134.05,34.35],[133.7,34.25],[133.25,34.0],[133.0,34.08],[132.75,33.95]],
    hokkaido: [[140.73,41.77],[140.4,41.6],[140.1,41.42],[140.0,41.65],[140.1,41.9],[139.85,42.2],[139.85,42.6],[140.2,42.85],[140.5,43.2],[141.0,43.2],[141.4,43.4],[141.6,43.95],[141.75,44.5],[141.65,45.0],[141.85,45.45],[142.3,45.05],[142.9,44.6],[143.6,44.2],[144.25,44.0],[144.8,43.95],[145.3,44.35],[145.2,43.75],[145.6,43.35],[145.2,43.15],[144.4,42.97],[143.6,42.6],[143.25,41.95],[142.5,42.25],[141.65,42.6],[141.0,42.35],[140.6,42.55],[140.35,42.5],[140.55,42.15],[141.15,41.8]]
  };
  const px = (lon) => 12 + (lon - 129) * 22.2;
  const py = (lat) => 12 + (45.6 - lat) * 27;
  // [name, jp, lon, lat, firstBloomIdx, fullBloomIdx, route?, label?, labelPos]
  const CITIES = [
    ['Kagoshima', '鹿児島', 130.55, 31.6, 11, 20, 0, 1, 'r'],
    ['Fukuoka', '福岡', 130.4, 33.6, 7, 16, 0, 1, 'l'],
    ['Kōchi', '高知', 133.55, 33.56, 7, 15, 0, 0],
    ['Matsuyama', '松山', 132.77, 33.84, 9, 17, 0, 0],
    ['Hiroshima', '広島', 132.46, 34.4, 10, 19, 0, 0],
    ['Osaka', '大阪', 135.5, 34.69, 12, 20, 0, 0],
    ['Kyoto', '京都', 135.77, 35.01, 11, 20, 0, 0],
    ['Yoshino', '吉野', 135.86, 34.37, 17, 25, 1, 1, 'b'],
    ['Himeji', '姫路', 134.69, 34.83, 15, 22, 1, 1, 'l'],
    ['Hikone', '彦根', 136.25, 35.27, 16, 23, 1, 1, 't'],
    ['Nagoya', '名古屋', 136.9, 35.18, 9, 18, 0, 0],
    ['Inuyama', '犬山', 136.94, 35.38, 12, 20, 1, 1, 'r'],
    ['Tokyo', '東京', 139.69, 35.69, 9, 16, 0, 1, 'r'],
    ['Kanazawa', '金沢', 136.65, 36.56, 17, 23, 1, 1, 'l'],
    ['Narai', '奈良井', 137.82, 35.97, 30, 35, 1, 0],
    ['Matsumoto', '松本', 137.97, 36.24, 23, 29, 1, 1, 'r'],
    ['Niigata', '新潟', 139.03, 37.9, 22, 27, 0, 0],
    ['Sendai', '仙台', 140.87, 38.27, 24, 29, 0, 1, 'r'],
    ['Kakunodate', '角館', 140.56, 39.6, 36, 41, 0, 0],
    ['Hirosaki', '弘前', 140.47, 40.6, 38, 42, 0, 1, 'r'],
    ['Hakodate', '函館', 140.73, 41.77, 42, 46, 0, 1, 'r'],
    ['Matsumae', '松前', 140.1, 41.43, 43, 47, 0, 0],
    ['Sapporo', '札幌', 141.35, 43.06, 47, 50, 0, 1, 'r']
  ];
  const GANTT = ['Fukuoka', 'Kōchi', 'Tokyo', 'Kyoto', 'Inuyama', 'Himeji', 'Hikone', 'Kanazawa', 'Yoshino', 'Matsumoto', 'Sendai', 'Hirosaki', 'Hakodate', 'Sapporo'];
  const FRONT = [[0, 30.6], [5, 32], [9, 34.4], [17, 36], [24, 37.8], [31, 39], [38, 40.6], [44, 42], [49, 43.3], [56, 44.6]];
  const MONTHS = ['January', 'February', 'March', 'April', 'May'];
  const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function smoothClosed(pts) {
    const n = pts.length;
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }

  function bloom() {
    const land = $('#land'), cities = $('#cities'), rows = $('#ganttRows');
    Object.values(COAST).forEach((poly) => {
      const pts = poly.map(([lo, la]) => [px(lo), py(la)]);
      const d = smoothClosed(pts);
      const bg = document.createElementNS(NS, 'path'); bg.setAttribute('d', d); bg.setAttribute('class', 'land-bg');
      const fg = document.createElementNS(NS, 'path'); fg.setAttribute('d', d); fg.setAttribute('class', 'land');
      land.append(bg, fg);
    });
    const cityEls = {};
    CITIES.forEach(([name, jp, lon, lat, k, f, route, label, pos]) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'city');
      const x = px(lon), y = py(lat);
      let html = `<circle class="glow" cx="${x}" cy="${y}" r="13"/>`;
      if (route) html += `<circle class="ring" cx="${x}" cy="${y}" r="6.5"/>`;
      html += `<circle class="core" cx="${x}" cy="${y}" r="3.4"/>`;
      if (label) {
        let tx = x + 9, ty = y + 3.5, anchor = 'start';
        if (pos === 'l') { tx = x - 9; anchor = 'end'; }
        if (pos === 't') { tx = x; ty = y - 10; anchor = 'middle'; }
        if (pos === 'b') { tx = x; ty = y + 16; anchor = 'middle'; }
        html += `<text x="${tx}" y="${ty}" text-anchor="${anchor}">${name}</text>`;
      }
      html += `<title>${name} ${jp}</title>`;
      g.innerHTML = html;
      cities.appendChild(g);
      cityEls[name] = { g, k, f, route };
    });
    GANTT.forEach((name) => {
      const c = CITIES.find((x) => x[0] === name);
      const [, jp, , , k, f, route] = c;
      const endI = Math.min(56, f + 8);
      const row = document.createElement('div');
      row.className = 'g-row'; row.setAttribute('role', 'row');
      row.innerHTML = `<span class="g-row__name" role="rowheader">${route ? '<span class="route-mark" aria-label="on route"></span>' : ''}${name}<i lang="ja">${jp}</i></span>
        <span class="g-row__track" role="cell"><span class="g-bar" style="--s:${k / 56};--w:${(endI - k) / 56};--f:${(f - k) / (endI - k)}"></span><span class="sr-only">first bloom ${idxLabel(k)}, full bloom ${idxLabel(f)}</span></span>`;
      rows.appendChild(row);
      cityEls[name].row = row;
    });
    $('#gantt').style.setProperty('--rows', GANTT.length);

    const range = $('#dateRange'), marker = $('#ganttMarker');
    const dateJp = $('#dateJp'), dateEn = $('#dateEn'), note = $('#dateNote');
    const front = $('#frontLine'), frontLabel = $('#frontLabel');

    function idxDate(i) { return new Date(2027, 2, 15 + i); }
    function idxLabel(i) { const d = idxDate(i); return `${MONTHS[d.getMonth()]} ${d.getDate()}`; }
    function frontLat(v) {
      for (let i = 1; i < FRONT.length; i++) if (v <= FRONT[i][0]) { const a = FRONT[i - 1], b = FRONT[i]; return lerp(a[1], b[1], (v - a[0]) / (b[0] - a[0])); }
      return FRONT[FRONT.length - 1][1];
    }
    function set(v) {
      const d = idxDate(Math.round(v));
      const label = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
      dateJp.textContent = `${d.getMonth() + 1}月${d.getDate()}日`;
      dateEn.textContent = `${WEEK[d.getDay()]}, ${label}`;
      range.setAttribute('aria-valuetext', label);
      range.style.setProperty('--fill', (v / 56) * 100 + '%');
      marker.style.setProperty('--m', v / 56);
      const full = [], open = [];
      Object.entries(cityEls).forEach(([name, c]) => {
        let s = 'bud';
        if (v >= c.k && v < c.f) s = 'open';
        else if (v >= c.f && v < c.f + 6) s = 'full';
        else if (v >= c.f + 6) s = 'fall';
        c.g.dataset.state = s;
        const arr = s === 'full' ? full : s === 'open' ? open : null;
        if (arr) { if (c.route) arr.unshift(name); else arr.push(name); }
        if (c.row) c.row.classList.toggle('is-active', s === 'open' || s === 'full');
      });
      const list = (a) => a.length > 2 ? `${a.slice(0, 2).join(', ')} and ${a.length - 2} more` : a.join(' and ');
      note.textContent = full.length ? `Full bloom: ${list(full)}` : open.length ? `First blossoms: ${list(open)}` : v < 7 ? 'Buds swelling in Kyushu' : 'Late petals in Hokkaido';
      // front line: isochrone tilted across the archipelago
      const y = py(frontLat(v));
      let dd = '';
      for (let x = 0; x <= 400; x += 10) {
        const yy = y + (x - 220) * 0.32 + Math.sin(x * 0.045 + v * 0.3) * 4;
        dd += (x ? ' L' : 'M') + x + ' ' + yy.toFixed(1);
      }
      front.setAttribute('d', dd);
      frontLabel.setAttribute('x', 336);
      frontLabel.setAttribute('y', (y + (336 - 220) * 0.32 - 8).toFixed(1));
    }
    range.addEventListener('input', () => { stop(); set(+range.value); });
    set(+range.value);

    // auto-play the front
    const btn = $('#playFront');
    let playing = false, praf, pv;
    function stop() { playing = false; cancelAnimationFrame(praf); btn.textContent = 'Play the front ▸'; btn.setAttribute('aria-pressed', 'false'); }
    function play(from = 0, to = 56, dur = 7000) {
      playing = true; btn.textContent = 'Pause ❚❚'; btn.setAttribute('aria-pressed', 'true');
      const t0 = performance.now(); pv = from;
      const step = (now) => {
        if (!playing) return;
        const t = clamp((now - t0) / dur, 0, 1);
        pv = lerp(from, to, t);
        range.value = Math.round(pv); set(pv);
        if (t < 1) praf = requestAnimationFrame(step); else stop();
      };
      praf = requestAnimationFrame(step);
    }
    btn.addEventListener('click', () => {
      if (playing) return stop();
      const v = +range.value;
      play(v >= 56 ? 0 : v, 56, ((56 - (v >= 56 ? 0 : v)) / 56) * 9000);
    });
    if (!reduce) {
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { io.disconnect(); range.value = 0; play(0, 23, 4200); } });
      }, { threshold: 0.35 });
      io.observe($('.bloom__grid'));
    }
  }

  /* ---------------------------------------------------------
     5. misc: nav, reveals, counters, haiku, hills, forms
  --------------------------------------------------------- */
  function misc() {
    const nav = $('.nav');
    const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    // haiku split
    $$('[data-split]').forEach((el) => {
      let i = 0;
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            [...n.textContent].forEach((ch) => {
              if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); i++; return; }
              const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; s.style.setProperty('--i', i++);
              s.setAttribute('aria-hidden', 'true'); frag.appendChild(s);
            });
            n.replaceWith(frag);
          }
        });
      };
      const plain = el.textContent;
      walk(el);
      el.setAttribute('aria-label', plain.replace(/\s+/g, ' ').trim());
      el.setAttribute('role', 'text');
    });
    // offset EN after JP finishes
    const enChars = $$('.haiku__en .ch');
    enChars.forEach((c) => c.style.setProperty('--i', +c.style.getPropertyValue('--i') + 14));

    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
        const dd = e.target.querySelector('dd[data-count]');
        if (dd && !reduce) {
          const n = +dd.dataset.count, t0 = performance.now();
          const tick = (now) => { const t = clamp((now - t0) / 1400, 0, 1); dd.textContent = Math.round(n * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(tick); };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach((el, i) => { el.style.transitionDelay = (el.closest('.intro__stats,.stays__grid') ? (i % 4) * 0.12 : 0) + 's'; io.observe(el); });
    io.observe($('.haiku'));

    // Yoshino hills — blossom dots in four bands
    const hd = $('#hillDots');
    if (hd) {
      const bands = [[120, 160], [165, 205], [210, 250], [250, 295]];
      const cols = ['#f2b8c6', '#e08aa1', '#fbe0e7', '#f7cdd8', '#ffffff'];
      let h = '';
      bands.forEach(([a, b], bi) => {
        for (let i = 0; i < 70; i++) {
          const x = rand(0, 400), y = rand(a, b) + Math.sin(x / 60) * 8;
          h += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rand(1.6, 4.2 - bi * 0.4).toFixed(1)}" fill="${cols[(Math.random() * cols.length) | 0]}" opacity="${rand(0.55, 1).toFixed(2)}"/>`;
        }
      });
      hd.innerHTML = h;
    }

    // stepper
    const out = $('#guests');
    $$('.stepper button').forEach((b) => b.addEventListener('click', () => {
      out.textContent = clamp(+out.textContent + +b.dataset.step, 1, 6);
    }));

    // reservation demo
    const form = $('#reserveForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      ['#name', '#email'].forEach((s) => {
        const el = $(s);
        const valid = el.value.trim() && el.checkValidity();
        el.classList.toggle('is-invalid', !valid);
        if (!valid && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      const done = $('#reserveDone');
      done.hidden = false;
      const h = $('h3', done); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
    });
    $('#letterForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = $('#letterEmail');
      if (!inp.checkValidity() || !inp.value) { inp.focus(); return; }
      e.target.hidden = true; $('#letterThanks').hidden = false;
    });
  }

  buildEnso();
  misc();
  journey();
  bloom();
  petals();
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));
})();
