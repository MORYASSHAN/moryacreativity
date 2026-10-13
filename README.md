# Rangefinder × Showcase

A vintage rangefinder seen from the back. Scroll to dive through its lens; on
the far side, every project floats in the galaxy — move the cursor to look
around, hover a card, click to open it.

```
src/                 the Rangefinder (React + three.js)
  scene/Constellation.jsx   the project cards in the galaxy
  galaxy.js                 card layout + projects list
showcase/            static showcase: concept landing pages, case studies
  projects.js        the project list (shared with the galaxy)
public/              photos + galaxy card textures (copied as-is)
scripts/             asset builders (photos, galaxy thumbnails, Altitude cut-out)
```

## Develop

```bash
npm install
npm run dev
```

`/#galaxy` skips the dive and lands straight among the projects.

## Add or change a project

1. Edit `showcase/projects.js` and put a cover in `showcase/assets/shots/<slug>.jpg`.
2. Run `node scripts/galaxy-thumbs.mjs` to rebuild the galaxy textures.

## Deploy (Vercel)

`vercel.json` is set up: install `npm install`, build `npm run build`, output `dist`.
The build copies `showcase/` into `dist/showcase/`. Import the repo in Vercel,
or from this folder run:

```bash
npx vercel deploy --prod
```
