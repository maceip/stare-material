import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls, button } from 'leva';
import TerminalChrome from './TerminalChrome';
import ScanlineReveal from './ScanlineReveal';
import TerminalBand from './TerminalBand';
import Choreography from './Choreography';
import useFocusMode from './useFocusMode';

// ── Rich gradient backgrounds ───────────────────────────────────────

const BACKGROUNDS = [
  {
    name: 'Cool Gray',
    css: 'linear-gradient(160deg, #e8e8ec 0%, #d4d4da 50%, #e0e0e6 100%)',
    threeColor: '#dcdce0',
  },
  {
    name: 'Warm Gray',
    css: 'linear-gradient(155deg, #e6e4e0 0%, #d8d4d0 45%, #e2e0dc 100%)',
    threeColor: '#dcd8d4',
  },
  {
    name: 'Neutral',
    css: 'linear-gradient(150deg, #e4e4e4 0%, #d0d0d0 50%, #dedede 100%)',
    threeColor: '#d8d8d8',
  },
  {
    name: 'Fog',
    css: 'linear-gradient(145deg, #eaeaee 0%, #d6d6dc 40%, #e2e2e8 100%)',
    threeColor: '#e0e0e4',
  },
  {
    name: 'Stone',
    css: 'linear-gradient(160deg, #dcdad6 0%, #ccc8c4 45%, #d8d6d2 100%)',
    threeColor: '#d4d0cc',
  },
  {
    name: 'Overcast',
    css: 'linear-gradient(140deg, #e0e2e6 0%, #d2d4da 50%, #dcdee4 100%)',
    threeColor: '#d8dade',
  },
];

// ── Single terminal view ─────────────────────────────────────────────

function SingleScene({ bgIndex, chrome, reveal, trigger }) {
  const bg = BACKGROUNDS[bgIndex];
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

// ── Band view — multiple terminals ───────────────────────────────────

function BandScene({ bgIndex, chrome, reveal, trigger }) {
  const bg = BACKGROUNDS[bgIndex];

  return (
    <>
      <color attach="background" args={[bg.threeColor]} />

      <TerminalBand
        revealTrigger={trigger}
        revealColor={reveal.color}
        revealHotColor={reveal.hotColor}
        revealDuration={reveal.duration}
        revealLineCount={reveal.lineCount}
        revealGlowIntensity={reveal.glowIntensity}
        distortion={chrome.distortion}
        glow={chrome.glow}
        baseColorA={chrome.baseColorA}
        baseColorB={chrome.baseColorB}
        accentColor={chrome.accentColor}
        dotColor={chrome.dotColor}
      />

      <OrbitControls makeDefault />
    </>
  );
}

// ── Choreography view — living breathing terminals ───────────────────

function ChoreographyScene({ bgIndex, chrome, reveal }) {
  const bg = BACKGROUNDS[bgIndex];
  const { focusedSlot, setFocus, clearFocus } = useFocusMode();

  return (
    <>
      <color attach="background" args={[bg.threeColor]} />

      <Choreography
        onSlotClick={(slot) => focusedSlot ? clearFocus() : setFocus(slot)}
        distortion={chrome.distortion}
        glow={chrome.glow}
        baseColorA={chrome.baseColorA}
        baseColorB={chrome.baseColorB}
        accentColor={chrome.accentColor}
        dotColor={chrome.dotColor}
        revealColor={reveal.color}
        revealHotColor={reveal.hotColor}
        revealGlowIntensity={reveal.glowIntensity}
      />

      {/* OrbitControls disabled during focus to prevent conflicts */}
      {!focusedSlot && <OrbitControls makeDefault />}
    </>
  );
}

// ── App ──────────────────────────────────────────────────────────────

const VIEW_MODES = ['choreo', 'band', 'single'];

function App() {
  const [bgIndex, setBgIndex] = useState(0);
  const [viewIndex, setViewIndex] = useState(0);
  const [trigger, setTrigger] = useState(0);
  const bg = BACKGROUNDS[bgIndex];
  const viewMode = VIEW_MODES[viewIndex];

  const cycleBg = () => setBgIndex((i) => (i + 1) % BACKGROUNDS.length);
  const cycleView = () => setViewIndex((i) => (i + 1) % VIEW_MODES.length);

  useControls('Background', {
    [`Current: ${bg.name}`]: button(cycleBg),
  });

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
    [`View: ${viewMode.toUpperCase()}`]: button(cycleView),
  });

  const cameraConfig = viewMode === 'single'
    ? { position: [0, 0, 5], fov: 45 }
    : { position: [0, 0, 12], fov: 50 };

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
        key={viewMode}
        camera={cameraConfig}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {viewMode === 'single' ? (
          <SingleScene bgIndex={bgIndex} chrome={chrome} reveal={reveal} trigger={trigger} />
        ) : viewMode === 'band' ? (
          <BandScene bgIndex={bgIndex} chrome={chrome} reveal={reveal} trigger={trigger} />
        ) : (
          <ChoreographyScene bgIndex={bgIndex} chrome={chrome} reveal={reveal} />
        )}
      </Canvas>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
