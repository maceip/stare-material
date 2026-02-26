import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSnapshot } from 'valtio';
import {
  FLUTED_CARD_DEFINITIONS,
  FLUTED_PATTERN_OPTIONS,
  FlutedCard,
  FlutedCardOccluder,
  FlutedGlassPlane,
  flutedCardState,
  type FlutedPattern,
} from './lib/fluted-glass';
import './App.css';

type PatternTileProps = {
  pattern: FlutedPattern;
  accent: string;
};

const PatternTile = ({ pattern, accent }: PatternTileProps) => (
  <div className="tile">
    <Canvas className="tile-canvas" dpr={[1, 2]} camera={{ position: [0, 0, 2.4], fov: 48 }}>
      <FlutedGlassPlane
        pattern={pattern}
        distortion={0.92}
        fill={0.85}
        lightPosition={[1, 0.2, 1]}
        baseColorA="#03040a"
        baseColorB="#1c2441"
        accentColor={accent}
        splitActive={0}
      />
    </Canvas>
    <div className="tile-label">{pattern}</div>
  </div>
);

type SplitStyleTileProps = {
  label: string;
  splitStyle: number;
  accent: string;
};

const SplitStyleTile = ({ label, splitStyle, accent }: SplitStyleTileProps) => (
  <div className="tile">
    <Canvas className="tile-canvas" dpr={[1, 2]} camera={{ position: [0, 0, 2.4], fov: 48 }}>
      <FlutedGlassPlane
        pattern="fluted vertical"
        distortion={0.95}
        fill={0.78}
        lightPosition={[1.2, 0.2, 1]}
        baseColorA="#03040a"
        baseColorB="#1c2441"
        accentColor={accent}
        splitActive={1}
        splitPosition={0.52}
        splitAxis={0}
        splitRipple={0.9}
        splitWidth={0.05}
        splitStyle={splitStyle}
      />
    </Canvas>
    <div className="tile-label">{label}</div>
  </div>
);

const CardStatusPanel = () => {
  const snap = useSnapshot(flutedCardState);
  const active = FLUTED_CARD_DEFINITIONS.find((card) => card.id === snap.activeId);
  const hovered = FLUTED_CARD_DEFINITIONS.find((card) => card.id === snap.hoveredId);

  return (
    <div className="card-status-panel">
      <p>
        <span>Active</span>
        <strong>{active?.label ?? '—'}</strong>
      </p>
      <p>
        <span>Hover</span>
        <strong>{hovered?.label ?? '—'}</strong>
      </p>
      <p>
        <span>Occluders</span>
        <strong>{snap.occluders.length}</strong>
      </p>
      <p>
        <span>Notes</span>
        <strong>Html overlays respect occlusion and the valtio tracker.</strong>
      </p>
    </div>
  );
};

const triggerHaptic = (pattern: number | number[]) => {
  if (typeof window === 'undefined') return false;
  const navigatorWithVibrate = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
  if (typeof navigatorWithVibrate.vibrate === 'function') {
    return navigatorWithVibrate.vibrate(pattern);
  }
  return false;
};

