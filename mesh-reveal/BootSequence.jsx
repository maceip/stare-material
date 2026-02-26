/**
 * BootSequence — typewriter terminal content that appears after reveal.
 *
 * Renders fake boot output line-by-line with staggered timing.
 * Uses native HTML via drei's <Html> for crisp monospace text.
 */

import { useState, useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';

// ── Boot line pools ──────────────────────────────────────────────────

const BOOT_LINES = {
  CLAUDE: [
    '$ stare connect anthropic/claude-4',
    'Authenticating via API key... ████████',
    '→ session: sk-ant-**************',
    '→ model: claude-opus-4-20250514',
    '→ context: 200k tokens',
    '→ tools: code, web, files, mcp',
    'READY ● streaming enabled',
    '',
    '> analyze the auth flow in src/middleware',
    '█',
  ],
  CODEX: [
    '$ stare connect openai/codex',
    'Authenticating... ████████',
    '→ session: sk-proj-**************',
    '→ model: o3-pro',
    '→ sandbox: enabled',
    '→ exec: docker-isolated',
    'READY ● agent loop active',
    '',
    '> refactor the payment module',
    '█',
  ],
  GEMINI: [
    '$ stare connect google/gemini',
    'Authenticating... ████████',
    '→ session: AIza**************',
    '→ model: gemini-2.5-pro',
    '→ grounding: enabled',
    '→ multimodal: vision + audio',
    'READY ● grounded search on',
    '',
    '> summarize this PDF and cross-ref',
    '█',
  ],
  DEFAULT: [
    '$ stare node --init',
    'Loading configuration...',
    '→ pid: ' + Math.floor(Math.random() * 90000 + 10000),
    '→ uptime: 0s',
    '→ mesh: peer-discovery',
    '→ protocol: v0.4.2-alpha',
    'STANDBY ● awaiting assignment',
    '',
    '...',
    '█',
  ],
};

// Fake boot lines for generic terminals
const FAKE_LINES = [
  '$ stare agent --spawn',
  'Initializing runtime...',
  '→ heap: 512MB allocated',
  '→ threads: 4',
  '→ queue: empty',
  'Connecting to mesh...',
  '→ peers: 3 discovered',
  '→ latency: 12ms avg',
  'ONLINE ● idle',
  '█',
];

function getBootLines(name) {
  if (BOOT_LINES[name]) return BOOT_LINES[name];
  // Randomize fake lines slightly
  return FAKE_LINES.map((line) =>
    line.includes('heap')
      ? `→ heap: ${Math.floor(Math.random() * 512 + 256)}MB allocated`
      : line.includes('peers')
      ? `→ peers: ${Math.floor(Math.random() * 8 + 1)} discovered`
      : line.includes('latency')
      ? `→ latency: ${Math.floor(Math.random() * 30 + 5)}ms avg`
      : line.includes('pid')
      ? `→ pid: ${Math.floor(Math.random() * 90000 + 10000)}`
      : line
  );
}

// ── Component ────────────────────────────────────────────────────────

export default function BootSequence({
  width = 2.4,
  height = 2.6,
  name = 'DEFAULT',
  delay = 0.5,
}) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const lines = useRef(getBootLines(name)).current;

  // Line-by-line reveal
  useEffect(() => {
    setVisibleLines(0);

    const timers = lines.map((_, i) =>
      setTimeout(
        () => setVisibleLines(i + 1),
        (delay + i * 0.18) * 1000 // 180ms per line after initial delay
      )
    );

    return () => timers.forEach(clearTimeout);
  }, [delay, name]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const pxW = width * 100;
  const pxH = height * 100;

  return (
    <Html
      center
      position={[0, 0, 0.004]}
      distanceFactor={8}
      style={{
        width: `${pxW}px`,
        height: `${pxH}px`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          padding: '20px 12px 12px',
          fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
          fontSize: '8px',
          lineHeight: 1.6,
          color: '#6a9a7a',
          overflow: 'hidden',
          userSelect: 'text',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} style={{ minHeight: '13px' }}>
            {/* Replace block cursor with blinking version on last line */}
            {line === '█' ? (
              <span style={{
                color: '#FFBE18',
                opacity: cursorVisible ? 1 : 0,
                transition: 'opacity 0.1s',
              }}>█</span>
            ) : (
              <span style={{
                color: line.startsWith('→') ? '#5a8a6a'
                  : line.startsWith('$') ? '#a0c0a8'
                  : line.startsWith('READY') || line.startsWith('ONLINE') || line.startsWith('STANDBY') ? '#3a8a5a'
                  : line.startsWith('>') ? '#c8d8cc'
                  : '#6a9a7a',
              }}>{line}</span>
            )}
          </div>
        ))}
      </div>
    </Html>
  );
}
