# Shaan — Showcase

A dark, cinematic portfolio in the style of a floating 3D gallery. It is a plain
static site (no build step) and lives apart from the Rangefinder project in the
parent folder; nothing outside `showcase/` is used.

```
index.html      intro gate → welcome lockup → endless 3D card field (gallery.js)
work.html       case-study page, rendered from projects.js via ?p=<slug> (work.js)
projects.js     every project: live sites + concept landing pages
common.js       cursor, generated ambient sound, overlays, page transitions
style.css       shared styles
concepts/<slug>/  the eight concept landing pages, each self-contained
assets/shots/   gallery covers (screenshots), assets/img/ photos used by concepts
```

## Run locally

From the parent folder (`D:\creative`):

```bash
npm exec -- vite showcase --port 5190
```

## Add a project

Add an entry to `PROJECTS` in `projects.js` with a cover image in `assets/shots/`.
`kind: 'live'` needs a `url`; `kind: 'concept'` expects a page at `concepts/<slug>/`.

## Deploy

Deploy the `showcase` folder as a static site, e.g. with the Vercel CLI:

```bash
vercel deploy showcase
```
