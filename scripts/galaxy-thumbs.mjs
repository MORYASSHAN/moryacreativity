// Builds the card textures shown in the galaxy (public/galaxy/<slug>.webp)
// from the showcase cover screenshots, cropped to one 16:10 shape.
//
//   node scripts/galaxy-thumbs.mjs
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../showcase/assets/shots/', import.meta.url));
const OUT = fileURLToPath(new URL('../public/galaxy/', import.meta.url));
await mkdir(OUT, { recursive: true });

for (const file of await readdir(SRC)) {
  if (!file.endsWith('.jpg')) continue;
  const name = file.replace(/\.jpg$/, '');
  await sharp(`${SRC}${file}`)
    .resize(1280, 800, { fit: 'cover', position: 'top' })
    .webp({ quality: 82 })
    .toFile(`${OUT}${name}.webp`);
  console.log(`${name}.webp`);
}
