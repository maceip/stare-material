/**
 * EmailCapture — HTML email input overlay for a terminal slot.
 *
 * Native DOM input positioned on the terminal surface via drei's <Html>.
 * Styled to match the terminal/glass aesthetic.
 */

import { useState } from 'react';
import { Html } from '@react-three/drei';

const styles = {
  container: {
    width: '100%',
    height: '100%',
    padding: '20px 16px',
    fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
    color: '#c8d8cc',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    userSelect: 'text',
  },
  label: {
    fontSize: '8px',
    letterSpacing: '0.2em',
    color: '#5a9a6a',
    textTransform: 'uppercase',
  },
  inputRow: {
    display: 'flex',
    gap: '6px',
    width: '100%',
    maxWidth: '220px',
  },
  input: {
    flex: 1,
    background: 'rgba(10, 26, 18, 0.6)',
    border: '1px solid rgba(58, 138, 90, 0.3)',
    borderRadius: '3px',
    padding: '6px 8px',
    fontSize: '9px',
    fontFamily: 'inherit',
    color: '#c8d8cc',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    background: 'rgba(255, 190, 24, 0.15)',
    border: '1px solid rgba(255, 190, 24, 0.4)',
    borderRadius: '3px',
    padding: '6px 10px',
    fontSize: '8px',
    fontFamily: 'inherit',
    fontWeight: 600,
    letterSpacing: '0.1em',
    color: '#FFBE18',
    cursor: 'pointer',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap',
  },
  status: {
    fontSize: '8px',
    color: '#3a8a5a',
    letterSpacing: '0.1em',
    minHeight: '12px',
  },
};

export default function EmailCapture({ width = 1.3, height = 1.8 }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const pxW = width * 100;
  const pxH = height * 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.includes('@')) {
      setSubmitted(true);
      // TODO: wire to actual API
    }
  };

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
        <span style={styles.label}>Join the Network</span>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={styles.inputRow}>
            <input
              type="email"
              placeholder="you@node.net"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(255, 190, 24, 0.5)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(58, 138, 90, 0.3)'; }}
            />
            <button type="submit" style={styles.button}>→</button>
          </form>
        ) : (
          <div style={styles.status}>● QUEUED</div>
        )}
      </div>
    </Html>
  );
}
