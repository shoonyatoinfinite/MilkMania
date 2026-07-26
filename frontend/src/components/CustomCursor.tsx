import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Disable custom cursor on touch interfaces
    const checkTouch = () => {
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(coarsePointer);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);

    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = (e: MouseEvent) => {
      setClicked(true);
      const newRipple = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY
      };
      setRipples(prev => [...prev, newRipple]);
    };

    const handleMouseUp = () => {
      setClicked(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('resize', checkTouch);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobile]);

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples(prev => prev.slice(1));
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  if (isMobile) return null;

  return (
    <>
      {/* Redesigned Fluid Glassy Circle Cursor */}
      <motion.div
        className="fixed top-0 left-0 w-7 h-7 pointer-events-none z-[9999] rounded-full border border-dairy-sky/60 bg-white/10 shadow-sm"
        style={{
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          x: position.x,
          y: position.y,
          scale: clicked ? 0.75 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 350,
          mass: 0.15
        }}
      >
        {/* Soft blue dot center */}
        <div className="absolute inset-2.5 bg-dairy-sky rounded-full opacity-60" />
      </motion.div>

      {/* Ripple Ring effects on click */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="fixed top-0 left-0 border-2 border-dairy-sky/30 pointer-events-none z-[9998] rounded-full"
            style={{
              x: ripple.x,
              y: ripple.y,
              transform: 'translate(-50%, -50%)',
              width: 8,
              height: 8,
            }}
            initial={{ scale: 0.1, opacity: 0.8 }}
            animate={{ scale: 8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </>
  );
};
export default CustomCursor;
