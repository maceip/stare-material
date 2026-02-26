/**
 * Choreography — manages the terminal heartbeat lifecycle.
 *
 * Each slot cycles through: BREATHING → DEPARTURE → EMPTY → ARRIVAL → BREATHING
 * The marketing terminal and any pinned slots do NOT cycle.
 *
 * Departure: freeze → reverse scanline reveal (solid → lines → gone) → fade
 * Arrival:   arc from top-right → scanline reveal → settle
 *
 * Uses GSAP timelines for all animation. Renders TerminalChrome + ScanlineReveal
 * for each active slot.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import TerminalChrome from './TerminalChrome';
import ScanlineReveal from './ScanlineReveal';
import MarketingOverlay from './MarketingOverlay';
import EmailCapture from './EmailCapture';

// ── Slot definitions ─────────────────────────────────────────────────

const TERMINAL_POOL = [
  { name: 'CLAUDE', status: 'ACTIVE', link: 'anthropic.com' },
  { name: 'CODEX', status: 'ACTIVE', link: 'openai.com' },
  { name: 'GEMINI', status: 'ACTIVE', link: 'deepmind.google' },
  { name: 'AGENT-3', status: 'BOOT', link: '' },
  { name: 'AGENT-9', status: 'SYNC', link: '' },
  { name: 'NODE-7', status: 'IDLE', link: '' },
  { name: 'NODE-12', status: 'WAIT', link: '' },
  { name: 'RELAY-4', status: 'READY', link: '' },
  { name: 'MESH-1', status: 'LIVE', link: '' },
  { name: 'PROXY-6', status: 'ROUTE', link: '' },
];

const SLOT_LAYOUT = [
  { id: 0, x: -5.2, width: 1.6, height: 3.0, pinned: false },
  { id: 1, x: -3.2, width: 2.8, height: 3.4, pinned: true, role: 'marketing' },
  { id: 2, x: -0.8, width: 2.4, height: 2.6, pinned: false },
  { id: 3, x: 1.8, width: 2.2, height: 2.0, pinned: false },
  { id: 4, x: 3.8, width: 1.3, height: 1.8, pinned: true, role: 'email' },
  { id: 5, x: 5.2, width: 1.3, height: 1.8, pinned: false },
  { id: 6, x: 6.8, width: 2.4, height: 2.4, pinned: false },
];

// ── Phases ───────────────────────────────────────────────────────────

const PHASE = {
  ARRIVING: 'arriving',
  BREATHING: 'breathing',
  DEPARTING: 'departing',
  EMPTY: 'empty',
};

// ── Timing ───────────────────────────────────────────────────────────

const BEAT_DURATION = 1.6;
const BEAT_COUNT = 3;
const DEPARTURE_REVEAL = 1.5;     // reverse reveal duration
const DEPARTURE_LINGER = 0.6;     // ghost wireframe lingers
const DEPARTURE_FADE = 0.8;       // final fade
const EMPTY_DURATION = 7;
const ARRIVAL_ARC_DURATION = 1.0;  // fly-in arc
const ARRIVAL_REVEAL = 2.5;       // scanline reveal
const ARRIVAL_SETTLE = 0.4;       // overshoot settle

// ── Arc fly-in origin (top-right of viewport) ────────────────────────

const FLY_ORIGIN = { x: 8, y: 5, z: 3 };

// ── Single animated slot ─────────────────────────────────────────────

function AnimatedSlot({
  slot,
  terminal,
  phase,
  baselineY,
  revealTrigger,
  departureTrigger,
  onDepartureComplete,
  onArrivalComplete,
  role,
  distortion, glow, baseColorA, baseColorB, accentColor, dotColor,
  revealColor, revealHotColor, revealGlowIntensity,
}) {
  const groupRef = useRef();
  const anim = useRef({ scale: 1, x: 0, y: 0, z: 0, opacity: 1 });
  const tlRef = useRef(null);

  const restY = baselineY + slot.height / 2;

  // ── Breathing ──
  useEffect(() => {
    if (phase !== PHASE.BREATHING) return;

    const a = anim.current;
    a.scale = 1;
    a.x = slot.x;
    a.y = restY;
    a.z = 0;
    a.opacity = 1;

    const tl = gsap.timeline({ repeat: -1 });

    for (let i = 0; i < BEAT_COUNT; i++) {
      const s = 1 + (i + 1) * 0.008;
      const zp = 0.08 + i * 0.02;

      tl.to(a, { scale: s, z: zp, duration: BEAT_DURATION / 2, ease: 'sine.inOut' });
      tl.to(a, { scale: 1, z: 0, duration: BEAT_DURATION / 2, ease: 'sine.inOut' });
    }

    tlRef.current = tl;
    return () => tl.kill();
  }, [phase, slot.x, restY]);

  // ── Departure: freeze → reverse reveal plays → ghost linger → fade ──
  useEffect(() => {
    if (phase !== PHASE.DEPARTING) return;

    const a = anim.current;
    const tl = gsap.timeline({
      onComplete: () => onDepartureComplete?.(slot.id),
    });

    // 1. Freeze hold (reverse reveal fires via departureTrigger prop change)
    tl.to(a, { duration: 0.4 });

    // 2. Wait for reverse reveal to play
    tl.to(a, { duration: DEPARTURE_REVEAL });

    // 3. Ghost linger at reduced opacity
    tl.to(a, { opacity: 0.15, duration: 0.1 });
    tl.to(a, { duration: DEPARTURE_LINGER });

    // 4. Final fade out
    tl.to(a, { opacity: 0, scale: 0.95, duration: DEPARTURE_FADE, ease: 'power2.in' });

    tlRef.current = tl;
    return () => tl.kill();
  }, [phase, slot.id, onDepartureComplete]);

  // ── Arrival: arc from top-right → land → reveal plays ──
  useEffect(() => {
    if (phase !== PHASE.ARRIVING) return;

    const a = anim.current;
    // Start at fly-in origin
    a.scale = 0.4;
    a.x = slot.x + FLY_ORIGIN.x;
    a.y = restY + FLY_ORIGIN.y;
    a.z = FLY_ORIGIN.z;
    a.opacity = 0;

    const tl = gsap.timeline({
      onComplete: () => onArrivalComplete?.(slot.id),
    });

    // Arc to final position — fast fade in, then glide into slot
    tl.to(a, {
      x: slot.x,
      y: restY,
      z: 0,
      scale: 1.02,
      opacity: 1,
      duration: ARRIVAL_ARC_DURATION,
      ease: 'power3.out',
    });

    // Settle overshoot
    tl.to(a, {
      scale: 1,
      duration: ARRIVAL_SETTLE,
      ease: 'sine.out',
    });

    // Wait for reveal to finish (it fires automatically via revealTrigger)
    tl.to(a, { duration: ARRIVAL_REVEAL * 0.5 });

    tlRef.current = tl;
    return () => tl.kill();
  }, [phase, slot.id, slot.x, restY, onArrivalComplete]);

  // ── Apply per frame ──
  useFrame(() => {
    if (!groupRef.current) return;
    const a = anim.current;
    groupRef.current.position.set(a.x, a.y, a.z);
    groupRef.current.scale.setScalar(a.scale);
    groupRef.current.visible = a.opacity > 0.01;
  });

  if (phase === PHASE.EMPTY) return null;

  // Determine if this is a departure (reverse reveal) or arrival (forward reveal)
  const isDeparting = phase === PHASE.DEPARTING;

  return (
    <group ref={groupRef} position={[slot.x, restY, 0]}>
      <TerminalChrome
        width={slot.width}
        height={slot.height}
        distortion={distortion}
        glow={glow}
        baseColorA={baseColorA}
        baseColorB={baseColorB}
        accentColor={accentColor}
        dotColor={dotColor}
        name={terminal.name}
        status={terminal.status}
        link={terminal.link}
      >
        {/* Forward reveal on arrival */}
        {!isDeparting && (
          <ScanlineReveal
            width={slot.width}
            height={slot.height}
            color={revealColor}
            hotColor={revealHotColor}
            glowIntensity={revealGlowIntensity}
            duration={ARRIVAL_REVEAL}
            trigger={revealTrigger}
            position={[0, 0, 0.002]}
          />
        )}
        {/* Reverse reveal on departure */}
        {isDeparting && (
          <ScanlineReveal
            width={slot.width}
            height={slot.height}
            color={revealColor}
            hotColor={revealHotColor}
            glowIntensity={revealGlowIntensity}
            duration={DEPARTURE_REVEAL}
            trigger={departureTrigger}
            reverse
            position={[0, 0, 0.002]}
          />
        )}
        {/* Marketing copy overlay */}
        {role === 'marketing' && (
          <MarketingOverlay width={slot.width} height={slot.height} />
        )}
        {/* Email capture overlay */}
        {role === 'email' && (
          <EmailCapture width={slot.width} height={slot.height} />
        )}
      </TerminalChrome>
    </group>
  );
}

