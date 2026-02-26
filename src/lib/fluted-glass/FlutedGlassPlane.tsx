import { forwardRef, useEffect, useMemo, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createFlutedGlassMaterial } from './FlutedGlassMaterial';
import { patternToIndex, type FlutedPattern } from './types';

export type FlutedGlassPlaneProps = {
  pattern?: number | FlutedPattern;
  distortion?: number;
  fill?: number;
  lightPosition?: [number, number, number];
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

export const FlutedGlassPlane = forwardRef<THREE.Mesh, FlutedGlassPlaneProps>(
  (
    {
      pattern = 0,
      distortion = 0.95,
      fill = 0.5,
      lightPosition = [1, 0, 1],
      opacity = 1,
      baseColorA,
      baseColorB,
      accentColor,
      glow = 1,
      splitStyle = 0,
      splitGap = 0,
      splitActive = 0,
      splitPosition = 0.5,
      splitWidth = 0.04,
      splitAxis = 0,
      splitRipple = 0.5,
    },
    ref
  ) => {
    const { size, viewport } = useThree();

    const material = useMemo(
      () =>
        createFlutedGlassMaterial({
          distortion,
          fill,
          pattern: patternToIndex(pattern),
          opacity,
          lightPosition: new THREE.Vector3(...lightPosition),
          baseColorA,
          baseColorB,
          accentColor,
          glow,
          splitStyle,
          splitGap,
          splitActive,
          splitPosition,
          splitWidth,
          splitAxis,
          splitRipple,
        }),
      []
    );

    useEffect(() => {
      material.uniforms.uDistortion.value = distortion;
      material.uniforms.uFill.value = fill;
      material.uniforms.uPattern.value = patternToIndex(pattern);
      material.uniforms.uOpacity.value = opacity;
      material.uniforms.uLightPosition.value.set(...lightPosition);
      material.uniforms.uGlow.value = glow;
      material.uniforms.uSplitStyle.value = splitStyle;
      material.uniforms.uSplitGap.value = splitGap;
      material.uniforms.uSplitActive.value = splitActive;
      material.uniforms.uSplitPosition.value = splitPosition;
      material.uniforms.uSplitWidth.value = splitWidth;
      material.uniforms.uSplitAxis.value = splitAxis;
      material.uniforms.uSplitRipple.value = splitRipple;
      if (baseColorA) material.uniforms.uBaseColorA.value.set(baseColorA);
      if (baseColorB) material.uniforms.uBaseColorB.value.set(baseColorB);
      if (accentColor) material.uniforms.uAccentColor.value.set(accentColor);
    }, [
      material,
      distortion,
      fill,
      pattern,
      opacity,
      lightPosition,
      baseColorA,
      baseColorB,
      accentColor,
      glow,
      splitStyle,
      splitGap,
      splitActive,
      splitPosition,
      splitWidth,
      splitAxis,
      splitRipple,
    ]);

    useEffect(() => {
      material.uniforms.uResolution.value.set(size.width, size.height);
    }, [material, size.width, size.height]);

    useEffect(() => () => material.dispose(), [material]);

    useFrame(({ clock }) => {
      material.uniforms.uTime.value = clock.getElapsedTime();
    });

    const scale = useMemo(
      () => [viewport.width, viewport.height, 1] as const,
      [viewport.width, viewport.height]
    );

    return (
      <mesh
        ref={(node) => {
          if (typeof ref === 'function') ref(node as THREE.Mesh);
          if (ref && typeof ref === 'object') (ref as MutableRefObject<THREE.Mesh | null>).current = node;
        }}
        scale={scale}
      >
        <planeGeometry args={[1, 1, 1, 1]} />
        <primitive object={material} attach="material" />
      </mesh>
    );
  }
);

FlutedGlassPlane.displayName = 'FlutedGlassPlane';
