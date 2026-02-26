/**
 * MarketingOverlay — HTML copy that floats on the marketing terminal surface.
 *
 * Native DOM rendering via drei's <Html>. Text is selectable, indexable,
 * and styled with proper CSS typography. Positioned in 3D space but
 * rendered outside the canvas.
 */

import { Html } from '@react-three/drei';

const styles = {
  container: {
    width: '100%',
    height: '100%',
    padding: '24px 20px 16px',
    fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
    color: '#c8d8cc',
    overflow: 'hidden',
    userSelect: 'text',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    boxSizing: 'border-box',
  },
  badge: {
    display: 'inline-block',
    fontSize: '8px',
    letterSpacing: '0.2em',
    color: '#3a8a5a',
    borderBottom: '1px solid rgba(58, 138, 90, 0.3)',
    paddingBottom: '4px',
    marginBottom: '2px',
  },
  headline: {
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    lineHeight: 1.2,
    color: '#e8ece8',
    margin: 0,
  },
  subhead: {
    fontSize: '8px',
    letterSpacing: '0.15em',
    color: '#5a9a6a',
    textTransform: 'uppercase',
    margin: 0,
  },
  body: {
    fontSize: '8.5px',
    lineHeight: 1.5,
    color: '#a0b8a8',
    margin: 0,
  },
  divider: {
    width: '100%',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(58, 138, 90, 0.3), transparent)',
    margin: '2px 0',
  },
  principle: {
    fontSize: '8px',
    lineHeight: 1.4,
    color: '#8aaa92',
    margin: 0,
  },
  principleLabel: {
    color: '#5a9a6a',
    fontWeight: 600,
  },
  cta: {
    marginTop: 'auto',
    fontSize: '9px',
    letterSpacing: '0.12em',
    color: '#FFBE18',
    fontWeight: 600,
    opacity: 0.9,
  },
};

export default function MarketingOverlay({ width = 2.8, height = 3.4 }) {
  // Scale HTML to approximately match world units → pixels
  const pxW = width * 100;
  const pxH = height * 100;

  return (
    <Html
      center
      position={[0, 0, 0.004]}
      style={{
        width: `${pxW}px`,
        height: `${pxH}px`,
      }}
      transform={false}
    >
      <div style={styles.container}>
        <span style={styles.badge}>STARE.NETWORK</span>

        <p style={styles.subhead}>Multi-Agent Orchestration</p>

        <h1 style={styles.headline}>
          RADICAL OWNERSHIP.<br />
          TOTAL VELOCITY.
        </h1>

        <p style={styles.body}>
          The web shell for those who refuse to outsource their agency.
          Orchestrate multi-agent workflows with a tool that prioritizes
          self-responsibility over convenience.
        </p>

        <div style={styles.divider} />

        <p style={styles.principle}>
          <span style={styles.principleLabel}>Self-Responsibility:</span>{' '}
          We provide the substrate; you provide the execution.
        </p>

        <p style={styles.principle}>
          <span style={styles.principleLabel}>Sovereign Execution:</span>{' '}
          Your agents, your models, your hardware.
        </p>

        <p style={styles.principle}>
          <span style={styles.principleLabel}>Collective Acceleration:</span>{' '}
          Build transparent, shareable primitives.
        </p>

        <div style={styles.divider} />

        <p style={styles.principle}>
          <span style={styles.principleLabel}>Provider Agnostic</span> — Any LLM, one session<br />
          <span style={styles.principleLabel}>Portable Context</span> — Move your brain instantly<br />
          <span style={styles.principleLabel}>P2P Collaboration</span> — Encrypted, no central server
        </p>

        <div style={styles.cta}>
          JOIN THE NETWORK →
        </div>
      </div>
    </Html>
  );
}
