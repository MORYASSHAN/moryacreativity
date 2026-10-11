import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CAM_Z, FOV } from './layout.js';
import Scene from './scene/Scene.jsx';
import Overlay from './ui/Overlay.jsx';

export default function App() {
  return (
    <>
      <Canvas
        className="stage"
        flat
        dpr={[1, 2]}
        camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.05, far: 220 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Overlay />
      <main>
        {/* scrolling through this section flies the camera into the lens */}
        <section id="dive" aria-label="Into the lens">
          <h1 className="sr-only">Rangefinder — four frames, one story</h1>
        </section>
      </main>
    </>
  );
}
