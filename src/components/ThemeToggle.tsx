import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Theme toggle. Rendered top-right of the Home header in both themes.
 * Light → dark shows a gold-tinted moon; dark → light shows a warm sun.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-14 h-8 rounded-full p-1 flex items-center transition-colors duration-500 shrink-0 ${
        isDark
          ? 'bg-gradient-to-r from-[#1A130A] to-[#2A1F0E] border border-[#D4AF37]/40'
          : 'bg-[#D8F3DC] border border-[#1B4332]/10'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
          isDark
            ? 'ml-auto bg-gradient-to-br from-[#F5D77E] to-[#C9A227]'
            : 'mr-auto bg-white'
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-[#1A130A]" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-[#E8A000]" />
        )}
      </motion.span>
    </button>
  );
}
