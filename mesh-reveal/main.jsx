import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls, button } from 'leva';
import TerminalBand from './TerminalBand';

function Scene() {
  const [trigger, setTrigger] = useState(0);

  const chrome = useControls('Chrome', {
    glassColor: '#0a2a1a',
    glowColor: '#1a6b3a',
    bodyColor: '#0a0a0f',
  });

  const reveal = useControls('Reveal', {
    color: '#FFBE18',
    duration: { value: 2.5, min: 0.5, max: 8, step: 0.1 },
  });

  useControls('Actions', {
    'Replay All': button(() => setTrigger((t) => t + 1)),
  });

  return (
    <>
      <TerminalBand
        revealTrigger={trigger}
        revealColor={reveal.color}
        revealDuration={reveal.duration}
        glassColor={chrome.glassColor}
        glowColor={chrome.glowColor}
        bodyColor={chrome.bodyColor}
      />
      <OrbitControls makeDefault />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#ffffff']} />
        <Scene />
      </Canvas>
    </div>
  </StrictMode>
);
