import React from 'react';

function Loader() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(36,41,54,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        width: 56, height: 56, border: '6px solid #fff', borderTop: '6px solid #2563eb', borderRadius: '50%',
        animation: 'spinBtn 0.7s linear infinite',
        boxShadow: '0 2px 16px #0002',
        background: 'rgba(255,255,255,0.7)'
      }} />
    </div>
  );
}

export default Loader; 