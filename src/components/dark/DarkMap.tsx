import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation } from 'lucide-react';
import ScanActions from '../ScanActions';
import Reveal3D from './Reveal3D';

export default function DarkMap() {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      ref={scrollRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto hide-scrollbar pb-28 flex flex-col bg-[#07100C] text-white"
    >
      <div className="p-6 pt-12 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-[#95D5B2] bg-clip-text text-transparent">
          Plots &amp; Dealers
        </h1>
        <p className="text-sm text-white/50 mt-1 font-medium">Locate your fields and nearby agro-dealers.</p>
      </div>

      <Reveal3D root={scrollRef} className="flex-1 mx-6" tilt="up">
        <div className="relative min-h-[350px] h-full rounded-[24px] overflow-hidden border border-[#D4AF37]/20">
          <img
            src="https://picsum.photos/seed/mapview/800/800"
            alt="Map"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Night-map tint + vignette */}
          <div className="absolute inset-0 bg-[#07100C]/55 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07100C] via-transparent to-[#07100C]/40" />

          <div className="absolute top-1/4 left-1/3 w-12 h-12 bg-gradient-to-br from-[#F5D77E] to-[#C9A227] rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.5)] animate-bounce">
            <MapPin className="w-6 h-6 text-[#07100C]" />
          </div>
          <div className="absolute top-1/2 right-1/4 w-10 h-10 bg-[#95D5B2] rounded-full flex items-center justify-center shadow-lg">
            <MapPin className="w-5 h-5 text-[#07100C]" />
          </div>
          <div className="absolute bottom-1/3 left-1/4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <MapPin className="w-4 h-4 text-[#07100C]" />
          </div>

          <button className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-[#F5D77E] to-[#C9A227] rounded-full shadow-lg flex items-center justify-center text-[#07100C]">
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </Reveal3D>

      <div className="p-6 flex-shrink-0">
        <ScanActions />
      </div>
    </motion.div>
  );
}
