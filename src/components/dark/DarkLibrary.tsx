import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, AlertCircle, Leaf, Coffee, Droplet, Sprout, Wheat } from 'lucide-react';
import { ALL_DISEASES, type CropType } from '../../data/diseases';
import ScanActions from '../ScanActions';
import Reveal3D from './Reveal3D';

const cropIcon = (crop: string) => {
  if (crop === 'Cocoa') return <Leaf className="w-6 h-6 text-[#C6996B]" />;
  if (crop === 'Coffee') return <Coffee className="w-6 h-6 text-[#C99A6A]" />;
  if (crop === 'Tomato') return <Droplet className="w-6 h-6 text-[#F0846A]" />;
  if (crop === 'Banana') return <Sprout className="w-6 h-6 text-[#E4C55A]" />;
  if (crop === 'Maize') return <Wheat className="w-6 h-6 text-[#E8B54A]" />;
  return <Leaf className="w-6 h-6 text-[#95D5B2]" />;
};

const riskColor = (risk: string) =>
  risk === 'Critical' ? 'bg-red-500/15 text-red-300 border-red-400/20' :
  risk === 'High' ? 'bg-orange-500/15 text-orange-300 border-orange-400/20' :
  risk === 'Medium' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-400/20' :
  'bg-emerald-500/15 text-emerald-300 border-emerald-400/20';

export default function DarkLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState<CropType | 'All'>('All');
  const scrollRef = useRef<HTMLDivElement>(null);

  const realCount = ALL_DISEASES.filter(d => d.name !== 'Healthy').length;

  const filtered = useMemo(() => ALL_DISEASES.filter(d => {
    if (d.name === 'Healthy') return false;
    const matchesCrop = cropFilter === 'All' || d.crop === cropFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' ||
      d.name.toLowerCase().includes(q) || d.crop.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q) || d.scientificName.toLowerCase().includes(q);
    return matchesCrop && matchesSearch;
  }), [searchQuery, cropFilter]);

  const filters: (CropType | 'All')[] = ['All', 'Cocoa', 'Coffee', 'Tomato', 'Banana', 'Maize'];

  return (
    <motion.div
      ref={scrollRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto hide-scrollbar pb-28 bg-[#07100C] text-white"
    >
      <div className="p-6 pt-12">
        <h1 className="text-2xl font-bold tracking-tight mb-1 bg-gradient-to-r from-white to-[#95D5B2] bg-clip-text text-transparent">
          Disease Library
        </h1>
        <p className="text-sm text-white/50 mb-6 font-medium">{filtered.length} of {realCount} diseases • 5 crops</p>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="text"
            placeholder="Search diseases, crops, types..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/10 rounded-[20px] py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {filters.map(f => {
            const count = f === 'All' ? realCount : ALL_DISEASES.filter(d => d.crop === f && d.name !== 'Healthy').length;
            const active = cropFilter === f;
            return (
              <button
                key={f}
                onClick={() => setCropFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-gradient-to-r from-[#F5D77E] to-[#C9A227] text-[#07100C] border-transparent shadow-[0_0_18px_rgba(212,175,55,0.35)]'
                    : 'bg-white/[0.04] text-white/60 border-white/10'
                }`}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>

        <div className="space-y-3 mb-8">
          {filtered.map((d, i) => (
            <Reveal3D key={d.id} root={scrollRef} delay={(i % 3) * 0.05} tilt={i % 2 === 0 ? 'left' : 'right'}>
              <div className="rounded-[20px] bg-white/[0.04] border border-white/10 p-4 hover:border-[#D4AF37]/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                    {cropIcon(d.crop)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-base truncate text-white">{d.name}</h3>
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ml-2 flex-shrink-0 border ${riskColor(d.risk)}`}>
                        {d.risk}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5 font-medium italic truncate">{d.scientificName}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] bg-white/[0.06] px-2 py-0.5 rounded font-bold text-white/50">{d.crop}</span>
                      <span className="text-[10px] bg-white/[0.06] px-2 py-0.5 rounded font-bold text-white/50">{d.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal3D>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No diseases match your search.</p>
          </div>
        )}

        <ScanActions />
      </div>
    </motion.div>
  );
}
