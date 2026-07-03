import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, AlertCircle, Leaf, Coffee, Droplet, Filter } from 'lucide-react';
import ScanActions from './ScanActions';
import { ALL_DISEASES, type Disease, type CropType } from '../data/diseases';

export default function LibraryTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState<CropType | 'All'>('All');

  const filtered = useMemo(() => {
    return ALL_DISEASES.filter(d => {
      if (d.name === 'Healthy') return false; // hide healthy entries
      const matchesCrop = cropFilter === 'All' || d.crop === cropFilter;
      const matchesSearch = searchQuery === '' ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCrop && matchesSearch;
    });
  }, [searchQuery, cropFilter]);

  const riskColor = (risk: string) => {
    if (risk === 'Critical') return 'bg-red-100 text-red-600';
    if (risk === 'High') return 'bg-orange-100 text-orange-600';
    if (risk === 'Medium') return 'bg-yellow-100 text-yellow-600';
    return 'bg-green-100 text-green-600';
  };

  const cropIcon = (crop: string) => {
    if (crop === 'Cocoa') return <Leaf className="w-6 h-6 text-[#5A3A22]" />;
    if (crop === 'Coffee') return <Coffee className="w-6 h-6 text-[#6F4E37]" />;
    return <Droplet className="w-6 h-6 text-[#FF6347]" />;
  };

  const cropBg = (crop: string) => {
    if (crop === 'Cocoa') return 'bg-[#5A3A22]/10';
    if (crop === 'Coffee') return 'bg-[#6F4E37]/10';
    return 'bg-[#FF6347]/10';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto hide-scrollbar pb-24"
    >
      <div className="p-6 pt-12">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Disease Library</h1>
        <p className="text-sm text-[#1B4332]/60 mb-6 font-medium">
          {filtered.length} of {ALL_DISEASES.filter(d => d.name !== 'Healthy').length} diseases • 3 crops
        </p>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1B4332]/40" />
          <input
            type="text"
            placeholder="Search diseases, crops, types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#1B4332]/10 rounded-[20px] py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#95D5B2] shadow-sm"
          />
        </div>

        {/* Crop Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {(['All', 'Cocoa', 'Coffee', 'Tomato'] as const).map(f => (
            <button
              key={f}
              onClick={() => setCropFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${cropFilter === f
                  ? 'bg-[#1B4332] text-white shadow-md'
                  : 'bg-white text-[#1B4332]/60 border border-[#1B4332]/10'
                }`}
            >
              {f === 'All' ? `All (${ALL_DISEASES.filter(d => d.name !== 'Healthy').length})` :
                `${f} (${ALL_DISEASES.filter(d => d.crop === f && d.name !== 'Healthy').length})`}
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-8">
          {filtered.map((d) => (
            <div key={d.id} className="bg-white p-4 rounded-[20px] shadow-sm border border-[#1B4332]/5 hover:border-[#95D5B2] transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${cropBg(d.crop)} flex items-center justify-center flex-shrink-0`}>
                  {cropIcon(d.crop)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base truncate">{d.name}</h3>
                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ml-2 flex-shrink-0 ${riskColor(d.risk)}`}>
                      {d.risk}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#1B4332]/50 mt-0.5 font-medium italic truncate">{d.scientificName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-[#F9FBF9] px-2 py-0.5 rounded font-bold text-[#1B4332]/50">{d.crop}</span>
                    <span className="text-[10px] bg-[#F9FBF9] px-2 py-0.5 rounded font-bold text-[#1B4332]/50">{d.type}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-10 h-10 text-[#1B4332]/20 mx-auto mb-3" />
            <p className="text-sm text-[#1B4332]/50 font-medium">No diseases match your search.</p>
          </div>
        )}

        <ScanActions />
      </div>
    </motion.div>
  );
}
