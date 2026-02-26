/**
 * Choreography — manages the terminal heartbeat lifecycle.
 *
 * Each slot cycles through: BREATHING → DEPARTURE → EMPTY → ARRIVAL → BREATHING
 * The marketing terminal and any pinned slots do NOT cycle.
 *
 * Uses GSAP timelines for all animation. Renders TerminalChrome + ScanlineReveal
 * for each active slot.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import TerminalChrome from './TerminalChrome';
import ScanlineReveal from './ScanlineReveal';

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
  // Slots that cycle (not marketing)
  { id: 0, x: -5.2, width: 1.6, height: 3.0, pinned: false },     // left edge
  { id: 1, x: -3.2, width: 2.8, height: 3.4, pinned: true },      // MARKETING — no cycle
  { id: 2, x: -0.8, width: 2.4, height: 2.6, pinned: false },     // center-left
  { id: 3, x: 1.8, width: 2.2, height: 2.0, pinned: false },      // center-right
  { id: 4, x: 3.8, width: 1.3, height: 1.8, pinned: false },      // small right
  { id: 5, x: 5.2, width: 1.3, height: 1.8, pinned: false },      // small right 2
  { id: 6, x: 6.8, width: 2.4, height: 2.4, pinned: false },      // far right
];

// ── Phases ───────────────────────────────────────────────────────────

const PHASE = {
  ARRIVING: 'arriving',
  BREATHING: 'breathing',
  DEPARTING: 'departing',
  EMPTY: 'empty',
};

// ── Timing constants ─────────────────────────────────────────────────

const BEAT_DURATION = 1.6;       // seconds per heartbeat
const BEAT_COUNT = 3;            // beats before departure
const DEPARTURE_DURATION = 2.5;  // total departure time
const EMPTY_DURATION = 7;        // how long the slot stays empty
const ARRIVAL_REVEAL = 2.5;      // reveal animation duration

// ── Single animated slot ─────────────────────────────────────────────

function AnimatedSlot({
  slot,
  terminal,
  phase,
  baselineY,
  revealTrigger,
  onDepartureComplete,
  onArrivalComplete,
  // Glass props
  distortion, glow, baseColorA, baseColorB, accentColor, dotColor,
  // Reveal props
  revealColor, revealHotColor, revealGlowIntensity,
}) {
  const groupRef = useRef();
  const breathRef = useRef({ scale: 1, z: 0, opacity: 1 });
  const tlRef = useRef(null);

  const y = baselineY + slot.height / 2;

  // ── Breathing timeline ──
  useEffect(() => {
    if (phase !== PHASE.BREATHING) return;

    const b = breathRef.current;
    b.scale = 1;
    b.z = 0;
    b.opacity = 1;

    const tl = gsap.timeline({ repeat: -1 });

    for (let i = 0; i < BEAT_COUNT; i++) {
      const intensity = 1 + (i + 1) * 0.008; // each beat slightly larger
      const zPush = 0.08 + i * 0.02;

      tl.to(b, {
        scale: intensity,
        z: zPush,
        duration: BEAT_DURATION / 2,
        ease: 'sine.inOut',
      });
      tl.to(b, {
        scale: 1,
        z: 0,
        duration: BEAT_DURATION / 2,
        ease: 'sine.inOut',
      });
    }

    tlRef.current = tl;
    return () => tl.kill();
  }, [phase]);

  // ── Departure timeline ──
  useEffect(() => {
    if (phase !== PHASE.DEPARTING) return;

    const b = breathRef.current;
    const tl = gsap.timeline({
      onComplete: () => onDepartureComplete?.(slot.id),
    });

    // Freeze hold
    tl.to(b, { duration: 0.4 });

    // Scale down + fade
    tl.to(b, {
      scale: 0.95,
      opacity: 0,
      duration: DEPARTURE_DURATION - 0.4,
      ease: 'power2.in',
    });

    tlRef.current = tl;
    return () => tl.kill();
  }, [phase, slot.id, onDepartureComplete]);

  // ── Arrival timeline ──
  useEffect(() => {
    if (phase !== PHASE.ARRIVING) return;

    const b = breathRef.current;
    b.scale = 0.9;
    b.opacity = 0;
    b.z = 2; // start above (fly in from top)

    const tl = gsap.timeline({
      onComplete: () => onArrivalComplete?.(slot.id),
    });

    // Fly in + fade in
    tl.to(b, {
      scale: 1.02,
      opacity: 1,
      z: 0,
      duration: 0.8,
      ease: 'power2.out',
    });

    // Settle overshoot
    tl.to(b, {
      scale: 1,
      duration: 0.4,
      ease: 'sine.out',
    });

    tlRef.current = tl;
    return () => tl.kill();
  }, [phase, slot.id, onArrivalComplete]);

  // ── Apply animation values per frame ──
  useFrame(() => {
    if (!groupRef.current) return;
    const b = breathRef.current;
    groupRef.current.scale.setScalar(b.scale);
    groupRef.current.position.z = b.z;
    // opacity via material would be complex — use scale to 0 for "gone"
    if (b.opacity <= 0.01) {
      groupRef.current.visible = false;
    } else {
      groupRef.current.visible = true;
    }
  });

  if (phase === PHASE.EMPTY) return null;

  return (
    <group ref={groupRef} position={[slot.x, y, 0]}>
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
      </TerminalChrome>
    </group>
  );
}

// ── Choreography controller ──────────────────────────────────────────

export default function Choreography({
  baselineY = -1.5,
  // Glass props
  distortion = 0.6,
  glow = 0.5,
  baseColorA = '#050808',
  baseColorB = '#0a1a12',
  accentColor = '#1a6b3a',
  dotColor = '#1a6b3a',
  // Reveal props
  revealColor = '#FFBE18',
  revealHotColor = '#ffffff',
  revealGlowIntensity = 2.0,
}) {
  // Track which terminal is in each slot
  const [slotStates, setSlotStates] = useState(() =>
    SLOT_LAYOUT.map((slot, i) => ({
      terminalIndex: i % TERMINAL_POOL.length,
      phase: PHASE.ARRIVING,
      revealTrigger: 0,
    }))
  );

  // Track which slots are scheduled for departure
  const scheduleRef = useRef(null);
  const nextTerminalRef = useRef(SLOT_LAYOUT.length % TERMINAL_POOL.length);

  // Get next terminal from pool (round-robin)
  const getNextTerminal = useCallback(() => {
    const idx = nextTerminalRef.current;
    nextTerminalRef.current = (idx + 1) % TERMINAL_POOL.length;
    return idx;
  }, []);

  // ── Phase transition handlers ──

  const handleDepartureComplete = useCallback((slotId) => {
    setSlotStates((prev) => prev.map((s, i) =>
      i === slotId ? { ...s, phase: PHASE.EMPTY } : s
    ));

    // Schedule arrival after empty duration
    setTimeout(() => {
      setSlotStates((prev) => prev.map((s, i) =>
        i === slotId
          ? {
              terminalIndex: getNextTerminal(),
              phase: PHASE.ARRIVING,
              revealTrigger: s.revealTrigger + 1,
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

  // ── Master schedule: stagger slot departures ──
  useEffect(() => {
    if (scheduleRef.current) return; // only schedule once
    scheduleRef.current = true;

    // Cycle order: which slots depart and when
    // Skip pinned slots (marketing)
    const cyclableSlots = SLOT_LAYOUT
      .map((s, i) => ({ ...s, index: i }))
      .filter((s) => !s.pinned);

    // Stagger departures every 12s, starting after initial arrival settles
    const INITIAL_DELAY = 8000; // let everything arrive first
    const STAGGER = 12000;      // 12s between slot departures

    let cycleIndex = 0;

    const scheduleNext = () => {
      const slot = cyclableSlots[cycleIndex % cyclableSlots.length];
      cycleIndex++;

      setSlotStates((prev) => prev.map((s, i) =>
        i === slot.index && s.phase === PHASE.BREATHING
          ? { ...s, phase: PHASE.DEPARTING }
          : s
      ));

      // Schedule next departure
      setTimeout(scheduleNext, STAGGER);
    };

    setTimeout(scheduleNext, INITIAL_DELAY);
  }, []);

  return (
    <group>
      {SLOT_LAYOUT.map((slot, i) => {
        const state = slotStates[i];
        const terminal = slot.pinned
          ? { name: 'STARE', status: 'LIVE', link: 'stare.network' }
          : TERMINAL_POOL[state.terminalIndex];

        return (
          <AnimatedSlot
            key={slot.id}
            slot={slot}
            terminal={terminal}
            phase={slot.pinned ? PHASE.BREATHING : state.phase}
            baselineY={baselineY}
            revealTrigger={state.revealTrigger}
            onDepartureComplete={handleDepartureComplete}
            onArrivalComplete={handleArrivalComplete}
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
