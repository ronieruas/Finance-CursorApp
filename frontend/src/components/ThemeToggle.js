import React from 'react';

function ThemeToggle() {
  const [dark, setDark] = React.useState(() => document.body.classList.contains('dark-mode'));
  const toggle = () => {
    document.body.classList.toggle('dark-mode');
    setDark(document.body.classList.contains('dark-mode'));
  };
  return (
    <button onClick={toggle} style={{
      background: 'none',
      border: 'none',
      color: dark ? '#f3f4f6' : '#232946',
      fontSize: 22,
      cursor: 'pointer',
      marginLeft: 12,
      marginTop: 2,
      transition: 'color 0.3s',
    }} title={dark ? 'Modo claro' : 'Modo escuro'}>
      {dark ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeToggle; 