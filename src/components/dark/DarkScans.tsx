import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ScanLine, Cpu, Wifi, WifiOff, Leaf, Coffee, Droplet, Sprout, Wheat, MapPin, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useImageBlob } from '../../hooks/useImageBlob';
import { type ScanResult } from '../../services/database';
import ScanActions from '../ScanActions';
import Reveal3D from './Reveal3D';

const cropIcon = (crop: string) => {
  if (crop === 'Cocoa') return <Leaf className="w-4 h-4 text-[#C6996B]" />;
  if (crop === 'Coffee') return <Coffee className="w-4 h-4 text-[#C99A6A]" />;
  if (crop === 'Tomato') return <Droplet className="w-4 h-4 text-[#F0846A]" />;
  if (crop === 'Banana') return <Sprout className="w-4 h-4 text-[#E4C55A]" />;
  if (crop === 'Maize') return <Wheat className="w-4 h-4 text-[#E8B54A]" />;
  return <Leaf className="w-4 h-4 text-[#95D5B2]" />;
};

const severityDot = (s: string) =>
  s === 'Critical' ? 'bg-red-400' : s === 'High' ? 'bg-orange-400' : s === 'Medium' ? 'bg-yellow-400' : 'bg-[#95D5B2]';

function DarkScanCard({ scan }: { scan: ScanResult }) {
  const blobUrl = useImageBlob(scan.id);
  const displayUrl = blobUrl || scan.imagePath;
  return (
    <div className="min-w-[160px] rounded-[20px] p-3 bg-white/[0.04] border border-white/10 flex-shrink-0">
      <div className="w-full h-28 rounded-[12px] mb-3 bg-gradient-to-br from-[#12241B] to-[#0B1611] flex items-center justify-center overflow-hidden">
        {displayUrl ? (
          <img src={displayUrl} alt={scan.diseaseName} className="w-full h-full object-cover" />
        ) : (
          <Leaf className="w-8 h-8 text-white/20" />
        )}
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-white/5 text-white/70">
          {cropIcon(scan.cropType)} {scan.cropType}
        </span>
        <span className={`ml-auto w-2 h-2 rounded-full ${severityDot(scan.severity)}`} />
      </div>
      <h4 className="font-bold text-sm truncate text-white">{scan.diseaseName}</h4>
      <p className="text-[10px] font-bold text-[#D4AF37]/70 mt-1">{Math.round(scan.confidenceScore * 100)}% confidence</p>
    </div>
  );
}

export default function DarkScans() {
  const { scans, stats, syncStatus } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayScans = scans.slice(0, 10);

  return (
    <motion.div
      ref={scrollRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto hide-scrollbar pb-28 bg-[#07100C] text-white"
    >
      <div className="p-6 pt-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-[#95D5B2] bg-clip-text text-transparent">
            Diagnostic Hub
          </h1>
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/50">
            {syncStatus.isOnline
              ? <><Wifi className="w-3.5 h-3.5 text-[#95D5B2]" /> Online</>
              : <><WifiOff className="w-3.5 h-3.5 text-red-400" /> Offline</>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Active Plots', value: stats.activePlots, icon: MapPin },
            { label: 'Health Index', value: `${stats.healthIndex}%`, icon: Activity },
          ].map((s, i) => (
            <Reveal3D key={s.label} root={scrollRef} delay={i * 0.08} tilt={i === 0 ? 'left' : 'right'}>
              <div className="rounded-[24px] bg-white/[0.04] border border-white/10 p-4">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 flex items-center justify-center mb-3">
                  <s.icon className="w-5 h-5 text-[#F5D77E]" />
                </div>
                <p className="text-sm text-white/50 font-medium">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
            </Reveal3D>
          ))}
        </div>

        {/* AI panel */}
        <Reveal3D root={scrollRef} tilt="up">
          <div className="relative overflow-hidden rounded-[26px] p-[1px] bg-gradient-to-br from-[#D4AF37]/50 via-[#95D5B2]/20 to-transparent">
            <div className="rounded-[25px] bg-[#0B1611]/95 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-6 h-6 text-[#F5D77E]" />
                <h2 className="font-semibold text-lg">AI Auto-Detection</h2>
                <span className="ml-auto text-xs bg-white/10 px-2 py-1 rounded-full font-bold">{stats.totalScans} scans</span>
              </div>
              {Object.keys(stats.cropCounts).length > 0 && (
                <div className="flex gap-3 mb-4 overflow-x-auto hide-scrollbar">
                  {Object.entries(stats.cropCounts).map(([crop, count]) => (
                    <div key={crop} className="flex-1 min-w-[70px] bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        {cropIcon(crop)}<span className="text-xs font-bold text-white/80">{crop}</span>
                      </div>
                      <p className="text-lg font-bold">{count as number}</p>
                      <p className="text-[10px] text-white/40 uppercase">scans</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-white/60 text-center font-medium">
                Capture or upload any Cocoa, Coffee, Tomato, Banana, or Maize leaf. The AI identifies the crop and diagnoses disease automatically.
              </p>
            </div>
          </div>
        </Reveal3D>

        <Reveal3D root={scrollRef} className="mt-2" tilt="up">
          <ScanActions />
        </Reveal3D>

        {/* Recent scans */}
        <div className="mt-8">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-lg">Recent Scans</h3>
            {scans.length > 0 && <span className="text-sm text-white/50 font-bold">{scans.length} total</span>}
          </div>
          {displayScans.length === 0 ? (
            <div className="rounded-[20px] p-8 text-center border border-dashed border-white/10 bg-white/[0.02]">
              <ScanLine className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">No scans yet. Capture a leaf and the AI will identify the crop automatically.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
              {displayScans.map(scan => <DarkScanCard key={scan.id} scan={scan} />)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
