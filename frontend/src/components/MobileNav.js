import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function MobileNav() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 700 : false)
  const location = useLocation()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 700)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (!isMobile) return null

  const items = [
    { to: '/resumo', label: 'Resumo', icon: '🏠' },
    { to: '/accounts', label: 'Contas', icon: '🏦' },
    { to: '/expenses', label: 'Despesas', icon: '💸' },
    { to: '/incomes', label: 'Receitas', icon: '💰' },
    { to: '/creditCards', label: 'Cartões', icon: '💳' }
  ]

  return (
    <nav
      className="mobile-nav"
      aria-label="Navegação inferior"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: '#ffffffee',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000
      }}
    {
      ...({})
    }
    >
      {items.map((item) => {
        const active = location.pathname === item.to
        return (
          <Link
            key={item.to}
            to={item.to}
            style={{
              textDecoration: 'none',
              color: active ? '#2563eb' : '#555',
              fontWeight: active ? 700 : 500,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 12 }}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

