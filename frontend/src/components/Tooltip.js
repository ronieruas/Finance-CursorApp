import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Tooltip({ show, children, text }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              position: 'absolute',
              bottom: '120%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#232946',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 13,
              whiteSpace: 'nowrap',
              zIndex: 10000
            }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Tooltip; 