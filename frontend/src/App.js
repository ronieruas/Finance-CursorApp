import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Incomes from './pages/Incomes';
import Expenses from './pages/Expenses';
import CreditCards from './pages/CreditCards';
import Budgets from './pages/Budgets';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import ManageUsers from './pages/ManageUsers';
import Transfers from './pages/Transfers';
import Analytics from './pages/Analytics';
import Resumo from './pages/Resumo';
import { AnimatePresence, motion } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';

function PrivateRoute({ token, children }) {
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AnimatedRoutes({ token, setToken }) {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PrivateRoute token={token}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}>
              <Dashboard token={token} />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/analytics" element={
          <PrivateRoute token={token}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}>
              <Analytics token={token} />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/resumo" element={
          <PrivateRoute token={token}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}>
              <Resumo token={token} />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/accounts" element={
          <PrivateRoute token={token}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}>
              <Accounts token={token} />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/incomes" element={
          <PrivateRoute token={token}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}>
              <Incomes token={token} />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/expenses" element={
          <PrivateRoute token={token}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}>
              <Expenses token={token} />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/creditCards" element={
          <PrivateRoute token={token}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}>
              <CreditCards token={token} />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/budgets" element={
          <PrivateRoute token={token}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}>
              <Budgets token={token} />
            </motion.div>
          </PrivateRoute>
        } />
        <Route path="/admin/change-password" element={
          <PrivateRoute token={token}>
            <ChangePassword token={token} />
          </PrivateRoute>
        } />
        <Route path="/admin/users" element={
          <PrivateRoute token={token}>
            <ManageUsers token={token} />
          </PrivateRoute>
        } />
        <Route path="/transfers" element={
          <PrivateRoute token={token}>
            <Transfers token={token} />
          </PrivateRoute>
        } />
        <Route path="/login" element={<Login setToken={setToken} />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [notifications, setNotifications] = useState([]);
  let user = null;
  if (token) {
    try {
      user = jwtDecode(token);
    } catch (e) {
      user = null;
    }
  }
  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setNotifications(data);
      } catch {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Atualiza a cada 1 min
    return () => clearInterval(interval);
  }, [token]);

  const markNotificationAsRead = async (id) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif));
    } catch {}
  };

  return (
    <Router>
      {token && <Sidebar setToken={setToken} user={user} />}
      {token && notifications.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 2000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: '#fffbe6', color: '#b8860b', border: '1px solid #ffe58f', borderRadius: 8, marginTop: 12, padding: '10px 24px', fontWeight: 500, boxShadow: '0 2px 12px #0001', pointerEvents: 'auto', cursor: 'pointer' }}>
            {notifications.filter(n => !n.read).length > 0 ? (
              <>
                <span style={{ marginRight: 8, fontWeight: 700 }}>🔔 {notifications.filter(n => !n.read).length} alerta(s):</span>
                {notifications.filter(n => !n.read).map(n => (
                  <span key={n.id} style={{ marginRight: 16, textDecoration: 'underline', cursor: 'pointer' }} onClick={() => markNotificationAsRead(n.id)}>{n.message}</span>
                ))}
              </>
            ) : (
              <span>Sem alertas de vencimento</span>
            )}
          </div>
        </div>
      )}
      <AnimatedRoutes token={token} setToken={setToken} />
    </Router>
  );
}

export default App; 