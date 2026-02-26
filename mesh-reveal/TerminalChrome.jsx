/**
 * TerminalChrome — the terminal frame/bezel with content area.
 *
 * Westworld + Blade Runner aesthetic:
 *  - Dark body, subtle warm glow at edges
 *  - Deep green glass bezel frame
 *  - ○○○ window dots top-right
 *  - Alive, slightly ominous, elegant
 *
 * Dependencies (peer): react, three, @react-three/fiber
 * No local imports.
 */

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// ── Shaders ─────────────────────────────────────────────────────────

const bezelVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

// Deep green glass bezel — Blade Runner replicant eye green
// Subtle fresnel glow at edges, dark core, alive
const bezelFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uGlassColor;
uniform vec3 uGlowColor;
uniform float uGlowIntensity;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  // Fresnel — edges catch more light
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = 1.0 - abs(dot(viewDir, vNormal));
  fresnel = pow(fresnel, 2.5);

  // Subtle noise shimmer — the glass is alive, barely perceptibly
  float shimmer = noise(vUv * 8.0 + uTime * 0.15) * 0.08;

  // Edge glow — brighter at the outer rim of the bezel
  float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float edgeGlow = smoothstep(0.3, 0.0, edgeDist) * 0.3;

  // Inner edge — where bezel meets the terminal body, subtle warm line
  float innerEdge = smoothstep(0.0, 0.05, edgeDist) * smoothstep(0.15, 0.05, edgeDist);

  // Combine
  vec3 baseColor = uGlassColor * (0.3 + shimmer);
  vec3 fresnelColor = uGlowColor * fresnel * uGlowIntensity;
  vec3 edgeColor = uGlowColor * edgeGlow;
  vec3 innerColor = vec3(0.9, 0.75, 0.4) * innerEdge * 0.15; // warm gold inner seam

  vec3 col = baseColor + fresnelColor + edgeColor + innerColor;
  float alpha = uOpacity + fresnel * 0.2 + edgeGlow * 0.3;

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

// Terminal body — dark, deep, the void you look into
const bodyFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uBodyColor;
uniform float uOpacity;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  // Very subtle scan noise — CRT static, almost imperceptible
  float scanline = sin(vUv.y * 400.0 + uTime * 2.0) * 0.005;
  float grain = (hash(vUv * 500.0 + uTime) - 0.5) * 0.015;

  // Slight vignette — darker at edges
  vec2 center = vUv - 0.5;
  float vignette = 1.0 - dot(center, center) * 0.3;

  vec3 col = uBodyColor * vignette + scanline + grain;
  gl_FragColor = vec4(col, uOpacity);
}
`;

// Window control dots shader
const dotFragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;

varying vec2 vUv;

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);

  // Circle
  float circle = smoothstep(0.5, 0.45, dist);

  // Subtle pulse
  float pulse = 0.85 + 0.15 * sin(uTime * 1.5);

  // Inner highlight — glass refraction feel
  float highlight = smoothstep(0.3, 0.1, length(center - vec2(-0.1, 0.1)));

  vec3 col = uColor * pulse + vec3(1.0) * highlight * 0.15;
  float alpha = circle * 0.8;

  gl_FragColor = vec4(col, alpha);
}
`;

// ── Dot component ───────────────────────────────────────────────────

function WindowDot({ position, color, timeUniform }) {
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uTime: timeUniform,
  }), []);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: bezelVertexShader,
    fragmentShader: dotFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [uniforms]);

  return (
    <mesh position={position} material={mat}>
      <planeGeometry args={[0.06, 0.06]} />
    </mesh>
  );
}

// Status rail fragment — the bottom bar background
const railFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uRailColor;
uniform vec3 uAccentColor;
uniform float uOpacity;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  // Subtle horizontal gradient — slightly lighter on the left (name side)
  float grad = mix(1.0, 0.85, vUv.x);

  // Faint divider lines
  float divider1 = smoothstep(0.002, 0.0, abs(vUv.x - 0.35));
  float divider2 = smoothstep(0.002, 0.0, abs(vUv.x - 0.7));
  float dividers = (divider1 + divider2) * 0.15;

  // Very subtle scan shimmer
  float scan = sin(vUv.x * 200.0 + uTime * 0.5) * 0.01;

  vec3 col = uRailColor * grad + uAccentColor * dividers + scan;
  gl_FragColor = vec4(col, uOpacity);
}
`;

// ── Status Rail component ───────────────────────────────────────────
// Glass background strip is canvas. Text is HTML overlay — selectable,
// indexable, real DOM.

function StatusRail({
  width,
  height = 0.14,
  position,
  name = 'STARE',
  status = 'ACTIVE',
  link = 'stare.network',
  railColor = '#0d1a14',
  accentColor = '#1a6b3a',
  textColor = '#4a8a5a',
  timeUniform,
}) {
  const railUniforms = useMemo(() => ({
    uTime: timeUniform,
    uRailColor: { value: new THREE.Color(railColor) },
    uAccentColor: { value: new THREE.Color(accentColor) },
    uOpacity: { value: 0.95 },
  }), []);

  const railMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: bezelVertexShader,
    fragmentShader: railFragmentShader,
    uniforms: railUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [railUniforms]);

  useFrame(() => {
    railUniforms.uRailColor.value.set(railColor);
    railUniforms.uAccentColor.value.set(accentColor);
  });

  return (
    <group position={position}>
      {/* Glass rail background — canvas */}
      <mesh material={railMat}>
        <planeGeometry args={[width, height]} />
      </mesh>

      {/* HTML text overlay — selectable, indexable */}
      <Html
        center
        position={[0, 0, 0.003]}
        style={{
          width: `${width * 100}px`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 8px',
          fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
          fontSize: '10px',
          letterSpacing: '0.08em',
          color: textColor,
          pointerEvents: 'auto',
          userSelect: 'text',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontWeight: 600 }}>{name}</span>
        <span style={{ opacity: 0.7 }}>● {status}</span>
        {link && (
          <a
            href={`https://${link}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: textColor,
              textDecoration: 'none',
              opacity: 0.6,
            }}
          >
            {link}
          </a>
        )}
      </Html>
    </group>
  );
}

