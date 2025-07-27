import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import '../styles/global.css';

const Sidebar = ({ setToken, user }) => {
  const [open, setOpen] = useState(window.innerWidth > 700);
  const navigate = useNavigate();
  React.useEffect(() => {
    const onResize = () => setOpen(window.innerWidth > 700);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  React.useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open]);
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  };
  return (
    <>
      <button className="sidebar-mobile-toggle" aria-label="Abrir/fechar menu" style={{ display: window.innerWidth <= 700 ? 'block' : 'none' }} onClick={() => setOpen(o => !o)}>
        ☰
      </button>
      {open && (
        <aside style={{ width: window.innerWidth > 700 ? 160 : '100vw', background: '#f5f7fa', height: window.innerWidth > 700 ? '100vh' : 'auto', padding: 16, boxSizing: 'border-box', position: window.innerWidth > 700 ? 'fixed' : 'static', left: 0, top: 0, zIndex: 1000, borderRadius: window.innerWidth > 700 ? 18 : 0, boxShadow: window.innerWidth > 700 ? '0 2px 16px #0001' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ marginBottom: 0, fontSize: 18 }}>Financeiro</h2>
            <ThemeToggle />
          </div>
          <nav role="navigation" aria-label="Menu principal">
            <ul style={{ listStyle: 'none', padding: 0, fontSize: 15 }}>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/analytics">Analytics</Link></li>
              <li><Link to="/accounts">Contas</Link></li>
              <li><Link to="/incomes">Receitas</Link></li>
              <li><Link to="/expenses">Despesas</Link></li>
              <li><Link to="/creditCards">Cartões</Link></li>
              <li><Link to="/budgets">Orçamentos</Link></li>
              <li><Link to="/transfers">Transferências</Link></li>
              {user && user.role === 'admin' && (
                <>
                  <li style={{ marginTop: 24, fontWeight: 600, color: '#2563eb' }}>Administração</li>
                  <li><Link to="/admin/change-password">Trocar Senha</Link></li>
                  <li><Link to="/admin/users">Gerenciar Usuários</Link></li>
                </>
              )}
            </ul>
          </nav>
          <button onClick={handleLogout} aria-label="Sair do sistema" style={{ marginTop: 32, width: '100%' }}>Sair</button>
        </aside>
      )}
    </>
  );
};

export default Sidebar; 