/**
 * useFocusMode — hook for zooming into a single terminal.
 *
 * When a slot is focused, the camera smoothly animates to frame
 * just that terminal. Press Escape or click outside to return.
 *
 * Returns: { focusedSlot, setFocus, clearFocus, cameraTarget }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

export default function useFocusMode(baselineY = -1.5) {
  const [focusedSlot, setFocusedSlot] = useState(null);
  const { camera } = useThree();
  const targetRef = useRef({
    x: 0, y: 0, z: 12,    // default camera pos for band
    lookX: 0, lookY: 0, lookZ: 0,
  });
  const isAnimating = useRef(false);

  const setFocus = useCallback((slot) => {
    if (!slot || isAnimating.current) return;
    setFocusedSlot(slot);
    isAnimating.current = true;

    const y = baselineY + slot.height / 2;
    // Frame the terminal: camera z distance based on terminal size
    const maxDim = Math.max(slot.width, slot.height);
    const fovRad = (camera.fov * Math.PI) / 180;
    const dist = (maxDim / 2) / Math.tan(fovRad / 2) * 1.3; // 1.3 = padding

    const t = targetRef.current;
    gsap.to(t, {
      x: slot.x,
      y: y,
      z: dist,
      lookX: slot.x,
      lookY: y,
      lookZ: 0,
      duration: 1.0,
      ease: 'power2.inOut',
      onComplete: () => { isAnimating.current = false; },
    });
  }, [camera, baselineY]);

  const clearFocus = useCallback(() => {
    if (isAnimating.current) return;
    setFocusedSlot(null);
    isAnimating.current = true;

    const t = targetRef.current;
    gsap.to(t, {
      x: 0,
      y: 0,
      z: 12,
      lookX: 0,
      lookY: 0,
      lookZ: 0,
      duration: 1.0,
      ease: 'power2.inOut',
      onComplete: () => { isAnimating.current = false; },
    });
  }, []);

  // Escape key to exit focus
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && focusedSlot) {
        clearFocus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [focusedSlot, clearFocus]);

  // Apply camera position each frame
  useFrame(() => {
    const t = targetRef.current;
    camera.position.set(t.x, t.y, t.z);
    camera.lookAt(t.lookX, t.lookY, t.lookZ);
  });

  return { focusedSlot, setFocus, clearFocus };
}
