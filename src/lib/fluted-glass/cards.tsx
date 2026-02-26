import { Html } from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { FlutedGlassPlane } from './FlutedGlassPlane';
import type { FlutedPattern } from './types';

const triggerHaptic = (duration: number) => {
  if (typeof window === 'undefined') return;
  const navigatorWithVibrate = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
  if (typeof navigatorWithVibrate.vibrate === 'function') {
    navigatorWithVibrate.vibrate(duration);
  }
};

export type FlutedCardDefinition = {
  id: string;
  label: string;
  description: string;
  pattern: FlutedPattern;
  accent: string;
  position: [number, number, number];
};

export const FLUTED_CARD_DEFINITIONS: FlutedCardDefinition[] = [
  {
    id: 'modal',
    label: 'Modal Shell',
    description: 'High-contrast callout with lens-focus highlights.',
    pattern: 'lenses',
    accent: '#f0a5ff',
    position: [-2.2, 0.25, 0],
  },
  {
    id: 'button',
    label: 'Button Stack',
    description: 'Micro-button column with bubbly micro refraction.',
    pattern: 'bubbles',
    accent: '#ff7b85',
    position: [-0.8, -0.15, 0],
  },
  {
    id: 'status-bar',
    label: 'Status Bar',
    description: 'Slender rail for realtime data and scoped pulses.',
    pattern: 'fluted horizontal',
    accent: '#a1ddff',
    position: [0.6, 0.5, 0],
  },
  {
    id: 'status-rail',
    label: 'Status Rail',
    description: 'Occluded rail that splits attention with light specs.',
    pattern: 'fluted vertical',
    accent: '#ffa2d9',
    position: [1.85, -0.35, 0],
  },
  {
    id: 'dropdown',
    label: 'Dropdown',
    description: 'Layered avalanches of color with diagonal flutes.',
    pattern: 'fluted diagonal',
    accent: '#d6fffb',
    position: [0.8, -1.0, 0],
  },
  {
    id: 'screensaver',
    label: 'Screensaver',
    description: 'Slow drifting curtain of glass-close noise.',
    pattern: 'lenses',
    accent: '#b0b7ff',
    position: [-1.6, -1.1, 0],
  },
];

export const flutedCardState = proxy({
  activeId: FLUTED_CARD_DEFINITIONS[0].id,
  hoveredId: null as string | null,
  occluders: [] as MutableRefObject<THREE.Object3D | null>[],
});

export const setActiveCard = (id: string) => {
  flutedCardState.activeId = id;
};

export const setHoveredCard = (id: string | null) => {
  flutedCardState.hoveredId = id;
};

export const registerOccluder = (ref: MutableRefObject<THREE.Object3D | null>) => {
  if (!ref?.current) return;
  if (!flutedCardState.occluders.includes(ref)) {
    flutedCardState.occluders = [...flutedCardState.occluders, ref];
  }
};

export const unregisterOccluder = (ref: MutableRefObject<THREE.Object3D | null>) => {
  flutedCardState.occluders = flutedCardState.occluders.filter((item) => item !== ref);
};

export type FlutedCardProps = {
  definition: FlutedCardDefinition;
};

export const FlutedCard = ({ definition }: FlutedCardProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const snap = useSnapshot(flutedCardState);
  const isActive = snap.activeId === definition.id;
  const isHovered = snap.hoveredId === definition.id;

    const occludeTargets = useMemo(() => snap.occluders.filter((ref) => ref.current), [snap.occluders]);

  return (
    <group
      position={definition.position}
      onPointerOver={() => {
        setHoveredCard(definition.id);
        triggerHaptic(8);
      }}
      onPointerOut={() => setHoveredCard(null)}
      onClick={() => {
        setActiveCard(definition.id);
        triggerHaptic(20);
      }}
    >
      <FlutedGlassPlane
        ref={meshRef}
        pattern={definition.pattern}
        distortion={0.9}
        fill={0.88}
        lightPosition={[1, 0.3, 0.8]}
        baseColorA="#03040a"
        baseColorB="#272d42"
        accentColor={definition.accent}
        opacity={isActive ? 1 : 0.78}
      />
      <Html
        sprite
        as="div"
        center
        transform
        occlude={occludeTargets}
        distanceFactor={0.8}
        className={`fluted-card-html ${isActive ? 'is-active' : ''} ${isHovered ? 'is-hovered' : ''}`}
        wrapperClass="fluted-card-wrapper"
        pointerEvents="none"
      >
        <div>
          <strong>{definition.label}</strong>
          <p>{definition.description}</p>
        </div>
      </Html>
    </group>
  );
};

export const FlutedCardOccluder = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    const geometry = mesh?.geometry;
    if (geometry) {
      try {
        if (geometry.boundingSphere === null) {
          Object.defineProperty(geometry, 'boundingSphere', {
            value: new THREE.Sphere(),
            writable: true,
            configurable: true,
            enumerable: true
          });
        }
      } catch (error) {
        if (geometry.boundingSphere === null) {
          geometry.boundingSphere = new THREE.Sphere();
        }
      }
      const center = mesh?.position ?? new THREE.Vector3();
      const radiusSource = mesh?.scale ?? new THREE.Vector3(1, 1, 1);
      const radius = Math.max(1.5, radiusSource.length());
      geometry.boundingSphere.set(center, radius);
    }
    registerOccluder(meshRef);
    return () => {
      unregisterOccluder(meshRef);
    };
  }, []);

  return (
    <mesh ref={meshRef} position={[0, -0.2, 0.8]}>
      <boxGeometry args={[4.5, 0.25, 0.03]} />
      <meshStandardMaterial color="#03030a" transparent opacity={0.6} />
    </mesh>
  );
};
