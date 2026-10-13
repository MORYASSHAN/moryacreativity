import { cpSync } from 'node:fs';
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The showcase (case studies + concept landing pages) is plain static HTML that
// the galaxy links into. The dev server serves it straight from showcase/;
// a build copies it to dist/showcase/ untouched.
const showcase = () => ({
  name: 'copy-showcase',
  apply: 'build',
  closeBundle() {
    cpSync('showcase', 'dist/showcase', { recursive: true, filter: (src) => !src.endsWith('README.md') });
  },
});

export default defineConfig({
  base: './',
  plugins: [react(), showcase()],
})
