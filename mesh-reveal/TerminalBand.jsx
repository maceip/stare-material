/**
 * TerminalBand — horizontal band of terminals, bottom-aligned.
 *
 * Places terminals in a row like a shelf. Some taller, some shorter,
 * all sharing the same bottom baseline. Fakes bleed off viewport edges.
 *
 * Dependencies (peer): react, three, @react-three/fiber
 * No local imports except sibling components.
 */

import { useMemo } from 'react';
import TerminalChrome from './TerminalChrome';
import ScanlineReveal from './ScanlineReveal';

// ── Slot definitions ────────────────────────────────────────────────
// Each slot describes a terminal in the band.
// x is center position, width/height in world units.
// type: 'real' | 'fake' | 'marketing'

const DEFAULT_SLOTS = [
  // Far left — bleeds off edge
  { id: 'fake-L1', type: 'fake', x: -6.8, width: 1.6, height: 3.2, name: 'NODE-7', status: 'IDLE' },

  // Marketing — tall, left-center
  { id: 'marketing', type: 'marketing', x: -4.2, width: 2.8, height: 3.4, name: 'STARE', status: 'LIVE', link: 'stare.network' },

  // CLAUDE — medium-large
  { id: 'claude', type: 'real', x: -1.2, width: 2.4, height: 2.6, name: 'CLAUDE', status: 'ACTIVE', link: 'anthropic.com' },

  // CODEX — medium, below CLAUDE conceptually but in same band
  { id: 'codex', type: 'real', x: 1.2, width: 2.2, height: 2.0, name: 'CODEX', status: 'ACTIVE', link: 'openai.com' },

  // Small fakes — paired
  { id: 'fake-R1', type: 'fake', x: 3.0, width: 1.3, height: 1.8, name: 'AGENT-3', status: 'BOOT' },
  { id: 'fake-R2', type: 'fake', x: 4.4, width: 1.3, height: 1.8, name: 'AGENT-9', status: 'SYNC' },

  // GEMINI — medium-wide
  { id: 'gemini', type: 'real', x: 6.0, width: 2.4, height: 2.0, name: 'GEMINI', status: 'ACTIVE', link: 'deepmind.google' },

  // Far right — bleeds off edge
  { id: 'fake-R3', type: 'fake', x: 7.8, width: 1.4, height: 2.8, name: 'NODE-12', status: 'WAIT' },
];

// ── Component ───────────────────────────────────────────────────────

export default function TerminalBand({
  slots = DEFAULT_SLOTS,
  baselineY = -1.5,       // bottom of the band in world Y
  revealTrigger = 0,
  revealColor = '#FFBE18',
  revealHotColor = '#ffffff',
  revealDuration = 2.5,
  revealLineCount = 80,
  revealGlowIntensity = 2.0,
  // Glass surface props (passed to all terminals)
  distortion = 0.6,
  glow = 0.5,
  baseColorA = '#050808',
  baseColorB = '#0a1a12',
  accentColor = '#1a6b3a',
  dotColor = '#1a6b3a',
}) {
  return (
    <group>
      {slots.map((slot, i) => {
        // Bottom-align: position Y so the bottom edge sits at baselineY
        const y = baselineY + slot.height / 2;

        return (
          <group key={slot.id} position={[slot.x, y, 0]}>
            <TerminalChrome
              width={slot.width}
              height={slot.height}
              distortion={distortion}
              glow={glow}
              baseColorA={baseColorA}
              baseColorB={baseColorB}
              accentColor={accentColor}
              dotColor={dotColor}
              name={slot.name}
              status={slot.status}
              link={slot.link || ''}
            >
              <ScanlineReveal
                width={slot.width}
                height={slot.height}
                color={revealColor}
                hotColor={revealHotColor}
                duration={revealDuration + i * 0.3}
                lineCount={revealLineCount}
                glowIntensity={revealGlowIntensity}
                trigger={revealTrigger}
                position={[0, 0, 0.002]}
              />
            </TerminalChrome>
          </group>
        );
      })}
    </group>
  );
}
