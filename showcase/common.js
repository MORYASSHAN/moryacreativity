// Shared chrome for every page: cursor, ambient sound, overlays and page transitions.
import { OWNER, PROJECTS } from './projects.js';

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

/* ------------------------------------------------------------------ cursor */
export const cursor = (() => {
  const el = document.createElement('div');
  el.className = 'cursor';
  el.innerHTML = '<span></span>';
  document.body.append(el);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  const tick = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(tick);
  };
  tick();
  const api = {
    big(label) { el.classList.add('big'); el.classList.remove('ring'); el.firstChild.textContent = label; },
    ring() { el.classList.add('ring'); el.classList.remove('big'); },
    reset() { el.classList.remove('big', 'ring'); },
  };
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('a, button, [data-cursor]');
    if (!t) return;
    if (t.dataset.cursor) api.big(t.dataset.cursor);
    else api.ring();
  });
  document.addEventListener('pointerout', (e) => {
    const t = e.target.closest('a, button, [data-cursor]');
    if (t && !t.contains(e.relatedTarget)) api.reset();
  });
  return api;
})();

/* ------------------------------------------------------------------ ambient sound (generated, no files) */
export const sound = (() => {
  let ctx, master, wet, on = false;
  const buttons = new Set();

  function impulse(seconds) {
    const len = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  }

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const verb = ctx.createConvolver();
    verb.buffer = impulse(5);
    wet = ctx.createGain();
    wet.gain.value = 0.9;
    wet.connect(verb).connect(master);

    // a slow, dark chord: two detuned voices per note through a breathing low-pass
    const notes = [55, 82.41, 110, 130.81, 164.81, 246.94];
    notes.forEach((f, i) => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 380 + i * 40;
      filter.Q.value = 0.7;
      const lfo = ctx.createOscillator();
      const lfoAmt = ctx.createGain();
      lfo.frequency.value = 0.03 + i * 0.013;
      lfoAmt.gain.value = 240;
      lfo.connect(lfoAmt).connect(filter.frequency);
      lfo.start();
      const g = ctx.createGain();
      g.gain.value = (i < 2 ? 0.07 : 0.035) / 2;
      [-6, 6].forEach((det) => {
        const o = ctx.createOscillator();
        o.type = i < 3 ? 'sawtooth' : 'triangle';
        o.frequency.value = f;
        o.detune.value = det;
        o.connect(filter);
        o.start();
      });
      filter.connect(g);
      g.connect(master);
      g.connect(wet);
    });

    // air: filtered noise that swells
    const nb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = nb;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.5;
    const ng = ctx.createGain();
    ng.gain.value = 0.012;
    const nl = ctx.createOscillator();
    const nla = ctx.createGain();
    nl.frequency.value = 0.07;
    nla.gain.value = 0.01;
    nl.connect(nla).connect(ng.gain);
    nl.start();
    noise.connect(bp).connect(ng);
    ng.connect(wet);
    noise.start();
  }

  function set(v) {
    on = v;
    store.set('shaan-sound', v ? '1' : '0');
    if (v) {
      if (!ctx) build();
      ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.55, ctx.currentTime, 1.2);
    } else if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    }
    buttons.forEach((b) => {
      b.classList.toggle('on', v);
      b.setAttribute('aria-pressed', String(v));
    });
  }

  // a soft bell, pitched from a pentatonic scale — used on hover
  const scale = [440, 493.88, 587.33, 659.25, 783.99, 880];
  function ping(i = Math.floor(Math.random() * scale.length)) {
    if (!on || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = scale[i % scale.length];
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    o.connect(g);
    g.connect(wet);
    g.connect(master);
    o.start(t);
    o.stop(t + 2.3);
  }

  function mount(btn) {
    buttons.add(btn);
    btn.addEventListener('click', () => set(!on));
    btn.classList.toggle('on', on);
  }

  return { set, ping, mount, get on() { return on; }, wanted: () => store.get('shaan-sound') === '1' };
})();

/* ------------------------------------------------------------------ page transitions */
const curtain = document.createElement('div');
curtain.className = 'curtain';
document.body.append(curtain);
requestAnimationFrame(() => requestAnimationFrame(() => curtain.classList.add('out')));
addEventListener('pageshow', (e) => { if (e.persisted) curtain.className = 'curtain out'; });

export function go(href) {
  curtain.classList.remove('out');
  curtain.classList.add('in');
  setTimeout(() => { location.href = href; }, reduced ? 0 : 650);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-nav]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  go(a.getAttribute('href'));
});

/* ------------------------------------------------------------------ overlays */
const kindLabel = (p) => (p.kind === 'live' ? 'Live site' : 'Concept');

