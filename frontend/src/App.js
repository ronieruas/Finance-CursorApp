import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Incomes from './pages/Incomes';
import Expenses from './pages/Expenses';
import CreditCards from './pages/CreditCards';
import Budgets from './pages/Budgets';
import Login from './pages/Login';
import { AnimatePresence, motion } from 'framer-motion';

function AnimatedRoutes({ token }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}><Dashboard token={token} /></motion.div>} />
        <Route path="/accounts" element={<motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}><Accounts token={token} /></motion.div>} />
        <Route path="/incomes" element={<motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}><Incomes token={token} /></motion.div>} />
        <Route path="/expenses" element={<motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}><Expenses token={token} /></motion.div>} />
        <Route path="/credit-cards" element={<motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}><CreditCards token={token} /></motion.div>} />
        <Route path="/budgets" element={<motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}><Budgets token={token} /></motion.div>} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const token = localStorage.getItem('token');
  return (
    <Router>
      {token && <Sidebar />}
      <AnimatedRoutes token={token} />
    </Router>
  );
}

export default App; 