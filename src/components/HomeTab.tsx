import React from 'react';
import { motion } from 'motion/react';
import WeatherWidget from './WeatherWidget';
import ScanActions from './ScanActions';
import { Info, Leaf, Coffee, Droplet, TrendingUp, Sprout, Wheat } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ThemeToggle from './ThemeToggle';

export default function HomeTab() {
  const { stats, scans } = useApp();
  const lastScan = scans[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto hide-scrollbar pb-24"
    >
      <div className="p-6 pt-12 bg-gradient-to-b from-[#D8F3DC]/50 to-transparent">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-medium text-[#1B4332]/60">{getGreeting()},</p>
            <h1 className="text-2xl font-bold tracking-tight">Yannick</h1>
          </div>
          <div className="flex items-center gap-2">
            {stats.totalScans > 0 && (
              <div className="bg-[#D8F3DC] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#1B4332]" />
                <span className="text-xs font-bold text-[#1B4332]">{stats.healthIndex}% Health</span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        <motion.div layout>
          <WeatherWidget />
        </motion.div>

        {/* Quick Stats */}
        {stats.totalScans > 0 && (
          <motion.div layout className="mt-6 grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-[#1B4332]/5 text-center">
              <p className="text-xl font-bold">{stats.totalScans}</p>
              <p className="text-[10px] text-[#1B4332]/50 font-semibold mt-0.5">TOTAL SCANS</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-[#1B4332]/5 text-center">
              <p className="text-xl font-bold">{stats.activePlots}</p>
              <p className="text-[10px] text-[#1B4332]/50 font-semibold mt-0.5">PLOTS</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-[#1B4332]/5 text-center">
              <p className="text-xl font-bold">{Object.keys(stats.cropCounts).length}/5</p>
              <p className="text-[10px] text-[#1B4332]/50 font-semibold mt-0.5">CROPS</p>
            </div>
          </motion.div>
        )}

        {/* Last Scan Summary */}
        {lastScan && (
          <motion.div layout className="mt-6">
            <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] rounded-[20px] p-4 text-white">
              <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold mb-2">Last Diagnosis</p>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{lastScan.diseaseName}</h3>
                  <p className="text-sm text-white/70">{lastScan.cropType} • {Math.round(lastScan.confidenceScore * 100)}% confidence</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${lastScan.severity === 'Critical' ? 'bg-red-400' :
                    lastScan.severity === 'High' ? 'bg-orange-400' :
                      lastScan.severity === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'
                  } animate-pulse`}></div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div layout className="mt-8">
          <h2 className="font-bold text-lg mb-4">About AgroPulse</h2>
          <div className="bg-white p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1B4332]/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-[#1B4332]" />
              </div>
              <div>
                <p className="text-sm text-[#1B4332]/80 leading-relaxed font-medium">
                  AgroPulse is your advanced AI diagnostic tool for monitoring and treating crop diseases. We specialize in Cocoa, Coffee, Tomato, Banana, and Maize, providing real-time analysis and actionable treatment roadmaps.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div layout className="mt-8">
          <h2 className="font-bold text-lg mb-4">Crop Knowledge Base</h2>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-[20px] shadow-sm border border-[#1B4332]/5 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#5A3A22]/10 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-8 h-8 text-[#5A3A22]" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[#1B4332] text-base">Cocoa</h3>
                  <span className="text-[10px] font-bold text-[#1B4332]/40">10 diseases</span>
                </div>
                <p className="text-xs text-[#1B4332]/60 mt-1 leading-relaxed">Requires high humidity and shade. Watch out for Black Pod disease during heavy rains.</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-[20px] shadow-sm border border-[#1B4332]/5 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#6F4E37]/10 flex items-center justify-center flex-shrink-0">
                <Coffee className="w-8 h-8 text-[#6F4E37]" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[#1B4332] text-base">Coffee</h3>
                  <span className="text-[10px] font-bold text-[#1B4332]/40">10 diseases</span>
                </div>
                <p className="text-xs text-[#1B4332]/60 mt-1 leading-relaxed">Thrives in cooler altitudes. Leaf Rust is the primary threat; monitor leaf undersides.</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-[20px] shadow-sm border border-[#1B4332]/5 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FF6347]/10 flex items-center justify-center flex-shrink-0">
                <Droplet className="w-8 h-8 text-[#FF6347]" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[#1B4332] text-base">Tomato</h3>
                  <span className="text-[10px] font-bold text-[#1B4332]/40">20 diseases</span>
                </div>
                <p className="text-xs text-[#1B4332]/60 mt-1 leading-relaxed">Needs consistent watering. Early Blight and Septoria are common in warm, wet conditions.</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-[20px] shadow-sm border border-[#1B4332]/5 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#E4B800]/10 flex items-center justify-center flex-shrink-0">
                <Sprout className="w-8 h-8 text-[#E4B800]" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[#1B4332] text-base">Banana</h3>
                  <span className="text-[10px] font-bold text-[#1B4332]/40">9 diseases</span>
                </div>
                <p className="text-xs text-[#1B4332]/60 mt-1 leading-relaxed">Thrives in warm, tropical areas. Sigatoka and Panama disease require strict quarantine and sanitation.</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-[20px] shadow-sm border border-[#1B4332]/5 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#E8A000]/10 flex items-center justify-center flex-shrink-0">
                <Wheat className="w-8 h-8 text-[#E8A000]" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[#1B4332] text-base">Maize</h3>
                  <span className="text-[10px] font-bold text-[#1B4332]/40">8 diseases</span>
                </div>
                <p className="text-xs text-[#1B4332]/60 mt-1 leading-relaxed">Requires well-drained soil. Watch for Fall Armyworm feeding damage and Gray Leaf Spot streaks.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div layout>
          <ScanActions />
        </motion.div>
      </div>
    </motion.div>
  );
}
