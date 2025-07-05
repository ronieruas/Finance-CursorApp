import React, { useState } from 'react';
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
        <Route path="/credit-cards" element={
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
        <Route path="/login" element={<Login setToken={setToken} />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  let user = null;
  if (token) {
    try {
      user = jwtDecode(token);
    } catch (e) {
      user = null;
    }
  }
  return (
    <Router>
      {token && <Sidebar setToken={setToken} user={user} />}
      <AnimatedRoutes token={token} setToken={setToken} />
    </Router>
  );
}

export default App; 