import React from 'react';

export default function Modal({ open, onClose, title, children, width = 400 }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px #0002', padding: 32, minWidth: width, maxWidth: '90vw', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>&times;</button>
        {title && <h3 style={{ marginTop: 0, marginBottom: 24 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
} 