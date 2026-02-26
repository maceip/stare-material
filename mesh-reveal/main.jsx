import { StrictMode, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';
import TerminalChrome from './TerminalChrome';
import ScanlineReveal from './ScanlineReveal';

// ── Rich gradient backgrounds ───────────────────────────────────────

const BACKGROUNDS = [
  {
    name: 'Deep Navy',
    css: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 40%, #0d1225 100%)',
    threeColor: '#0d1225',
  },
  {
    name: 'Warm Charcoal',
    css: 'linear-gradient(160deg, #1a1510 0%, #2a2018 35%, #1a1510 100%)',
    threeColor: '#1a1510',
  },
  {
    name: 'Slate Dusk',
    css: 'linear-gradient(145deg, #1c1f2e 0%, #2a2d3e 50%, #181b28 100%)',
    threeColor: '#1c1f2e',
  },
  {
    name: 'Graphite',
    css: 'linear-gradient(170deg, #1e1e24 0%, #28282f 40%, #18181e 100%)',
    threeColor: '#1e1e24',
  },
  {
    name: 'Midnight Forest',
    css: 'linear-gradient(140deg, #0a1610 0%, #142218 40%, #0a1610 100%)',
    threeColor: '#0f1a12',
  },
  {
    name: 'Obsidian Bronze',
    css: 'linear-gradient(155deg, #1a1612 0%, #2a2218 35%, #16120e 100%)',
    threeColor: '#1a1612',
  },
];

function Scene({ bgIndex }) {
  const [trigger, setTrigger] = useState(0);
  const bg = BACKGROUNDS[bgIndex];

  const chrome = useControls('Glass Surface', {
    distortion: { value: 0.6, min: 0, max: 1.5, step: 0.05 },
    glow: { value: 0.5, min: 0, max: 2, step: 0.05 },
    baseColorA: '#050808',
    baseColorB: '#0a1a12',
    accentColor: '#1a6b3a',
    dotColor: '#1a6b3a',
  });

  const reveal = useControls('Reveal', {
    color: '#FFBE18',
    hotColor: '#ffffff',
    duration: { value: 2.5, min: 0.5, max: 8, step: 0.1 },
    lineCount: { value: 80, min: 10, max: 200, step: 1 },
    glowIntensity: { value: 2.0, min: 0.5, max: 5.0, step: 0.1 },
  });

  useControls('Actions', {
    'Replay Reveal': button(() => setTrigger((t) => t + 1)),
  });

  const w = 4.5;
  const h = 2.8;

  return (
    <>
      <color attach="background" args={[bg.threeColor]} />

      <TerminalChrome
        width={w}
        height={h}
        distortion={chrome.distortion}
        glow={chrome.glow}
        baseColorA={chrome.baseColorA}
        baseColorB={chrome.baseColorB}
        accentColor={chrome.accentColor}
        dotColor={chrome.dotColor}
      >
        <ScanlineReveal
          width={w}
          height={h}
          color={reveal.color}
          hotColor={reveal.hotColor}
          duration={reveal.duration}
          lineCount={reveal.lineCount}
          glowIntensity={reveal.glowIntensity}
          trigger={trigger}
          position={[0, 0, 0.002]}
        />
      </TerminalChrome>

      <OrbitControls makeDefault />
    </>
  );
}

function App() {
  const [bgIndex, setBgIndex] = useState(0);
  const bg = BACKGROUNDS[bgIndex];

  const cycleBg = () => setBgIndex((i) => (i + 1) % BACKGROUNDS.length);

  useControls('Background', {
    [`Current: ${bg.name}`]: button(cycleBg),
  });

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: bg.css,
        transition: 'background 0.8s ease',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene bgIndex={bgIndex} />
      </Canvas>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
