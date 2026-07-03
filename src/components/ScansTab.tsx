import React from 'react';
import { motion } from 'motion/react';
import { ScanLine, MapPin, Activity, Leaf, WifiOff, Wifi, Cpu, Coffee, Droplet, Sprout, Wheat } from 'lucide-react';
import ScanActions from './ScanActions';
import { useApp } from '../context/AppContext';
import { useImageBlob } from '../hooks/useImageBlob';
import { type ScanResult } from '../services/database';

interface ScanCardProps {
  scan: ScanResult;
  cropIcon: (crop: string) => React.ReactNode;
  cropBgColor: (crop: string) => string;
  severityColor: (s: string) => string;
  formatDate: (ts: number) => string;
  key?: React.Key | string | number;
}

function ScanCard({ scan, cropIcon, cropBgColor, severityColor, formatDate }: ScanCardProps) {
  const blobUrl = useImageBlob(scan.id);
  const displayUrl = blobUrl || scan.imagePath;

  return (
    <div className="min-w-[160px] bg-white rounded-[20px] p-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#1B4332]/5 flex-shrink-0">
      <div className="w-full h-28 rounded-[12px] mb-3 bg-gradient-to-br from-[#D8F3DC] to-[#95D5B2] flex items-center justify-center overflow-hidden">
        {displayUrl ? (
          <img src={displayUrl} alt={scan.diseaseName} className="w-full h-full object-cover" />
        ) : (
          <Leaf className="w-8 h-8 text-[#1B4332]/30" />
        )}
      </div>
      {/* Auto-detected crop badge */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${cropBgColor(scan.cropType)}`}>
          {cropIcon(scan.cropType)}
          {scan.cropType}
        </span>
        <span className={`ml-auto w-2 h-2 rounded-full ${severityColor(scan.severity)}`}></span>
      </div>
      <h4 className="font-bold text-sm truncate">{scan.diseaseName}</h4>
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-[#1B4332]/50 font-medium">{formatDate(scan.timestamp)}</p>
        <p className="text-[10px] font-bold text-[#1B4332]/40">{Math.round(scan.confidenceScore * 100)}%</p>
      </div>
    </div>
  );
}

export default function ScansTab() {
  const { scans, stats, syncStatus, scanError } = useApp();
  const displayScans = scans.slice(0, 10);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const severityColor = (s: string) => {
    if (s === 'Critical') return 'bg-red-500';
    if (s === 'High') return 'bg-orange-500';
    if (s === 'Medium') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const cropIcon = (crop: string) => {
    if (crop === 'Cocoa') return <Leaf className="w-4 h-4 text-[#5A3A22]" />;
    if (crop === 'Coffee') return <Coffee className="w-4 h-4 text-[#6F4E37]" />;
    if (crop === 'Tomato') return <Droplet className="w-4 h-4 text-[#FF6347]" />;
    if (crop === 'Banana') return <Sprout className="w-4 h-4 text-[#E4B800]" />;
    if (crop === 'Maize') return <Wheat className="w-4 h-4 text-[#E8A000]" />;
    return <Leaf className="w-4 h-4 text-[#1B4332]" />;
  };

  const cropBgColor = (crop: string) => {
    if (crop === 'Cocoa') return 'bg-[#5A3A22]/10 text-[#5A3A22]';
    if (crop === 'Coffee') return 'bg-[#6F4E37]/10 text-[#6F4E37]';
    if (crop === 'Tomato') return 'bg-[#FF6347]/10 text-[#FF6347]';
    if (crop === 'Banana') return 'bg-[#E4B800]/10 text-[#E4B800]';
    if (crop === 'Maize') return 'bg-[#E8A000]/10 text-[#E8A000]';
    return 'bg-[#1B4332]/10 text-[#1B4332]';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto hide-scrollbar pb-24"
    >
      <div className="p-6 pt-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Diagnostic Hub</h1>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#1B4332]/50">
            {syncStatus.isOnline ? (
              <><Wifi className="w-3.5 h-3.5 text-green-500" /> Online</>
            ) : (
              <><WifiOff className="w-3.5 h-3.5 text-red-400" /> Offline</>
            )}
          </div>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1B4332]/5">
            <div className="w-10 h-10 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 text-[#1B4332]" />
            </div>
            <p className="text-sm text-[#1B4332]/60 font-medium">Active Plots</p>
            <p className="text-2xl font-bold mt-1">{stats.activePlots}</p>
          </div>
          <div className="bg-white p-4 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1B4332]/5">
            <div className="w-10 h-10 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-3">
              <Activity className="w-5 h-5 text-[#1B4332]" />
            </div>
            <p className="text-sm text-[#1B4332]/60 font-medium">Health Index</p>
            <p className="text-2xl font-bold mt-1">{stats.healthIndex}%</p>
          </div>
        </div>

        {/* AI Auto-Detection Panel — NO manual selector */}
        <div className="relative rounded-[24px] p-6 overflow-hidden shadow-[0_8px_30px_rgb(27,67,50,0.08)] bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-6 h-6 text-[#95D5B2]" />
              <h2 className="font-semibold text-lg">AI Auto-Detection</h2>
              <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full font-bold">{stats.totalScans} scans</span>
            </div>

            {/* Auto-detected crop breakdown */}
            {Object.keys(stats.cropCounts).length > 0 ? (
              <div className="flex gap-3 mb-4 overflow-x-auto hide-scrollbar">
                {Object.entries(stats.cropCounts).map(([crop, count]) => (
                  <div key={crop} className="flex-1 min-w-[70px] bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      {cropIcon(crop)}
                      <span className="text-xs font-bold text-white/90">{crop}</span>
                    </div>
                    <p className="text-lg font-bold">{count as number}</p>
                    <p className="text-[10px] text-white/50 uppercase">scans</p>
                  </div>
                ))}
              </div>
            ) : null}

            <p className="text-sm text-white/80 text-center font-medium">
              Upload or capture any Cocoa, Coffee, Tomato, Banana, or Maize plant photo. The AI automatically identifies the crop and diagnoses disease.
            </p>
          </div>
        </div>

        {scanError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium shadow-sm"
          >
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold">Error:</span>
              <span>{scanError}</span>
            </div>
          </motion.div>
        )}

        <ScanActions />

        {/* Recent Scans — from DB */}
        <div className="mt-8">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-lg">Recent Scans</h3>
            {scans.length > 0 && (
              <span className="text-sm text-[#1B4332]/60 font-bold">{scans.length} total</span>
            )}
          </div>

          {displayScans.length === 0 ? (
            <div className="bg-white/50 rounded-[20px] p-8 text-center border border-dashed border-[#1B4332]/10">
              <ScanLine className="w-10 h-10 text-[#1B4332]/20 mx-auto mb-3" />
              <p className="text-sm text-[#1B4332]/50 font-medium">No scans yet. Upload or capture a plant photo — the AI will identify the crop automatically.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
              {displayScans.map((scan) => (
                <ScanCard
                  key={scan.id}
                  scan={scan}
                  cropIcon={cropIcon}
                  cropBgColor={cropBgColor}
                  severityColor={severityColor}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pending Sync */}
        {syncStatus.pendingCount > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <p className="text-xs text-amber-700 font-medium">{syncStatus.pendingCount} scan(s) pending sync</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