// ── Main component ──────────────────────────────────────────────────

export default function TerminalChrome({
  width = 4,
  height = 2.5,
  bezelWidth = 0.06,
  railHeight = 0.14,
  glassColor = '#0a2a1a',    // deep dark green
  glowColor = '#1a6b3a',     // green glow
  bodyColor = '#0a0a0f',     // near-black body
  glowIntensity = 0.6,
  opacity = 0.92,
  showDots = true,
  showRail = true,
  name = 'STARE',
  status = 'ACTIVE',
  link = 'stare.network',
  children,
  ...groupProps
}) {
  const timeRef = useRef({ value: 0 });

  // Shared time uniform
  const timeUniform = useMemo(() => ({ value: 0 }), []);

  // Body geometry (the dark terminal surface)
  const bodyGeo = useMemo(
    () => new THREE.PlaneGeometry(width, height, 1, 1),
    [width, height]
  );

  // Bezel pieces — 4 strips around the body
  const bezelGeos = useMemo(() => {
    const bw = bezelWidth;
    const w = width;
    const h = height;
    return {
      top:    { geo: new THREE.PlaneGeometry(w + bw * 2, bw), pos: [0, h / 2 + bw / 2, 0] },
      bottom: { geo: new THREE.PlaneGeometry(w + bw * 2, bw), pos: [0, -h / 2 - bw / 2, 0] },
      left:   { geo: new THREE.PlaneGeometry(bw, h), pos: [-w / 2 - bw / 2, 0, 0] },
      right:  { geo: new THREE.PlaneGeometry(bw, h), pos: [w / 2 + bw / 2, 0, 0] },
    };
  }, [width, height, bezelWidth]);

  // Bezel material
  const bezelUniforms = useMemo(() => ({
    uTime: timeUniform,
    uGlassColor: { value: new THREE.Color(glassColor) },
    uGlowColor: { value: new THREE.Color(glowColor) },
    uGlowIntensity: { value: glowIntensity },
    uOpacity: { value: opacity },
  }), []);

  const bezelMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: bezelVertexShader,
    fragmentShader: bezelFragmentShader,
    uniforms: bezelUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [bezelUniforms]);

  // Body material
  const bodyUniforms = useMemo(() => ({
    uTime: timeUniform,
    uBodyColor: { value: new THREE.Color(bodyColor) },
    uOpacity: { value: opacity },
  }), []);

  const bodyMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: bezelVertexShader,
    fragmentShader: bodyFragmentShader,
    uniforms: bodyUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [bodyUniforms]);

  // Dot positions — top-right, spaced evenly
  const dotPositions = useMemo(() => {
    const y = height / 2 - 0.08;
    const xStart = width / 2 - 0.12;
    return [
      [xStart - 0.16, y, 0.002],
      [xStart - 0.08, y, 0.002],
      [xStart, y, 0.002],
    ];
  }, [width, height]);

  const dotColors = ['#3a3a3a', '#3a3a3a', '#3a3a3a']; // muted, not macOS candy

  useFrame(({ clock }) => {
    timeUniform.value = clock.elapsedTime;

    bezelUniforms.uGlassColor.value.set(glassColor);
    bezelUniforms.uGlowColor.value.set(glowColor);
    bezelUniforms.uGlowIntensity.value = glowIntensity;
    bezelUniforms.uOpacity.value = opacity;

    bodyUniforms.uBodyColor.value.set(bodyColor);
    bodyUniforms.uOpacity.value = opacity;
  });

  return (
    <group {...groupProps}>
      {/* Terminal body */}
      <mesh geometry={bodyGeo} material={bodyMat} />

      {/* Green glass bezel */}
      {Object.values(bezelGeos).map((strip, i) => (
        <mesh
          key={i}
          geometry={strip.geo}
          material={bezelMat}
          position={strip.pos}
        />
      ))}

      {/* Window dots ○○○ top-right */}
      {showDots && dotPositions.map((pos, i) => (
        <WindowDot
          key={i}
          position={pos}
          color={dotColors[i]}
          timeUniform={timeUniform}
        />
      ))}

      {/* Status rail — bottom bar */}
      {showRail && (
        <StatusRail
          width={width}
          height={railHeight}
          position={[0, -height / 2 + railHeight / 2, 0.002]}
          name={name}
          status={status}
          link={link}
          railColor={glassColor}
          accentColor={glowColor}
          textColor={glowColor}
          timeUniform={timeUniform}
        />
      )}

      {/* Children render inside the terminal body area */}
      {children}
    </group>
  );
}