// ── Choreography controller ──────────────────────────────────────────

export default function Choreography({
  baselineY = -1.5,
  distortion = 0.6,
  glow = 0.5,
  baseColorA = '#050808',
  baseColorB = '#0a1a12',
  accentColor = '#1a6b3a',
  dotColor = '#1a6b3a',
  revealColor = '#FFBE18',
  revealHotColor = '#ffffff',
  revealGlowIntensity = 2.0,
}) {
  const [slotStates, setSlotStates] = useState(() =>
    SLOT_LAYOUT.map((slot, i) => ({
      terminalIndex: i % TERMINAL_POOL.length,
      phase: PHASE.ARRIVING,
      revealTrigger: 0,
      departureTrigger: 0,
    }))
  );

  const scheduleRef = useRef(null);
  const nextTerminalRef = useRef(SLOT_LAYOUT.length % TERMINAL_POOL.length);

  const getNextTerminal = useCallback(() => {
    const idx = nextTerminalRef.current;
    nextTerminalRef.current = (idx + 1) % TERMINAL_POOL.length;
    return idx;
  }, []);

  const handleDepartureComplete = useCallback((slotId) => {
    setSlotStates((prev) => prev.map((s, i) =>
      i === slotId ? { ...s, phase: PHASE.EMPTY } : s
    ));

    setTimeout(() => {
      setSlotStates((prev) => prev.map((s, i) =>
        i === slotId
          ? {
              terminalIndex: getNextTerminal(),
              phase: PHASE.ARRIVING,
              revealTrigger: s.revealTrigger + 1,
              departureTrigger: s.departureTrigger,
            }
          : s
      ));
    }, EMPTY_DURATION * 1000);
  }, [getNextTerminal]);

  const handleArrivalComplete = useCallback((slotId) => {
    setSlotStates((prev) => prev.map((s, i) =>
      i === slotId ? { ...s, phase: PHASE.BREATHING } : s
    ));
  }, []);

  // ── Master schedule ──
  useEffect(() => {
    if (scheduleRef.current) return;
    scheduleRef.current = true;

    const cyclableSlots = SLOT_LAYOUT
      .map((s, i) => ({ ...s, index: i }))
      .filter((s) => !s.pinned);

    const INITIAL_DELAY = 8000;
    const STAGGER = 12000;

    let cycleIndex = 0;

    const scheduleNext = () => {
      const slot = cyclableSlots[cycleIndex % cyclableSlots.length];
      cycleIndex++;

      setSlotStates((prev) => prev.map((s, i) =>
        i === slot.index && s.phase === PHASE.BREATHING
          ? { ...s, phase: PHASE.DEPARTING, departureTrigger: s.departureTrigger + 1 }
          : s
      ));

      setTimeout(scheduleNext, STAGGER);
    };

    setTimeout(scheduleNext, INITIAL_DELAY);
  }, []);

  return (
    <group>
      {SLOT_LAYOUT.map((slot, i) => {
        const state = slotStates[i];
        const terminal = slot.role === 'marketing'
          ? { name: 'STARE', status: 'LIVE', link: 'stare.network' }
          : slot.role === 'email'
          ? { name: 'JOIN', status: 'OPEN', link: '' }
          : TERMINAL_POOL[state.terminalIndex];

        return (
          <AnimatedSlot
            key={slot.id}
            slot={slot}
            terminal={terminal}
            phase={slot.pinned ? PHASE.BREATHING : state.phase}
            baselineY={baselineY}
            revealTrigger={state.revealTrigger}
            departureTrigger={state.departureTrigger}
            onDepartureComplete={handleDepartureComplete}
            onArrivalComplete={handleArrivalComplete}
            role={slot.role}
            distortion={distortion}
            glow={glow}
            baseColorA={baseColorA}
            baseColorB={baseColorB}
            accentColor={accentColor}
            dotColor={dotColor}
            revealColor={revealColor}
            revealHotColor={revealHotColor}
            revealGlowIntensity={revealGlowIntensity}
          />
        );
      })}
    </group>
  );
}
