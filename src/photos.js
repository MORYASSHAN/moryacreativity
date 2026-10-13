import panels from './panels.json';

const base = import.meta.env.BASE_URL;
const url = (name) => `${base}photos/${name}`;

// Clockwise from the top, matching the collage.
export const PHOTOS = [
  {
    id: 'mountain',
    facet: 'top',
    title: 'Alpenglow',
    line: 'The mountain blushed first. We followed.',
    place: 'Above the treeline, late July',
    meta: 'f/8 · 1/60 s · ISO 100 · 24 mm',
    alt: 'A snow-streaked mountain glowing pink at dusk above a meadow of purple lupines.',
    texture: url('mountain-panel.webp'),
    print: url('mountain.webp'),
    mode: 'panel',
    quad: panels.mountain,
    anchor: 'outer',
    focus: { s: 0.47, t: 0.64 },
  },
  {
    id: 'runner',
    facet: 'right',
    title: 'Late for Everything',
    line: 'Shirt flying, train leaving, heart racing.',
    place: 'Platform 4, 6:58 pm',
    meta: 'f/11 · 1/15 s · ISO 200 · 35 mm · panned',
    alt: 'A man in a white tank top sprinting through a blurred street, his shirt flying behind him.',
    texture: url('runner.webp'),
    print: url('runner.webp'),
    mode: 'rect',
    focus: { x: 0.64, y: 0.56 },
  },
  {
    id: 'heart',
    facet: 'bottom',
    title: 'Golden Hour',
    line: 'Two shadows, one shape.',
    place: 'The apartment, west window',
    meta: 'f/4 · 1/250 s · ISO 200 · 28 mm',
    alt: 'The shadows of two people making a heart with their arms on a sunlit brick wall.',
    texture: url('heart-panel.webp'),
    print: url('heart.webp'),
    mode: 'panel',
    quad: panels.heart,
    focus: { s: 0.5, t: 0.42 },
  },
  {
    id: 'city',
    facet: 'left',
    title: 'City Lights',
    line: 'The skyline came on, just for us.',
    place: 'The river walk, 7:42 pm',
    meta: 'f/1.8 · 1/125 s · ISO 800 · 50 mm',
    alt: 'A couple sharing a kiss on a bicycle by the river, city towers lighting up behind them.',
    texture: url('city.webp'),
    print: url('city.webp'),
    mode: 'rect',
    focus: { x: 0.55, y: 0.4 },
  },
];

