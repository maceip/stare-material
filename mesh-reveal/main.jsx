import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls, button } from 'leva';
import TerminalChrome from './TerminalChrome';
import ScanlineReveal from './ScanlineReveal';

function Scene() {
  const [trigger, setTrigger] = useState(0);

  const chrome = useControls('Chrome', {
    bezelMode: { value: 'custom', options: ['fluted', 'custom'] },
    glassColor: '#0a2a1a',
    glowColor: '#1a6b3a',
    bodyColor: '#101018',
    bezelWidth: { value: 0.06, min: 0.02, max: 0.2, step: 0.005 },
  });

  const fluted = useControls('Fluted Glass', {
    distortion: { value: 0.8, min: 0, max: 1.5, step: 0.05 },
    fill: { value: 0.3, min: 0, max: 1, step: 0.05 },
    glow: { value: 0.8, min: 0, max: 2, step: 0.05 },
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
      <TerminalChrome
        width={w}
        height={h}
        bezelMode={chrome.bezelMode}
        bezelWidth={chrome.bezelWidth}
        glassColor={chrome.glassColor}
        glowColor={chrome.glowColor}
        bodyColor={chrome.bodyColor}
        flutedConfig={{
          distortion: fluted.distortion,
          fill: fluted.fill,
          glow: fluted.glow,
        }}
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#ffffff']} />
        <Scene />
      </Canvas>
    </div>
  </StrictMode>
);