function App() {
  const [pattern, setPattern] = useState<FlutedPattern>('lenses');
  const [distortion, setDistortion] = useState(0.95);
  const [fill, setFill] = useState(0.62);
  const [glow, setGlow] = useState(1);
  const [lightX, setLightX] = useState(1.1);
  const [lightY, setLightY] = useState(0.15);
  const [lightZ, setLightZ] = useState(0.8);
  const [splitActive, setSplitActive] = useState(0.5);
  const [splitPosition, setSplitPosition] = useState(0.5);
  const [splitAxis, setSplitAxis] = useState(0);
  const [splitStyle, setSplitStyle] = useState(1);
  const [splitGap, setSplitGap] = useState(1);

  const lightPosition = useMemo(
    () => [lightX, lightY, lightZ] as [number, number, number],
    [lightX, lightY, lightZ]
  );

  return (
    <div className="app">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Recovered Dark Mode</p>
          <h1>Fluted Glass Studies</h1>
          <p className="lede">
            This shader now adds a viscous split line between terminals—think Liquid Glass merging and the Red Sea split. Toggle
            the axis and watch molasses ripples stretch across the shared edge while the material stays grounded in our palette.
          </p>
          <div className="control-panel">
            <label>
              Pattern
              <select value={pattern} onChange={(event) => setPattern(event.target.value as FlutedPattern)}>
                {FLUTED_PATTERN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Distortion
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.01}
                value={distortion}
                onChange={(event) => setDistortion(Number(event.target.value))}
              />
            </label>
            <label>
              Fill
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={fill}
                onChange={(event) => setFill(Number(event.target.value))}
              />
            </label>
            <label>
              Glow
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={glow}
                onChange={(event) => setGlow(Number(event.target.value))}
              />
            </label>
            <div className="light-grid">
              <label>
                Light X
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.05}
                  value={lightX}
                  onChange={(event) => setLightX(Number(event.target.value))}
                />
              </label>
              <label>
                Light Y
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.05}
                  value={lightY}
                  onChange={(event) => setLightY(Number(event.target.value))}
                />
              </label>
              <label>
                Light Z
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.05}
                  value={lightZ}
                  onChange={(event) => setLightZ(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="split-controls">
              <label>
                Split Active
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={splitActive}
                  onChange={(event) => setSplitActive(Number(event.target.value))}
                />
              </label>
              <label>
                Split Position
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={splitPosition}
                  onChange={(event) => setSplitPosition(Number(event.target.value))}
                />
              </label>
              <label>
                Split Axis
                <select value={splitAxis} onChange={(event) => setSplitAxis(Number(event.target.value))}>
                  <option value={0}>Vertical</option>
                  <option value={1}>Horizontal</option>
                </select>
              </label>
              <label>
                Split Style
                <select value={splitStyle} onChange={(event) => setSplitStyle(Number(event.target.value))}>
                  <option value={1}>Liquid</option>
                  <option value={2}>Neon</option>
                  <option value={0}>Classic</option>
                </select>
              </label>
              <label>
                Split Gap
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={splitGap}
                  onChange={(event) => setSplitGap(Number(event.target.value))}
                />
              </label>
            </div>
            <button
              className="haptics-button"
              type="button"
              onClick={() => triggerHaptic([12, 16, 12])}
            >
              Test Haptics
            </button>
          </div>
        </div>
        <div className="hero-canvas-wrap">
          <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 2.8], fov: 50 }}>
            <ambientLight intensity={0.7} />
            <pointLight color="#ff6d94" intensity={1.7} position={[4, 4, 4]} />
            <FlutedGlassPlane
              pattern={pattern}
              distortion={distortion}
              fill={fill}
              lightPosition={lightPosition}
              baseColorA="#05070d"
              baseColorB="#1d1d30"
              accentColor="#ffb5c9"
              opacity={1}
              glow={glow}
              splitActive={splitActive}
              splitPosition={splitPosition}
              splitAxis={splitAxis}
              splitWidth={0.05}
              splitRipple={0.8}
              splitStyle={splitStyle}
              splitGap={splitGap}
            />
          </Canvas>
          <div className="hero-speckle" aria-hidden="true" />
        </div>
      </div>

      <section className="gallery">
        <div className="section-title">
          <h2>Split Style Demos</h2>
          <p>Two edge treatments to compare: liquid merge and neon split.</p>
        </div>
        <div className="tiles">
          <SplitStyleTile label="Liquid Merge" splitStyle={1} accent="#ffb5c9" />
          <SplitStyleTile label="Neon Split" splitStyle={2} accent="#9fd2ff" />
        </div>
      </section>

      <section className="card-console">
        <div className="section-title">
          <h2>Cards, Rails & Occlusion</h2>
          <p>
            Each card is wired to the <code>valtio</code> tracker. Drei's <code>Html</code> overlays
            react to canvas occluders.
          </p>
        </div>
        <div className="card-console-layout">
          <div className="card-console-canvas">
            <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <directionalLight intensity={0.8} position={[5, 5, 2]} />
              <FlutedCardOccluder />
              {FLUTED_CARD_DEFINITIONS.map((definition) => (
                <FlutedCard key={definition.id} definition={definition} />
              ))}
            </Canvas>
          </div>
          <CardStatusPanel />
        </div>
      </section>

      <section className="gallery">
        <div className="section-title">
          <h2>Pattern Vault</h2>
          <p>Five reconstructed motifs distilled from the shader bundle.</p>
        </div>
        <div className="tiles">
          <PatternTile pattern="fluted vertical" accent="#cde6ff" />
          <PatternTile pattern="fluted horizontal" accent="#b8f1ff" />
          <PatternTile pattern="fluted diagonal" accent="#ffd9b8" />
          <PatternTile pattern="bubbles" accent="#c2f0d9" />
          <PatternTile pattern="lenses" accent="#fbd3e9" />
        </div>
      </section>
    </div>
  );
}

export default App;
