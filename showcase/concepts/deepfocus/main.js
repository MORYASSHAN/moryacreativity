/* DEEP FOCUS — concept landing page interactions */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad = n => String(n).padStart(2, '0');

  /* =========================================================
     SCENE — lamp spotlight, eyes, blink, clock
     ========================================================= */
  const hero = $('#hero');
  const wrap = $('#sceneWrap');
  const scene = $('#scene');
  const glow = $('#glow');
  const cone = $('#cone'), spot = $('#spot'), lampHead = $('#lampHead'), gCone = $('#gCone');
  const hint = $('#sceneHint');
  const PIVOT = { x: 800, y: 374 };
  const MOUTH = { x: 864, y: 373 }, CA = { x: 864, y: 338 }, CB = { x: 864, y: 408 };
  const R = 150;
  const eyes = [{ el: $('#eyeL'), x: 408, y: 378 }, { el: $('#eyeR'), x: 492, y: 378 }];
  eyes.forEach(e => { e.pupil = $('.pupil', e.el); e.lid = $('.lid', e.el); });

  // target point in SVG space; starts on the character's face
  const P = { x: 470, y: 400 }, T = { x: 470, y: 400 };
  let lastPointer = 0, hinted = false;

  function toSvg(cx, cy) {
    const m = scene.getScreenCTM(); if (!m) return null;
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }
  function onPoint(cx, cy) {
    const p = toSvg(cx, cy); if (!p) return;
    T.x = clamp(p.x, 30, 870); T.y = clamp(p.y, 70, 740);
    lastPointer = performance.now();
    if (!hinted) { hinted = true; hint.classList.add('gone'); }
  }
  addEventListener('pointermove', e => { if (heroVisible) onPoint(e.clientX, e.clientY); }, { passive: true });
  wrap.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) onPoint(t.clientX, t.clientY); }, { passive: true });
  wrap.addEventListener('pointerdown', e => onPoint(e.clientX, e.clientY));

  const rot = (pt, a) => { const c = Math.cos(a), s = Math.sin(a), dx = pt.x - PIVOT.x, dy = pt.y - PIVOT.y; return { x: PIVOT.x + dx * c - dy * s, y: PIVOT.y + dx * s + dy * c }; };

  let lidBase = -2, blinking = false;
  function setLids() { eyes.forEach(e => { e.lid.style.transform = `translateY(${blinking ? 34 : lidBase}px)`; }); }
  function scheduleBlink() {
    if (reduce) return;
    setTimeout(() => {
      blinking = true; setLids();
      setTimeout(() => { blinking = false; setLids(); if (Math.random() < 0.25) setTimeout(() => { blinking = true; setLids(); setTimeout(() => { blinking = false; setLids(); }, 120); }, 180); }, 130);
      scheduleBlink();
    }, 2200 + Math.random() * 4200);
  }

  function renderScene(now) {
    // wander when nobody is steering the lamp
    if (now - lastPointer > (finePointer ? 5000 : 2500)) {
      const t = now / 1000;
      T.x = 470 + Math.sin(t * 0.42) * 300; T.y = 420 + Math.sin(t * 0.61 + 1) * 170;
    }
    const k = reduce ? 1 : 0.12;
    P.x = lerp(P.x, T.x, k); P.y = lerp(P.y, T.y, k);

    const ang = Math.atan2(P.y - PIVOT.y, P.x - PIVOT.x);
    lampHead.setAttribute('transform', `rotate(${(ang * 180 / Math.PI).toFixed(2)} ${PIVOT.x} ${PIVOT.y})`);
    const M = rot(MOUTH, ang), A = rot(CA, ang), B = rot(CB, ang);
    let ux = P.x - M.x, uy = P.y - M.y; const len = Math.hypot(ux, uy) || 1; ux /= len; uy /= len;
    const nx = -uy, ny = ux;
    const sA = Math.sign((A.x - M.x) * nx + (A.y - M.y) * ny) || 1;
    const r = Math.min(R, len * 0.75 + 30);
    const far1 = { x: P.x + nx * r * sA + ux * r * 0.2, y: P.y + ny * r * sA + uy * r * 0.2 };
    const far2 = { x: P.x - nx * r * sA + ux * r * 0.2, y: P.y - ny * r * sA + uy * r * 0.2 };
    cone.setAttribute('points', `${A.x.toFixed(1)},${A.y.toFixed(1)} ${far1.x.toFixed(1)},${far1.y.toFixed(1)} ${far2.x.toFixed(1)},${far2.y.toFixed(1)} ${B.x.toFixed(1)},${B.y.toFixed(1)}`);
    gCone.setAttribute('x1', M.x); gCone.setAttribute('y1', M.y); gCone.setAttribute('x2', P.x + ux * r); gCone.setAttribute('y2', P.y + uy * r);
    spot.setAttribute('cx', P.x.toFixed(1)); spot.setAttribute('cy', P.y.toFixed(1)); spot.setAttribute('rx', r); spot.setAttribute('ry', r);

    // darkness mask holes (CSS px, relative to the wrap)
    const m = scene.getScreenCTM();
    if (m) {
      const wr = wrap.getBoundingClientRect();
      const sp = new DOMPoint(P.x, P.y).matrixTransform(m), lp = new DOMPoint(M.x, M.y).matrixTransform(m);
      wrap.style.setProperty('--mx', (sp.x - wr.left).toFixed(1) + 'px');
      wrap.style.setProperty('--my', (sp.y - wr.top).toFixed(1) + 'px');
      wrap.style.setProperty('--lx', (lp.x - wr.left).toFixed(1) + 'px');
      wrap.style.setProperty('--ly', (lp.y - wr.top).toFixed(1) + 'px');
      wrap.style.setProperty('--r', (r * m.a * 1.55).toFixed(1) + 'px');
    }

    // eyes follow the light
    eyes.forEach(e => {
      const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, mag = Math.min(10, d * 0.04);
      e.pupil.style.transform = `translate(${(dx / d * mag).toFixed(2)}px, ${(dy / d * mag * 0.8).toFixed(2)}px)`;
    });
  }

  // wall clock — real local time
  const ticks = $('#clockTicks');
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, r1 = i % 3 ? 48 : 44, r2 = 54;
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', 755 + Math.sin(a) * r1); l.setAttribute('y1', 150 - Math.cos(a) * r1);
    l.setAttribute('x2', 755 + Math.sin(a) * r2); l.setAttribute('y2', 150 - Math.cos(a) * r2);
    if (i % 3) l.setAttribute('stroke-width', '2');
    ticks.appendChild(l);
  }
  const hH = $('#hHour'), hM = $('#hMin'), hS = $('#hSec'), footTime = $('#footTime');
  function tickClock() {
    const d = new Date(), s = d.getSeconds(), mi = d.getMinutes(), h = d.getHours() % 12;
    hS.setAttribute('transform', `rotate(${s * 6} 755 150)`);
    hM.setAttribute('transform', `rotate(${mi * 6 + s * 0.1} 755 150)`);
    hH.setAttribute('transform', `rotate(${h * 30 + mi * 0.5} 755 150)`);
    footTime.textContent = `${pad(d.getHours())}:${pad(mi)}`;
  }
  tickClock(); setInterval(tickClock, 1000);

  // render loop, paused when the hero is off screen
  let heroVisible = true, raf = 0;
  function loop(now) { renderScene(now); raf = heroVisible && !document.hidden ? requestAnimationFrame(loop) : 0; }
  function start() { if (!raf) raf = requestAnimationFrame(loop); }
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; if (heroVisible) start(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && heroVisible) start(); });
  setLids(); scheduleBlink(); start();
  addEventListener('resize', () => renderScene(performance.now()));

  /* =========================================================
     POMODORO TIMER
     ========================================================= */
  const card = $('#timerCard'), tTime = $('#tTime'), tLabel = $('#tLabel'), tStart = $('#tStart'), tStartTxt = $('#tStartTxt');
  const ringFg = $('#ringFg'), CIRC = 2 * Math.PI * 52;
  const modeBtns = $$('.modes button'), dots = $$('.sessions i');
  const DUR = { focus: 25 * 60, break: 5 * 60 };
  const st = { mode: 'focus', remaining: DUR.focus, running: false, endAt: 0, sessions: 0 };
  let timerInt = 0;
  ringFg.style.strokeDasharray = CIRC.toFixed(2);
  const baseTitle = document.title;

  function paint() {
    const r = Math.max(0, Math.ceil(st.remaining));
    tTime.textContent = `${pad(Math.floor(r / 60))}:${pad(r % 60)}`;
    ringFg.style.strokeDashoffset = (CIRC * (1 - st.remaining / DUR[st.mode])).toFixed(2);
    document.title = st.running ? `${tTime.textContent} · ${st.mode === 'focus' ? 'Focusing' : 'Break'} — DEEP FOCUS` : baseTitle;
  }
  function setRunning(on) {
    st.running = on;
    card.classList.toggle('running', on);
    tStart.setAttribute('aria-pressed', on ? 'true' : 'false');
    tStartTxt.textContent = on ? 'Pause' : (st.remaining < DUR[st.mode] ? 'Resume' : (st.mode === 'focus' ? 'Start focus' : 'Start break'));
    tLabel.textContent = on ? (st.mode === 'focus' ? 'deep in it' : 'breathe') : (st.remaining < DUR[st.mode] ? 'paused' : 'ready');
    // the brain works harder while the clock runs
    const focusing = on && st.mode === 'focus';
    scene.style.setProperty('--beat', focusing ? '0.85s' : on ? '1.8s' : '2.6s');
    glow.style.setProperty('--beat', focusing ? '0.85s' : on ? '1.8s' : '2.6s');
    scene.classList.toggle('running-scene', focusing);
    lidBase = focusing ? -12 : -2; setLids();
    clearInterval(timerInt);
    if (on) {
      st.endAt = Date.now() + st.remaining * 1000;
      timerInt = setInterval(() => {
        st.remaining = (st.endAt - Date.now()) / 1000;
        if (st.remaining <= 0) complete(); else paint();
      }, 250);
    }
    paint();
  }
  function setMode(mode) {
    st.mode = mode; st.remaining = DUR[mode];
    modeBtns.forEach(b => { const on = b.dataset.mode === mode; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    card.classList.toggle('is-break', mode === 'break');
    setRunning(false);
  }
  function complete() {
    chime();
    if (st.mode === 'focus') { st.sessions = (st.sessions % 4) + 1; dots.forEach((d, i) => d.classList.toggle('on', i < st.sessions)); setMode('break'); tLabel.textContent = 'well done'; }
    else { setMode('focus'); }
  }
  tStart.addEventListener('click', () => setRunning(!st.running));
  $('#tReset').addEventListener('click', () => { st.remaining = DUR[st.mode]; setRunning(false); });
  modeBtns.forEach((b, i) => {
    b.addEventListener('click', () => setMode(b.dataset.mode));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = modeBtns[(i + 1) % 2]; n.focus(); setMode(n.dataset.mode); } });
  });
  paint();

  /* =========================================================
     AMBIENT SOUND — Web Audio, generated live (off by default)
     ========================================================= */
  let actx = null, master = null, voice = null, kind = 'rain', soundOn = false;
  const sToggle = $('#sToggle'), sTxt = $('#sTxt'), sVol = $('#sVol');
  const kindBtns = $$('.sound-kind button');
  const volume = () => Math.pow(sVol.value / 100, 2) * 0.9;

  function ensureCtx() {
    if (actx) return;
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination);
  }
  function noise(type, seconds) {
    const sr = actx.sampleRate, N = Math.floor(sr * seconds), X = 4096;
    const buf = actx.createBuffer(2, N - X, sr);
    for (let ch = 0; ch < 2; ch++) {
      const tmp = new Float32Array(N);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < N; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'brown') { last = (last + 0.02 * w) / 1.02; tmp[i] = last * 3.5; }
        else if (type === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          tmp[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        } else tmp[i] = w;
      }
      // crossfade the tail into the head so the loop is seamless
      const out = buf.getChannelData(ch);
      for (let i = 0; i < N - X; i++) out[i] = tmp[i];
      for (let i = 0; i < X; i++) { const t = i / X; out[i] = tmp[i] * t + tmp[N - X + i] * (1 - t); }
    }
    return buf;
  }
  const bufs = {};
  function loopSrc(type) {
    bufs[type] = bufs[type] || noise(type, 5);
    const s = actx.createBufferSource(); s.buffer = bufs[type]; s.loop = true; return s;
  }
  function buildVoice(k) {
    const out = actx.createGain(); out.gain.value = 1; out.connect(master);
    const nodes = [], timers = [];
    if (k === 'brown') {
      const s = loopSrc('brown'), lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const g = actx.createGain(); g.gain.value = 0.9;
      s.connect(lp).connect(g).connect(out); s.start(); nodes.push(s);
    } else {
      // steady rain bed
      const s = loopSrc('pink'), hp = actx.createBiquadFilter(), lp = actx.createBiquadFilter(), g = actx.createGain();
      hp.type = 'highpass'; hp.frequency.value = 380; lp.type = 'lowpass'; lp.frequency.value = 6500; g.gain.value = 0.55;
      s.connect(hp).connect(lp).connect(g).connect(out); s.start(); nodes.push(s);
      // gusts
      const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.18;
      lfo.connect(lg).connect(g.gain); lfo.start(); nodes.push(lfo);
      // distant rumble
      const r = loopSrc('brown'), rl = actx.createBiquadFilter(), rg = actx.createGain();
      rl.type = 'lowpass'; rl.frequency.value = 220; rg.gain.value = 0.4;
      r.connect(rl).connect(rg).connect(out); r.start(); nodes.push(r);
      // individual droplets on the window
      bufs.click = bufs.click || noise('white', 0.12);
      const sched = () => {
        const now = actx.currentTime;
        const n = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n; i++) {
          const t = now + Math.random() * 0.1;
          const d = actx.createBufferSource(); d.buffer = bufs.click;
          const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 4200; bp.Q.value = 2 + Math.random() * 5;
          const eg = actx.createGain(); const a = 0.05 + Math.random() * 0.22;
          eg.gain.setValueAtTime(0.0001, t); eg.gain.exponentialRampToValueAtTime(a, t + 0.003); eg.gain.exponentialRampToValueAtTime(0.0001, t + 0.02 + Math.random() * 0.05);
          d.connect(bp).connect(eg).connect(out); d.start(t, Math.random() * 0.05, 0.08);
        }
      };
      timers.push(setInterval(sched, 100));
    }
    return { out, nodes, timers };
  }
  function killVoice(v, when) {
    if (!v) return;
    v.out.gain.setTargetAtTime(0, actx.currentTime, 0.15);
    setTimeout(() => { v.timers.forEach(clearInterval); v.nodes.forEach(n => { try { n.stop(); } catch (e) { /* already stopped */ } }); v.out.disconnect(); }, when || 900);
  }
  function setSound(on) {
    soundOn = on;
    sToggle.setAttribute('aria-pressed', on);
    sTxt.textContent = on ? (kind === 'rain' ? 'Rain on' : 'Brown noise on') : 'Sound off';
    if (on) {
      ensureCtx(); actx.resume();
      if (!voice) voice = buildVoice(kind);
      master.gain.setTargetAtTime(volume(), actx.currentTime, 0.4);
    } else if (actx) {
      master.gain.setTargetAtTime(0, actx.currentTime, 0.2);
      const v = voice; voice = null; killVoice(v, 1200);
    }
  }
  sToggle.addEventListener('click', () => setSound(!soundOn));
  kindBtns.forEach(b => b.addEventListener('click', () => {
    kind = b.dataset.kind;
    kindBtns.forEach(x => x.setAttribute('aria-pressed', x === b));
    if (soundOn) { const old = voice; voice = buildVoice(kind); voice.out.gain.value = 0; voice.out.gain.setTargetAtTime(1, actx.currentTime, 0.3); killVoice(old); sTxt.textContent = kind === 'rain' ? 'Rain on' : 'Brown noise on'; }
  }));
  sVol.addEventListener('input', () => { if (soundOn && actx) master.gain.setTargetAtTime(volume(), actx.currentTime, 0.05); });

  // soft two-note chime when a session ends
  function chime() {
    try {
      ensureCtx(); actx.resume();
      const t = actx.currentTime;
      [[659.25, 0], [987.77, 0.18]].forEach(([f, d]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 1.6);
        o.connect(g).connect(actx.destination); o.start(t + d); o.stop(t + d + 1.7);
      });
    } catch (e) { /* audio unavailable */ }
  }

  /* =========================================================
     STREAK HEATMAP
     ========================================================= */
  const heat = $('#heat'), tip = $('#heatTip'), monthsEl = $('#heatMonths');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dow = d => (d.getDay() + 6) % 7; // Monday = 0
  const startDate = new Date(today); startDate.setDate(today.getDate() - (52 * 7 + dow(today)));
  let seed = 1234567; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const days = [];
  for (let d = new Date(startDate), i = 0; d <= today; d.setDate(d.getDate() + 1), i++) {
    const date = new Date(d), wd = dow(date), daysAgo = Math.round((today - date) / 864e5);
    const month = date.getMonth();
    let p = wd >= 5 ? 0.5 : 0.78;
    if (month === 7 && date.getDate() > 4 && date.getDate() < 20) p = 0.06; // holiday
    let mins = rnd() < p ? Math.round(25 + rnd() * rnd() * 260) : 0;
    if (daysAgo < 23) mins = Math.max(mins, Math.round(40 + rnd() * 200)); // current streak
    if (daysAgo === 23) mins = 0;
    if (daysAgo > 160 && daysAgo <= 201) mins = Math.max(mins, Math.round(30 + rnd() * 150)); // the spring run
    if (daysAgo === 202 || daysAgo === 159) mins = 0;
    days.push({ date, mins, col: Math.floor(i / 7), row: wd });
  }
  const level = m => m === 0 ? 0 : m < 75 ? 1 : m < 140 ? 2 : m < 210 ? 3 : 4;
  const frag = document.createDocumentFragment();
  days.forEach((d, i) => {
    const c = document.createElement('i');
    c.className = 'l' + level(d.mins) + (i === days.length - 1 ? ' today' : '');
    c.style.setProperty('--c', d.col); c.style.setProperty('--r', d.row);
    c.dataset.i = i; frag.appendChild(c);
  });
  heat.appendChild(frag);
  const ncols = days[days.length - 1].col + 1;
  let lastM = -1;
  days.forEach(d => { if (d.row === 0 || d === days[0]) { const m = d.date.getMonth(); if (m !== lastM && d.date.getDate() <= 7) { const s = document.createElement('span'); s.textContent = d.date.toLocaleString('en', { month: 'short' }); s.style.left = (d.col / ncols * 100) + '%'; monthsEl.appendChild(s); } lastM = m; } });
  const fmtMins = m => m >= 60 ? `${Math.floor(m / 60)}h ${pad(m % 60)}m` : `${m}m`;
  const fmtDate = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  function showDay(i) {
    const d = days[i];
    tip.innerHTML = d.mins ? `<b>${fmtDate(d.date)}</b> · ${fmtMins(d.mins)} of deep work · ${Math.max(1, Math.round(d.mins / 25))} sessions` : `<b>${fmtDate(d.date)}</b> · lights out — rest counts too`;
  }
  heat.addEventListener('pointerover', e => { if (e.target.dataset.i) showDay(+e.target.dataset.i); });
  // keyboard: focus the grid, arrow through nights
  heat.tabIndex = 0; let kIdx = days.length - 1;
  heat.addEventListener('keydown', e => {
    const step = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[e.key]; if (!step) return;
    e.preventDefault(); heat.children[kIdx].style.outlineColor = '';
    kIdx = clamp(kIdx + step, 0, days.length - 1); heat.children[kIdx].style.outlineColor = '#fff'; showDay(kIdx);
  });
  heat.addEventListener('blur', () => { heat.children[kIdx].style.outlineColor = ''; });
  // stats
  let cur = 0; for (let i = days.length - 1; i >= 0 && days[i].mins > 0; i--) cur++;
  let longest = 0, run = 0; days.forEach(d => { run = d.mins ? run + 1 : 0; longest = Math.max(longest, run); });
  const hours = Math.round(days.reduce((s, d) => s + d.mins, 0) / 60);
  function countUp(el, to) {
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1400;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e).toLocaleString('en'); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  let statsDone = false;
  new IntersectionObserver(([e], o) => { if (e.isIntersecting && !statsDone) { statsDone = true; countUp($('#stCur'), cur); countUp($('#stLong'), longest); countUp($('#stHours'), hours); o.disconnect(); } }, { threshold: 0.4 }).observe($('.streak-stats'));
  // scroll the heatmap to "today" on small screens
  const hs = $('.heat-scroll'); requestAnimationFrame(() => { hs.scrollLeft = hs.scrollWidth; });

  /* =========================================================
     PRICING TOGGLE
     ========================================================= */
  const billBtns = $$('.billing button'), proPrice = $('#proPrice'), proPer = $('#proPer');
  billBtns.forEach(b => b.addEventListener('click', () => {
    billBtns.forEach(x => x.setAttribute('aria-pressed', x === b));
    const yearly = b.dataset.bill === 'year';
    proPrice.textContent = yearly ? '€3' : '€4';
    proPer.textContent = yearly ? '/ month, billed yearly' : '/ month, cancel anytime';
    proPrice.classList.remove('flip'); void proPrice.offsetWidth; proPrice.classList.add('flip');
  }));

  /* =========================================================
     TESTIMONIALS
     ========================================================= */
  const Q = [
    ['I wrote my thesis between 1 and 4 a.m. with the rain soundscape on. The little blob with the glowing brain kept me honest.', 'Mira K.', 'PhD candidate, Lisbon', '#3ef0e0'],
    ['The blocker is the first one I haven’t figured out how to cheat. Which is annoying. And great.', 'Dev R.', 'Indie game developer', '#ffd400'],
    ['Brown noise plus 25/5 is basically my whole personality now.', 'Lou T.', 'Night-shift nurse & illustrator', '#ff6fd8'],
    ['Forgiveness tokens are genius. One bad night no longer wipes out sixty nights of momentum.', 'Sam O.', 'Backend engineer', '#7a5cff'],
    ['It feels like a cosy room, not a productivity app shouting at me.', 'Inès P.', 'Novelist', '#b9ffc8'],
    ['Shipped two side projects this year. Both after midnight. Both with DEEP FOCUS open.', 'Theo W.', 'Product designer', '#3ef0e0']
  ];
  const ava = c => `<svg class="q-ava" viewBox="0 0 42 42" aria-hidden="true"><rect width="42" height="42" rx="14" fill="${c}"/><circle cx="15" cy="19" r="6" fill="#fff"/><circle cx="27" cy="19" r="6" fill="#fff"/><circle cx="16" cy="20" r="2.6" fill="#0b0b0f"/><circle cx="28" cy="20" r="2.6" fill="#0b0b0f"/><path d="M9 15q6-5 12 0M21 15q6-5 12 0" stroke="${c === '#7a5cff' ? '#b9a8ff' : '#0b0b0f'}" stroke-opacity=".35" stroke-width="3" fill="none"/><path d="M17 30q4 3 8 0" stroke="#0b0b0f" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;
  const card4 = (q, dup) => `<figure class="q${dup ? ' dup' : ''}"${dup ? ' aria-hidden="true"' : ''}><p>“${q[0]}”</p><footer>${ava(q[3])}<div><b>${q[1]}</b><span>${q[2]}</span></div></footer></figure>`;
  const r1 = Q.slice(0, 3).concat(Q.slice(3)), r2 = Q.slice(3).concat(Q.slice(0, 3));
  $('#qRow1').innerHTML = r1.map(q => card4(q)).join('') + r1.map(q => card4(q, true)).join('');
  $('#qRow2').innerHTML = r2.map(q => card4(q, true)).join('') + r2.map(q => card4(q, true)).join('');

  /* =========================================================
     DOWNLOAD / FORMS / REVEALS
     ========================================================= */
  $$('[data-demo]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); $('#dlDemo').textContent = 'Demo concept — downloads are switched off, but thanks for the enthusiasm.'; }));
  const wait = $('#waitForm');
  wait.addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#waitEmail').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { wait.classList.remove('bad'); void wait.offsetWidth; wait.classList.add('bad'); $('#waitEmail').focus(); return; }
    wait.classList.remove('bad'); $('.wait-row', wait).hidden = true; $('#waitDone').hidden = false;
  });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.2 });
  $$('.reveal').forEach(el => io.observe(el));
})();
