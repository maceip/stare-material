/**
 * ScanlineReveal — terminal reveal using vertical blinds/scanlines
 * with a hot golden solar-flare edge.
 *
 * Dependencies (peer): react, three, @react-three/fiber, gsap
 * No local imports — everything is inlined.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// ── Shaders ─────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

// Scanlines + solar flare + sparkles — all in one pass
const scanlineFragmentShader = /* glsl */ `
uniform float uProgress;
uniform float uTime;
uniform float uLineWidth;
uniform float uLineCount;
uniform float uAlphaFar;
uniform float uGlowIntensity;
uniform vec3 uColor;
uniform vec3 uHotColor;

varying vec2 vUv;

// ── noise helpers ──

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  // Sweep position (0→1 across UV x)
  float sweepEdge = uProgress * (1.0 + uAlphaFar * 2.0) - uAlphaFar;
  float dist = vUv.x - sweepEdge;

  // ── Scanline pattern ──
  // Each line has unique phase offset based on its index for variation
  float lineIndex = floor(vUv.x * uLineCount);
  float linePhase = hash(vec2(lineIndex, 0.0));
  float line = abs(fract(vUv.x * uLineCount) - 0.5) * 2.0;
  float lineMask = 1.0 - smoothstep(uLineWidth - 0.08, uLineWidth, line);

  // Brightness variation per line — some lines are dimmer, some brighter
  float lineBrightness = 0.4 + 0.6 * (0.5 + 0.5 * sin(linePhase * 6.28 + uTime * 2.0));

  // Lines appear ahead of sweep as scouts
  float aheadZone = smoothstep(0.35, 0.0, dist) * smoothstep(-uAlphaFar, -uAlphaFar + 0.03, dist);

  // Behind sweep: lines fade (solid takes over)
  float behindFade = smoothstep(-0.03, -0.12, dist);

  float lineAlpha = lineMask * lineBrightness * aheadZone * (1.0 - behindFade);

  // ── Solar flare / corona at the sweep edge ──
  // Wide golden bloom that overwhelms the line pattern
  float flareWidth = 0.08;
  float flare = exp(-dist * dist / (flareWidth * flareWidth));

  // Noise-distorted flare — the corona isn't clean, it's turbulent
  float flareNoise = fbm(vec2(vUv.y * 12.0 + uTime * 0.5, uTime * 0.3)) * 0.6;
  float flareTurbulent = exp(-(dist + flareNoise * 0.03) * (dist + flareNoise * 0.03) / (flareWidth * flareWidth));

  // Hot white core (narrower, brighter)
  float coreWidth = 0.02;
  float hotCore = exp(-dist * dist / (coreWidth * coreWidth));

  // ── Sparkles ──
  // Noise-based sparkle field that only appears near the sweep edge
  float sparkleField = noise(vec2(vUv.x * 200.0 + uTime * 8.0, vUv.y * 80.0 + uTime * 3.0));
  float sparkle = pow(sparkleField, 12.0) * 3.0; // sharp peaks
  float sparkleZone = exp(-dist * dist / (0.04 * 0.04)); // only near edge
  sparkle *= sparkleZone;

  // Vertical streaks — elongated sparkles that feel like light bleeding through lines
  float streak = noise(vec2(lineIndex * 1.7 + uTime * 1.5, vUv.y * 3.0 + uTime * 0.8));
  streak = pow(streak, 6.0) * 2.0;
  float streakZone = exp(-dist * dist / (0.06 * 0.06));
  streak *= streakZone * lineMask;

  // ── Combine ──

  // Color gradient: gold lines → hot white/gold at core → gold corona
  vec3 lineCol = uColor * lineBrightness;
  vec3 flareCol = mix(uColor, uHotColor, 0.6) * uGlowIntensity;
  vec3 coreCol = uHotColor * (uGlowIntensity * 1.5);
  vec3 sparkleCol = mix(uHotColor, vec3(1.0), 0.3);

  vec3 col = lineCol * lineAlpha
           + flareCol * flareTurbulent * 1.2
           + coreCol * hotCore * 2.0
           + sparkleCol * sparkle
           + uColor * streak;

  float alpha = clamp(lineAlpha + flareTurbulent * 0.9 + hotCore + sparkle + streak * 0.5, 0.0, 1.0);

  // Additive blending feel — let it get > 1 for bloom
  gl_FragColor = vec4(col, alpha);
}
`;

