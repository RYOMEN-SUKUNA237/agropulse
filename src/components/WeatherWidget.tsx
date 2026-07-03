import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudRain, Thermometer, Wind, Sun, ChevronDown, ChevronUp } from 'lucide-react';

export default function WeatherWidget() {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div 
      layout
      onClick={() => setExpanded(!expanded)}
      className="bg-white/80 backdrop-blur-md rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1B4332]/5 overflow-hidden cursor-pointer"
    >
      <motion.div layout className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-5 h-5 text-[#95D5B2]" />
            <span className="text-base font-bold">28°C</span>
          </div>
          <div className="w-px h-5 bg-[#1B4332]/10"></div>
          <div className="flex items-center gap-1.5">
            <CloudRain className="w-5 h-5 text-[#95D5B2]" />
            <span className="text-base font-bold">74%</span>
          </div>
        </div>
        <motion.div layout>
          {expanded ? <ChevronUp className="w-5 h-5 text-[#1B4332]/40" /> : <ChevronDown className="w-5 h-5 text-[#1B4332]/40" />}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-5"
          >
            <div className="pt-3 border-t border-[#1B4332]/10">
              <div className="flex justify-between items-center mb-5 mt-2">
                <div>
                  <p className="text-xs text-[#1B4332]/60 font-medium uppercase tracking-wider mb-1">Current Status</p>
                  <p className="text-xl font-bold">Partly Cloudy</p>
                </div>
                <Sun className="w-10 h-10 text-yellow-500" />
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#F9FBF9] p-3 rounded-2xl text-center border border-[#1B4332]/5">
                  <Wind className="w-5 h-5 text-[#95D5B2] mx-auto mb-2" />
                  <p className="text-[10px] text-[#1B4332]/60 font-medium uppercase tracking-wider mb-0.5">Wind</p>
                  <p className="text-sm font-bold">12 km/h</p>
                </div>
                <div className="bg-[#F9FBF9] p-3 rounded-2xl text-center border border-[#1B4332]/5">
                  <CloudRain className="w-5 h-5 text-[#95D5B2] mx-auto mb-2" />
                  <p className="text-[10px] text-[#1B4332]/60 font-medium uppercase tracking-wider mb-0.5">Rain</p>
                  <p className="text-sm font-bold">20%</p>
                </div>
                <div className="bg-[#F9FBF9] p-3 rounded-2xl text-center border border-[#1B4332]/5">
                  <Sun className="w-5 h-5 text-[#95D5B2] mx-auto mb-2" />
                  <p className="text-[10px] text-[#1B4332]/60 font-medium uppercase tracking-wider mb-0.5">UV Index</p>
                  <p className="text-sm font-bold">High (6)</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-[#1B4332]/60 font-medium uppercase tracking-wider mb-3">3-Day Forecast</p>
                <div className="space-y-3">
                  {[
                    { day: 'Today', temp: '28° / 22°', icon: Sun, color: 'text-yellow-500' },
                    { day: 'Tomorrow', temp: '27° / 21°', icon: CloudRain, color: 'text-blue-400' },
                    { day: 'Wednesday', temp: '29° / 22°', icon: Sun, color: 'text-yellow-500' },
                  ].map((f, i) => (
                    <div key={i} className="flex justify-between items-center text-sm bg-[#F9FBF9] p-3 rounded-xl border border-[#1B4332]/5">
                      <span className="w-20 font-semibold">{f.day}</span>
                      <f.icon className={`w-5 h-5 ${f.color}`} />
                      <span className="font-bold text-[#1B4332]/80">{f.temp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
