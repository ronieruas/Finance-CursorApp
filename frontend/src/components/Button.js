import React from 'react';
import '../styles/global.css';

function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 18,
      height: 18,
      border: '2.5px solid #fff',
      borderTop: '2.5px solid #2563eb',
      borderRadius: '50%',
      animation: 'spinBtn 0.7s linear infinite',
      marginRight: 8,
      verticalAlign: 'middle',
    }} />
  );
}

function Button({ children, variant = 'primary', loading, 'aria-label': ariaLabel, ...props }) {
  const className = `btn-${variant}` + (loading ? ' btn-loading' : '');
  return (
    <button className={className} disabled={loading || props.disabled} aria-label={ariaLabel} {...props}>
      {loading ? <Spinner /> : null}
      {loading ? 'Carregando...' : children}
    </button>
  );
}

export default Button; 