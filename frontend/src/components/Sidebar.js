import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import '../styles/global.css';

const Sidebar = ({ setToken, user }) => {
  const [open, setOpen] = useState(window.innerWidth > 700);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 700;
      setIsMobile(mobile);
      if (!mobile) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!open || !isMobile) return;
    
    const handleEsc = (e) => { 
      if (e.key === 'Escape') setOpen(false); 
    };
    
    const handleClickOutside = (e) => {
      if (e.target.closest('aside') || e.target.closest('.sidebar-mobile-toggle')) return;
      setOpen(false);
    };

    window.addEventListener('keydown', handleEsc);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open, isMobile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && open && (
        <div 
          className="sidebar-overlay open"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Botão mobile toggle */}
      {isMobile && (
        <button 
          className="sidebar-mobile-toggle" 
          aria-label="Abrir/fechar menu" 
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      )}

      {/* Sidebar */}
      <aside 
        className={open ? 'open' : ''}
        style={{ 
          width: isMobile ? '280px' : 160, 
          background: '#f5f7fa', 
          height: isMobile ? '100vh' : '100vh', 
          padding: 16, 
          boxSizing: 'border-box', 
          position: isMobile ? 'fixed' : 'fixed', 
          left: 0, 
          top: 0, 
          zIndex: 1000, 
          borderRadius: isMobile ? 0 : 18, 
          boxShadow: isMobile ? '2px 0 8px rgba(0,0,0,0.1)' : '0 2px 16px #0001',
          transform: isMobile ? (open ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          transition: isMobile ? 'transform 0.3s ease' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ marginBottom: 0, fontSize: 18 }}>Financeiro</h2>
          <ThemeToggle />
        </div>
        
        <nav role="navigation" aria-label="Menu principal">
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 15 }}>
            <li>
              <Link to="/" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/analytics" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                Analytics
              </Link>
            </li>
            <li>
              <Link to="/resumo-financeiro" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                Resumo Financeiro
              </Link>
            </li>
            <li>
              <Link to="/accounts" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                Contas
              </Link>
            </li>
            <li>
              <Link to="/incomes" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                Receitas
              </Link>
            </li>
            <li>
              <Link to="/expenses" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                Despesas
              </Link>
            </li>
            <li>
              <Link to="/creditCards" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                Cartões
              </Link>
            </li>
            <li>
              <Link to="/budgets" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                Orçamentos
              </Link>
            </li>
            <li>
              <Link to="/transfers" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                Transferências
              </Link>
            </li>
            {user && user.role === 'admin' && (
              <>
                <li style={{ marginTop: 24, fontWeight: 600, color: '#2563eb' }}>Administração</li>
                <li>
                  <Link to="/admin/change-password" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                    Trocar Senha
                  </Link>
                </li>
                <li>
                  <Link to="/admin/users" onClick={handleLinkClick} style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: 'inherit' }}>
                    Gerenciar Usuários
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        
        <button 
          onClick={handleLogout} 
          aria-label="Sair do sistema" 
          style={{ 
            marginTop: 32, 
            width: '100%',
            padding: '12px 16px',
            background: 'var(--color-danger)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Sair
        </button>
      </aside>
    </>
  );
};

export default Sidebar; 