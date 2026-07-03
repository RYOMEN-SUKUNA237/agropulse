import React, { useState } from 'react';
import { Home, ScanLine, Map as MapIcon, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from './context/AppContext';
import { useTheme } from './context/ThemeContext';
import HomeTab from './components/HomeTab';
import ScansTab from './components/ScansTab';
import MapTab from './components/MapTab';
import LibraryTab from './components/LibraryTab';
import ResultScreen from './components/ResultScreen';
import DarkExperience from './components/dark/DarkExperience';

export default function App() {
  const { lastResult, clearResult, scanError, isScanning } = useApp();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('home');

  // Dark mode is a completely separate, self-contained experience.
  if (theme === 'dark') return <DarkExperience />;

  const currentScreen = lastResult ? 'result' : 'main';

  return (
    <div className="min-h-screen bg-[#F9FBF9] text-[#1B4332] font-sans flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl overflow-hidden flex flex-col">

        {/* Error banner */}
        <AnimatePresence>
          {scanError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-12 left-6 right-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between z-[60]"
            >
              <span className="text-xs font-semibold">{scanError}</span>
              <button onClick={clearResult} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-screen scanning overlay — shown while model runs inference */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              key="scanning-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/96 backdrop-blur-sm"
            >
              {/* Pulsing rings */}
              <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-32 h-32 rounded-full bg-[#1B4332]/10"
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                  className="absolute w-32 h-32 rounded-full bg-[#1B4332]/15"
                />
                <div className="w-24 h-24 rounded-full bg-[#D8F3DC] border-4 border-white shadow-lg flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  >
                    <ScanLine className="w-10 h-10 text-[#1B4332]" />
                  </motion.div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#1B4332] mb-2">Analyzing Leaf</h2>
              <p className="text-sm text-[#1B4332]/60 mb-8 text-center max-w-[220px] leading-relaxed">
                AI is identifying disease patterns…
              </p>

              {/* Shimmer progress bar */}
              <div className="w-48 h-1.5 bg-[#D8F3DC] rounded-full overflow-hidden">
                <motion.div
                  className="h-full w-24 bg-gradient-to-r from-transparent via-[#1B4332] to-transparent rounded-full"
                  animate={{ x: ['-96px', '192px'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content / Result screen */}
        <AnimatePresence mode="wait">
          {currentScreen === 'main' ? (
            <React.Fragment key="main">
              {activeTab === 'home' && <HomeTab />}
              {activeTab === 'scans' && <ScansTab />}
              {activeTab === 'map' && <MapTab />}
              {activeTab === 'library' && <LibraryTab />}
            </React.Fragment>
          ) : (
            <ResultScreen onBack={clearResult} />
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        {currentScreen === 'main' && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#1B4332]/5 px-6 py-4 pb-safe flex justify-between items-center z-40">
            {[
              { id: 'home', icon: Home, label: 'Home' },
              { id: 'scans', icon: ScanLine, label: 'Scans' },
              { id: 'map', icon: MapIcon, label: 'Map' },
              { id: 'library', icon: BookOpen, label: 'Library' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 min-w-[64px] ${isActive ? 'text-[#1B4332]' : 'text-[#1B4332]/40'}`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-[#D8F3DC]' : 'bg-transparent'}`}>
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
