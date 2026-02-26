import * as THREE from 'three';
import { flutedGlassFragment, flutedGlassVertex } from './shader';

export type FlutedGlassUniforms = {
  uTime: { value: number };
  uDistortion: { value: number };
  uLightPosition: { value: THREE.Vector3 };
  uFill: { value: number };
  uPattern: { value: number };
  uResolution: { value: THREE.Vector2 };
  uOpacity: { value: number };
  uBaseColorA: { value: THREE.Color };
  uBaseColorB: { value: THREE.Color };
  uAccentColor: { value: THREE.Color };
  uGlow: { value: number };
  uSplitStyle: { value: number };
  uSplitGap: { value: number };
  uSplitActive: { value: number };
  uSplitPosition: { value: number };
  uSplitWidth: { value: number };
  uSplitAxis: { value: number };
  uSplitRipple: { value: number };
};

export type FlutedGlassMaterialOptions = {
  distortion?: number;
  lightPosition?: THREE.Vector3;
  fill?: number;
  pattern?: number;
  opacity?: number;
  baseColorA?: THREE.ColorRepresentation;
  baseColorB?: THREE.ColorRepresentation;
  accentColor?: THREE.ColorRepresentation;
  glow?: number;
  splitStyle?: number;
  splitGap?: number;
  splitActive?: number;
  splitPosition?: number;
  splitWidth?: number;
  splitAxis?: number;
  splitRipple?: number;
};

export const createFlutedGlassMaterial = (options: FlutedGlassMaterialOptions = {}) => {
  const uniforms: FlutedGlassUniforms = {
    uTime: { value: 0 },
    uDistortion: { value: options.distortion ?? 0.95 },
    uLightPosition: { value: options.lightPosition ?? new THREE.Vector3(1, 0, 1) },
    uFill: { value: options.fill ?? 0.5 },
    uPattern: { value: options.pattern ?? 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uOpacity: { value: options.opacity ?? 1 },
    uBaseColorA: { value: new THREE.Color(options.baseColorA ?? '#0c0f14') },
    uBaseColorB: { value: new THREE.Color(options.baseColorB ?? '#89a2d1') },
    uAccentColor: { value: new THREE.Color(options.accentColor ?? '#c4e4ff') },
    uGlow: { value: options.glow ?? 1 },
    uSplitStyle: { value: options.splitStyle ?? 0 },
    uSplitGap: { value: options.splitGap ?? 0 },
    uSplitActive: { value: options.splitActive ?? 0 },
    uSplitPosition: { value: options.splitPosition ?? 0.5 },
    uSplitWidth: { value: options.splitWidth ?? 0.04 },
    uSplitAxis: { value: options.splitAxis ?? 0 },
    uSplitRipple: { value: options.splitRipple ?? 0.5 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: flutedGlassVertex,
    fragmentShader: flutedGlassFragment,
    transparent: true,
    depthWrite: false,
  });
};