// Solid fill behind the scanlines
const solidFragmentShader = /* glsl */ `
uniform float uProgress;
uniform float uAlphaFar;
uniform vec3 uColor;
uniform vec3 uHotColor;
uniform vec3 uBgColor;

varying vec2 vUv;

void main() {
  float sweepEdge = uProgress * (1.0 + uAlphaFar * 2.0) - uAlphaFar;
  float dist = vUv.x - sweepEdge;

  // Solid fill behind sweep
  float fill = smoothstep(0.02, -0.06, dist);

  // Hot leading edge on the solid surface
  float edgeBand = smoothstep(0.02, -0.005, dist) * smoothstep(-0.06, -0.015, dist);
  // Wider warm glow behind the hot edge
  float warmGlow = smoothstep(0.04, -0.01, dist) * smoothstep(-0.15, -0.04, dist);

  // After the sweep passes, fade the solid fill to let the glass surface show through
  // The further behind the sweep edge, the more transparent we become
  float fadeOut = smoothstep(-0.3, -0.8, dist); // starts fading well behind sweep

  vec3 col = uBgColor;
  col = mix(col, uColor * 0.3, warmGlow);
  col = mix(col, mix(uColor, uHotColor, 0.5), edgeBand * 0.7);

  // Full opacity at the edge, fading to near-transparent behind
  float alpha = fill * mix(0.92, 0.08, fadeOut);

  gl_FragColor = vec4(col, alpha);
}
`;

// ── Component ───────────────────────────────────────────────────────

export default function ScanlineReveal({
  width = 4,
  height = 2.5,
  color = '#FFBE18',
  hotColor = '#ffffff',
  bgColor = '#0f0f1a',
  duration = 2.5,
  lineCount = 80,
  lineWidth = 0.35,
  alphaFar = 0.25,
  glowIntensity = 2.0,
  trigger = 0,
  reverse = false,
  ...groupProps
}) {
  const tweenRef = useRef({ p: 0 });

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(width, height, 1, 1),
    [width, height]
  );

  const scanUniforms = useMemo(() => ({
    uProgress:      { value: 0 },
    uTime:          { value: 0 },
    uLineWidth:     { value: lineWidth },
    uLineCount:     { value: lineCount },
    uAlphaFar:      { value: alphaFar },
    uGlowIntensity: { value: glowIntensity },
    uColor:         { value: new THREE.Color(color) },
    uHotColor:      { value: new THREE.Color(hotColor) },
  }), []);

  const solidUniforms = useMemo(() => ({
    uProgress: { value: 0 },
    uAlphaFar: { value: alphaFar },
    uColor:    { value: new THREE.Color(color) },
    uHotColor: { value: new THREE.Color(hotColor) },
    uBgColor:  { value: new THREE.Color(bgColor) },
  }), []);

  const scanMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: scanlineFragmentShader,
    uniforms: scanUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [scanUniforms]);

  const solidMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: solidFragmentShader,
    uniforms: solidUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [solidUniforms]);

  useEffect(() => {
    const startVal = reverse ? 1 : 0;
    const endVal = reverse ? 0 : 1;

    tweenRef.current.p = startVal;
    scanUniforms.uProgress.value = startVal;
    solidUniforms.uProgress.value = startVal;

    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(tweenRef.current, {
      p: endVal,
      duration,
      ease: 'power2.inOut',
    });
    return () => tl.kill();
  }, [trigger, duration, reverse, scanUniforms, solidUniforms]);

  useFrame(({ clock }) => {
    const p = tweenRef.current.p;
    scanUniforms.uProgress.value = p;
    scanUniforms.uTime.value = clock.elapsedTime;
    scanUniforms.uLineWidth.value = lineWidth;
    scanUniforms.uLineCount.value = lineCount;
    scanUniforms.uAlphaFar.value = alphaFar;
    scanUniforms.uGlowIntensity.value = glowIntensity;
    scanUniforms.uColor.value.set(color);
    scanUniforms.uHotColor.value.set(hotColor);

    solidUniforms.uProgress.value = p;
    solidUniforms.uAlphaFar.value = alphaFar;
    solidUniforms.uColor.value.set(color);
    solidUniforms.uHotColor.value.set(hotColor);
    solidUniforms.uBgColor.value.set(bgColor);
  });

  return (
    <group {...groupProps}>
      <mesh geometry={geometry} material={solidMat} />
      <mesh geometry={geometry} material={scanMat} position={[0, 0, 0.001]} />
    </group>
  );
}
