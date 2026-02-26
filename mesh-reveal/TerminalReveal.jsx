/**
 * TerminalReveal — self-contained mesh reveal for a terminal rectangle.
 *
 * Dependencies (peer): react, three, @react-three/fiber, gsap
 * No local imports — everything is inlined.
 *
 * Usage:
 *   import TerminalReveal from './TerminalReveal';
 *   // inside an R3F <Canvas>:
 *   <TerminalReveal trigger={n} />
 *   // increment `trigger` to replay the animation
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// ── Shaders (inlined) ───────────────────────────────────────────────

const vertexShader = /* glsl */ `
varying vec4 vWorldPosition;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = modelPosition;
  gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
`;

const wireframeFragmentShader = /* glsl */ `
uniform float uProgress;
uniform float uAlphaNear;
uniform float uAlphaFar;
uniform vec3 uColor;
uniform vec3 uBoundingMin;
uniform vec3 uBoundingMax;

varying vec4 vWorldPosition;

void main() {
  float range = abs(uBoundingMax.x - uBoundingMin.x) + (uAlphaFar * 2.0);
  float centerPos = uBoundingMin.x + (range * uProgress) - uAlphaFar;
  float depth = distance(centerPos, vWorldPosition.x);
  float alpha = max(0.0, 1.0 - smoothstep(uAlphaNear, uAlphaFar, depth));

  gl_FragColor = vec4(uColor, alpha);
}
`;

const solidFragmentShader = /* glsl */ `
uniform float uProgress;
uniform float uAlphaNear;
uniform float uAlphaFar;
uniform vec3 uColor;
uniform vec3 uBoundingMin;
uniform vec3 uBoundingMax;

varying vec4 vWorldPosition;

void main() {
  float range = abs(uBoundingMax.x - uBoundingMin.x) + (uAlphaFar * 2.0);
  float centerPos = uBoundingMin.x + (range * uProgress) - uAlphaFar;
  float depth = distance(centerPos, vWorldPosition.x);
  float edge = smoothstep(uAlphaNear, uAlphaFar, depth);
  float reveal = max(0.0, 1.0 - edge);

  // Smoked glass — mostly opaque dark with a thin colored leading edge
  vec3 bg = vec3(0.06, 0.06, 0.1);
  float edgeBand = smoothstep(0.85, 1.0, reveal) * (1.0 - smoothstep(0.0, 0.15, reveal));
  vec3 col = mix(bg, uColor, edgeBand * 0.6);

  // Slight transparency so orb light bleeds through
  float alpha = reveal * 0.92;
  gl_FragColor = vec4(col, alpha);
}
`;

// ── Component ───────────────────────────────────────────────────────

export default function TerminalReveal({
  width = 4,
  height = 2.5,
  color = '#FFBE18',
  duration = 2,
  alphaNear = 0,
  alphaFar = 0.8,
  trigger = 0,
  ...groupProps
}) {
  const tweenRef = useRef({ p: 0 });

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(width, height, 40, 25),
    [width, height]
  );

  const uniforms = useMemo(() => ({
    uProgress:    { value: 0 },
    uAlphaNear:   { value: alphaNear },
    uAlphaFar:    { value: alphaFar },
    uColor:       { value: new THREE.Color(color) },
    uBoundingMin: { value: new THREE.Vector3(-width / 2, -height / 2, 0) },
    uBoundingMax: { value: new THREE.Vector3(width / 2, height / 2, 0) },
  }), []);

  const wireMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: wireframeFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    wireframe: true,
    side: THREE.DoubleSide,
  }), [uniforms]);

  const solidMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: solidFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [uniforms]);

  // Animate on trigger change
  useEffect(() => {
    tweenRef.current.p = 0;
    uniforms.uProgress.value = 0;

    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(tweenRef.current, {
      p: 1,
      duration,
      ease: 'power2.inOut',
    });
    return () => tl.kill();
  }, [trigger, duration, uniforms]);

  // Sync tween → uniforms every frame
  useFrame(() => {
    uniforms.uProgress.value = tweenRef.current.p;
    uniforms.uAlphaNear.value = alphaNear;
    uniforms.uAlphaFar.value = alphaFar;
    uniforms.uColor.value.set(color);
    uniforms.uBoundingMin.value.set(-width / 2, -height / 2, 0);
    uniforms.uBoundingMax.value.set(width / 2, height / 2, 0);
  });

  return (
    <group {...groupProps}>
      <mesh geometry={geometry} material={solidMat} />
      <mesh geometry={geometry} material={wireMat} position={[0, 0, 0.001]} />
    </group>
  );
}
