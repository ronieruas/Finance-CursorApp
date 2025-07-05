import React from 'react';
import { motion } from 'framer-motion';
import '../styles/global.css';

function Input({ label, error, id, ...props }) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
      {label && <label htmlFor={inputId} style={{ marginBottom: 4, fontWeight: 500 }}>{label}</label>}
      <motion.input
        id={inputId}
        className="input-glass"
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        animate={error ? { x: [0, -8, 8, -8, 8, 0] } : false}
        transition={{ duration: 0.4 }}
        {...props}
      />
      {error && <span id={`${inputId}-error`} style={{ color: 'var(--color-danger)', fontSize: 12 }}>{error}</span>}
    </div>
  );
}

export default Input; 