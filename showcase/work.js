// Case-study page, rendered from projects.js by the ?p=<slug> query.
import { PROJECTS, pageUrl } from './projects.js';
import { $, chrome, buildPanels, sound, reduced, resumeSound } from './common.js';

chrome();
buildPanels();
resumeSound();

const slug = new URLSearchParams(location.search).get('p');
const i = Math.max(0, PROJECTS.findIndex((p) => p.slug === slug));
const p = PROJECTS[i];
const next = PROJECTS[(i + 1) % PROJECTS.length];
const live = p.kind === 'live';
const href = pageUrl(p);

document.title = `${p.title} — Shaan`;
document.querySelector('meta[name="description"]').content = p.line;

$('#kicker').textContent = `${String(i + 1).padStart(3, '0')} — ${live ? 'Live website' : 'Concept landing page'}`;
$('#line').textContent = p.line;
$('#m-type').textContent = live ? 'Live website' : 'Concept';
$('#m-role').textContent = p.role;
$('#m-year').textContent = p.year;
$('#m-about').textContent = p.about;
$('#bgimg').style.backgroundImage = `url(${p.cover})`;
$('#poster').style.backgroundImage = `url(${p.cover})`;

// big title, letters arrive in a random order
const title = $('#title');
title.innerHTML = [...p.title].map((ch) => (ch === ' ' ? '<span class="sp"></span>' : `<span class="ch">${ch}</span>`)).join('');
const chars = [...title.querySelectorAll('.ch')];
chars
  .map((c) => [Math.random(), c])
  .sort((a, b) => a[0] - b[0])
  .forEach(([, c], k) => setTimeout(() => c.classList.add('on'), reduced ? 0 : 450 + k * 140));

// more info
const more = $('#more');
more.addEventListener('click', () => {
  const open = more.getAttribute('aria-expanded') !== 'true';
  more.setAttribute('aria-expanded', String(open));
  $('#meta').classList.toggle('open', open);
});

// circular badge + full-screen link
const badge = $('#badge');
const verb = live ? 'Visit the live site' : 'Launch the concept';
$('#badge-text').textContent = `${verb} · ${verb} · `;
for (const a of [badge, $('#open-full')]) {
  a.href = href;
  if (live) { a.target = '_blank'; a.rel = 'noopener'; }
}
$('#open-full').textContent = live ? 'Visit live site ↗' : 'Open full screen ↗';
$('#stage-note').textContent = live ? `${p.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} — live` : 'Interactive concept · runs in your browser';

// stage: clip-reveal on scroll, then swaps to a live iframe on click
const stage = $('#stage');
$('#play-label').textContent = live ? 'Play live preview' : 'Play the concept';
new IntersectionObserver((es, io) => {
  if (es[0].isIntersecting) { stage.classList.add('shown'); io.disconnect(); }
}, { threshold: 0.25 }).observe(stage);

function play() {
  if (stage.classList.contains('live')) return;
  const f = document.createElement('iframe');
  f.src = href;
  f.title = `${p.title} — interactive preview`;
  f.loading = 'eager';
  f.allow = 'autoplay; fullscreen';
  stage.append(f);
  stage.classList.add('live');
  stage.removeAttribute('data-cursor');
  stage.removeAttribute('role');
  stage.removeAttribute('tabindex');
  stage.style.cursor = 'auto';
  sound.set(false); // let the project's own audio take over
}
stage.addEventListener('click', play);
stage.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });

// chapter rows
const ol = $('#chapters');
ol.innerHTML = p.chapters
  .map(([h, d], k) => `<li><span class="n">${String(k + 1).padStart(3, '0')}</span><span class="h">${h}</span><span class="o" aria-hidden="true"></span><span class="d">${d}</span></li>`)
  .join('');
const io = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (!e.isIntersecting) return;
    const li = e.target;
    setTimeout(() => li.classList.add('in'), [...ol.children].indexOf(li) * 110);
    io.unobserve(li);
  });
}, { threshold: 0.2 });
[...ol.children].forEach((li, k) => {
  io.observe(li);
  li.addEventListener('pointerenter', () => sound.ping(k + 1));
});

// next project
const nx = $('#next');
nx.href = `work.html?p=${next.slug}`;
$('#next-title').textContent = next.title;
$('#next-kind').textContent = next.kind === 'live' ? 'Live website' : 'Concept landing page';
$('#next-bg').style.backgroundImage = `url(${next.cover})`;