export function buildPanels(root = '') {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
  <section class="panel" id="panel-work" role="dialog" aria-modal="true" aria-label="All work">
    <button class="close" data-close>Close <i></i></button>
    <div class="panel-inner">
      <div class="filters reveal" role="group" aria-label="Filter projects">
        <button aria-pressed="true" data-filter="all">All · ${PROJECTS.length}</button>
        <button aria-pressed="false" data-filter="live">Live sites · ${PROJECTS.filter((p) => p.kind === 'live').length}</button>
        <button aria-pressed="false" data-filter="concept">Concepts · ${PROJECTS.filter((p) => p.kind === 'concept').length}</button>
      </div>
      <ol class="index-list reveal">
        ${PROJECTS.map((p, i) => `
          <li data-kind="${p.kind}">
            <a href="${root}work.html?p=${p.slug}" data-nav data-slug="${p.slug}">
              <span class="no">${String(i + 1).padStart(3, '0')}</span>
              <span class="t">${p.title}<span class="tag">${kindLabel(p)}</span></span>
              <span class="r">${p.role}</span>
              <span class="y">${p.year}</span>
            </a>
          </li>`).join('')}
      </ol>
    </div>
  </section>

  <section class="panel" id="panel-about" role="dialog" aria-modal="true" aria-label="About">
    <button class="close" data-close>Close <i></i></button>
    <div class="panel-inner">
      <div class="about-grid">
        <p class="about-lede reveal">I'm ${OWNER.name} — a designer and developer who builds websites that feel like <em>stories</em>.
          Neon cities you can shoot your way through, dreams with a soundtrack, shops that smell of jute.
          Every page here is designed, illustrated, animated and coded by hand.</p>
        <div class="skills reveal">
          <div><h3>Design</h3><ul><li>Art direction</li><li>Landing pages</li><li>Illustration & brand</li></ul></div>
          <div><h3>Development</h3><ul><li>React · Three.js · WebGL</li><li>Canvas & SVG motion</li><li>Full-stack e-commerce</li></ul></div>
          <div><h3>Story</h3><ul><li>Scroll narratives</li><li>Interactive moments</li><li>Sound & atmosphere</li></ul></div>
        </div>
      </div>
      <div class="stats reveal">
        <div><b>${PROJECTS.filter((p) => p.kind === 'live').length}</b><span>Live sites</span></div>
        <div><b>${PROJECTS.filter((p) => p.kind === 'concept').length}</b><span>Concept pages</span></div>
        <div><b>0</b><span>Templates used</span></div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-contact" role="dialog" aria-modal="true" aria-label="Contact">
    <button class="close" data-close>Close <i></i></button>
    <div class="panel-inner contact">
      <div class="say reveal">Have a story worth building?</div>
      <a class="mail reveal" href="mailto:${OWNER.email}">${OWNER.email}</a>
      <div class="socials reveal">
        ${OWNER.links.map((l) => `<a class="link" href="${l.href}" target="_blank" rel="noopener">${l.label} ↗</a>`).join('')}
      </div>
    </div>
  </section>
  <div class="peek" aria-hidden="true"><div></div></div>`;
  document.body.append(...wrap.children);

  let open = null;
  let lastFocus = null;
  const onChange = new Set();
  const openPanel = (id) => {
    if (open) open.classList.remove('open');
    open = $(`#panel-${id}`);
    lastFocus = document.activeElement;
    open.classList.add('open');
    $('.close', open).focus({ preventScroll: true });
    onChange.forEach((f) => f(true));
  };
  const closePanel = () => {
    if (!open) return;
    open.classList.remove('open');
    open = null;
    peek.classList.remove('on');
    onChange.forEach((f) => f(false));
    lastFocus?.focus?.({ preventScroll: true });
  };
  $$('[data-close]').forEach((b) => b.addEventListener('click', closePanel));
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => openPanel(b.dataset.open)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

  // filters
  const list = $('.index-list');
  $$('[data-filter]').forEach((b) =>
    b.addEventListener('click', () => {
      $$('[data-filter]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      $$('li', list).forEach((li) => li.classList.toggle('hidden', b.dataset.filter !== 'all' && li.dataset.kind !== b.dataset.filter));
    }),
  );

  // floating cover preview that follows the cursor over the list
  const peek = $('.peek');
  const peekImg = peek.firstElementChild;
  let px = 0, py = 0, tx = 0, ty = 0, raf = 0;
  const follow = () => {
    px += (tx - px) * 0.14;
    py += (ty - py) * 0.14;
    peek.style.transform = `translate3d(${px + 30}px, ${py - 95}px, 0)`;
    raf = open ? requestAnimationFrame(follow) : 0;
  };
  list.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!raf) { px = tx; py = ty; raf = requestAnimationFrame(follow); }
  });
  $$('a', list).forEach((a, i) => {
    const p = PROJECTS.find((x) => x.slug === a.dataset.slug);
    a.addEventListener('pointerenter', () => {
      peekImg.style.backgroundImage = `url(${root}${p.cover})`;
      peek.classList.add('on');
      list.classList.add('dim');
      sound.ping(i);
    });
    a.addEventListener('pointerleave', () => { peek.classList.remove('on'); list.classList.remove('dim'); });
  });

  return { openPanel, closePanel, onChange, get isOpen() { return !!open; } };
}

export function chrome(root = '') {
  const el = document.createElement('div');
  el.innerHTML = `
    <a class="brand" href="${root}index.html#gallery" data-nav aria-label="${OWNER.name} — home"><b>${OWNER.name}</b><span>${OWNER.brand}</span></a>
    <nav class="bottom-nav" aria-label="Main">
      <small>the</small><button data-open="work">Work</button><small>and</small><button data-open="about">About</button><small>me</small><br />
      <small>or</small><button data-open="contact">Contact</button>
    </nav>
    <button class="sound" aria-label="Toggle ambient sound" aria-pressed="false"><span class="bars"><i></i><i></i><i></i><i></i></span></button>
    <div class="grain" aria-hidden="true"></div>`;
  document.body.append(...el.children);
  sound.mount($('.sound'));
}

// Restore the visitor's sound choice from the previous page (needs a gesture to start audio).
export function resumeSound() {
  if (!sound.wanted()) return;
  const start = () => {
    sound.set(true);
    removeEventListener('pointerdown', start);
    removeEventListener('keydown', start);
  };
  addEventListener('pointerdown', start);
  addEventListener('keydown', start);
}
