import React from 'react';
import { motion } from 'motion/react';

interface Reveal3DProps {
  children: React.ReactNode;
  /** The scrolling container (the tab's overflow-y-auto div) used as the IntersectionObserver root. */
  root: React.RefObject<HTMLElement | null>;
  className?: string;
  /** Stagger delay in seconds. */
  delay?: number;
  /** Direction of the 3D tilt as the card rises into view. */
  tilt?: 'up' | 'down' | 'left' | 'right';
}

/**
 * Scroll-driven 3D reveal. As the element enters the scroll container it
 * rises from depth with a perspective tilt, then settles flat — the core of
 * the dark theme's cinematic feel. Re-animates each time it enters view.
 */
export default function Reveal3D({ children, root, className = '', delay = 0, tilt = 'up' }: Reveal3DProps) {
  const from =
    tilt === 'up'    ? { rotateX: 22,  rotateY: 0,   y: 70,  x: 0 } :
    tilt === 'down'  ? { rotateX: -22, rotateY: 0,   y: -70, x: 0 } :
    tilt === 'left'  ? { rotateX: 0,   rotateY: -28, y: 30,  x: -40 } :
                       { rotateX: 0,   rotateY: 28,  y: 30,  x: 40 };

  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        initial={{ opacity: 0, ...from }}
        whileInView={{ opacity: 1, rotateX: 0, rotateY: 0, y: 0, x: 0 }}
        viewport={{ root, amount: 0.25, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
