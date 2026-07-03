import React, { useState } from 'react';
import { Home, ScanLine, Map as MapIcon, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import DarkHome from './DarkHome';
import DarkScans from './DarkScans';
import DarkMap from './DarkMap';
import DarkLibrary from './DarkLibrary';
import DarkResultScreen from './DarkResultScreen';

/**
 * Self-contained dark experience: its own shell, navigation, scanning
 * overlay and result screen. Rendered by App when theme === 'dark'.
 * Reuses all shared state/logic via useApp, so scans/diagnoses behave
 * identically to light mode — only the presentation differs.
 */
export default function DarkExperience() {
  const { lastResult, clearResult, scanError, isScanning } = useApp();
  const [activeTab, setActiveTab] = useState('home');

  const showResult = !!lastResult;

  return (
    <div className="min-h-screen bg-[#07100C] text-white font-sans flex justify-center">
      <div className="w-full max-w-md min-h-screen relative shadow-2xl overflow-hidden flex flex-col bg-[#07100C]">

        {/* Error banner */}
        <AnimatePresence>
          {scanError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-12 left-6 right-6 bg-red-500/15 border border-red-400/30 text-red-200 px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between z-[60]"
            >
              <span className="text-xs font-semibold">{scanError}</span>
              <button onClick={clearResult} className="text-red-300 font-bold ml-2">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic scanning overlay */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              key="dark-scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#07100C]/96 backdrop-blur-md"
            >
              <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-36 h-36 rounded-full bg-[#D4AF37]/15"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-32 h-32 rounded-full border border-[#D4AF37]/25"
                />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F5D77E] to-[#C9A227] shadow-[0_0_50px_rgba(212,175,55,0.4)] flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}>
                    <ScanLine className="w-10 h-10 text-[#07100C]" />
                  </motion.div>
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">Analyzing Leaf</h2>
              <p className="text-sm text-white/50 mb-8 text-center max-w-[220px] leading-relaxed">AI is identifying disease patterns…</p>
              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full w-24 bg-gradient-to-r from-transparent via-[#F5D77E] to-transparent rounded-full"
                  animate={{ x: ['-96px', '192px'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content / result */}
        <AnimatePresence mode="wait">
          {showResult ? (
            <DarkResultScreen key="result" onBack={clearResult} />
          ) : (
            <React.Fragment key="main">
              {activeTab === 'home' && <DarkHome />}
              {activeTab === 'scans' && <DarkScans />}
              {activeTab === 'map' && <DarkMap />}
              {activeTab === 'library' && <DarkLibrary />}
            </React.Fragment>
          )}
        </AnimatePresence>

        {/* Bottom nav */}
        {!showResult && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#0A130E]/90 backdrop-blur-xl border-t border-white/10 px-6 py-4 pb-safe flex justify-between items-center z-40">
            {[
              { id: 'home', icon: Home, label: 'Home' },
              { id: 'scans', icon: ScanLine, label: 'Scans' },
              { id: 'map', icon: MapIcon, label: 'Map' },
              { id: 'library', icon: BookOpen, label: 'Library' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 min-w-[64px] ${isActive ? 'text-[#F5D77E]' : 'text-white/40'}`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-[#D4AF37]/15' : 'bg-transparent'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
