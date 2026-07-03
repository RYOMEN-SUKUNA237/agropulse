import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation } from 'lucide-react';
import ScanActions from './ScanActions';

export default function MapTab() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto hide-scrollbar pb-24 flex flex-col"
    >
      <div className="p-6 pt-12 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Plots & Dealers</h1>
        <p className="text-sm text-[#1B4332]/60 mt-1 font-medium">Locate your fields and nearby agro-dealers.</p>
      </div>

      <div className="flex-1 relative min-h-[350px] mx-6 rounded-[24px] overflow-hidden shadow-sm border border-[#1B4332]/10">
        <img
          src="https://picsum.photos/seed/mapview/800/800"
          alt="Map"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[#1B4332]/10"></div>

        <div className="absolute top-1/4 left-1/3 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <MapPin className="w-6 h-6 text-[#1B4332]" />
        </div>
        <div className="absolute top-1/2 right-1/4 w-10 h-10 bg-[#95D5B2]/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
          <MapPin className="w-5 h-5 text-[#1B4332]" />
        </div>
        <div className="absolute bottom-1/3 left-1/4 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
          <MapPin className="w-4 h-4 text-[#1B4332]" />
        </div>

        <button className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-[#1B4332] hover:bg-[#F9FBF9] transition-colors">
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex-shrink-0">
        <ScanActions />
      </div>
    </motion.div>
  );
}
