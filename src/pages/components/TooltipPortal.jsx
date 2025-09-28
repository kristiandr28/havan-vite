import ReactDOM from 'react-dom';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tooltipRoot = document.getElementById('tooltip-root');

function TooltipPortal({ children, position }) {
  if (!tooltipRoot) {
    console.error("The element with id 'tooltip-root' was not found in the document.");
    return null;
  }

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed z-[9999] bg-gray-800 text-white text-xs px-3 py-1 rounded-md shadow-lg whitespace-nowrap pointer-events-none"
        style={{
          top: position.top,
          left: position.left,
          transform: `translateX(-50%)`,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>,
    tooltipRoot
  );
}

export default TooltipPortal;