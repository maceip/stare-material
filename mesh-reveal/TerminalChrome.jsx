/**
 * TerminalChrome v2 — one continuous sheet of dark glass.
 *
 * No bezel strips. No CRT grain. The whole terminal IS the glass.
 * Edge glow is where the glass catches light (iPhone rim, not picture frame).
 * Dots glow. Status text floats on the surface. Alive.
 *
 * Uses the fluted glass library (lenses pattern) for the surface material.
 */

import { useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { createFlutedGlassMaterial } from '../src/lib/fluted-glass/FlutedGlassMaterial.ts';
import { patternToIndex } from '../src/lib/fluted-glass/types.ts';

// ── Dot shader — glowing, alive ─────────────────────────────────────

const dotVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

const dotFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);

  // Soft glowing circle
  float circle = smoothstep(0.5, 0.3, dist);
  float glow = exp(-dist * dist * 8.0) * 0.6;

  // Slow pulse — breathing
  float pulse = 0.7 + 0.3 * sin(uTime * 1.2);

  vec3 col = uColor * pulse * (circle + glow);
  float alpha = (circle * 0.9 + glow * 0.5) * pulse;

  gl_FragColor = vec4(col, alpha);
}
`;

// ── Dot component ───────────────────────────────────────────────────

function WindowDot({ position, color, timeUniform }) {
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uTime: timeUniform,
  }), []);

  useFrame(() => {
    uniforms.uColor.value.set(color);
  });

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: dotVertex,
    fragmentShader: dotFragment,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [uniforms]);

  return (
    <mesh position={position} material={mat}>
      <planeGeometry args={[0.07, 0.07]} />
    </mesh>
  );
}

// ── Main component ──────────────────────────────────────────────────

export default function TerminalChrome({
  width = 4,
  height = 2.5,
  // Glass surface config — passed to fluted glass material
  pattern = 'lenses',
  distortion = 0.6,
  fill = 1.0,
  baseColorA = '#050808',    // near-black with hint of green
  baseColorB = '#0a1a12',    // dark green-black
  accentColor = '#1a6b3a',   // green accent for edge catch
  glow = 0.5,
  opacity = 0.95,
  lightPosition = [0.8, 0.4, 1.0],
  // Dots
  showDots = true,
  dotColor = '#1a6b3a',      // dim green, glowing
  // Status rail (HTML, floats on surface)
  showRail = true,
  name = 'STARE',
  status = 'ACTIVE',
  link = 'stare.network',
  railTextColor = '#2a7a4a',
  // Content
  children,
  ...groupProps
}) {
  const { size } = useThree();
  const timeUniform = useMemo(() => ({ value: 0 }), []);

  // One continuous glass surface
  const material = useMemo(() => {
    return createFlutedGlassMaterial({
      pattern: patternToIndex(pattern),
      distortion,
      fill,
      opacity,
      lightPosition: new THREE.Vector3(...lightPosition),
      baseColorA,
      baseColorB,
      accentColor,
      glow,
    });
  }, []);

  // Update uniforms reactively
  useEffect(() => {
    material.uniforms.uDistortion.value = distortion;
    material.uniforms.uFill.value = fill;
    material.uniforms.uPattern.value = patternToIndex(pattern);
    material.uniforms.uOpacity.value = opacity;
    material.uniforms.uLightPosition.value.set(...lightPosition);
    material.uniforms.uGlow.value = glow;
    if (baseColorA) material.uniforms.uBaseColorA.value.set(baseColorA);
    if (baseColorB) material.uniforms.uBaseColorB.value.set(baseColorB);
    if (accentColor) material.uniforms.uAccentColor.value.set(accentColor);
  }, [material, distortion, fill, pattern, opacity, lightPosition, glow, baseColorA, baseColorB, accentColor]);

  // Resolution + time
  useEffect(() => {
    material.uniforms.uResolution.value.set(size.width, size.height);
  }, [material, size.width, size.height]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    timeUniform.value = clock.getElapsedTime();
  });

  // Dot positions — top-right
  const dotPositions = useMemo(() => {
    const y = height / 2 - 0.1;
    const xStart = width / 2 - 0.14;
    return [
      [xStart - 0.18, y, 0.003],
      [xStart - 0.09, y, 0.003],
      [xStart, y, 0.003],
    ];
  }, [width, height]);

  return (
    <group {...groupProps}>
      {/* The entire terminal — one sheet of glass */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Glowing dots ○○○ top-right */}
      {showDots && dotPositions.map((pos, i) => (
        <WindowDot
          key={i}
          position={pos}
          color={dotColor}
          timeUniform={timeUniform}
        />
      ))}

      {/* Status text — HTML floating on the glass surface */}
      {showRail && (
        <Html
          center
          position={[0, -height / 2 + 0.1, 0.003]}
          style={{
            width: `${width * 100}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 12px',
            fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: railTextColor,
            pointerEvents: 'auto',
            userSelect: 'text',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontWeight: 600 }}>{name}</span>
          <span style={{ opacity: 0.6 }}>● {status}</span>
          {link && (
            <a
              href={`https://${link}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: railTextColor, textDecoration: 'none', opacity: 0.5 }}
            >
              {link}
            </a>
          )}
        </Html>
      )}

      {/* Children render on top of the glass */}
      {children}
    </group>
  );
}
