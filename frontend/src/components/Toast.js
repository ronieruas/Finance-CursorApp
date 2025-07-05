import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/global.css';

function Toast({ show, message, type = 'success', onClose, duration = 3000 }) {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, duration);
      const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [show, onClose, duration]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 9999,
            background: type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-danger)' : 'var(--color-warning)',
            color: '#fff',
            padding: '16px 32px',
            borderRadius: 12,
            boxShadow: '0 4px 24px #0002',
            fontWeight: 600,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'relative',
            overflow: 'hidden',
          }}
          onClick={onClose}
        >
          {message}
          <span style={{ marginLeft: 16, cursor: 'pointer', fontWeight: 700 }}>&times;</span>
          <motion.div
            style={{
              position: 'absolute',
              left: 0, bottom: 0, height: 4, width: '100%',
              background: 'rgba(255,255,255,0.4)',
            }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast; 