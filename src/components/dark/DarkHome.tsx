import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Leaf, Coffee, Droplet, Sprout, Wheat, Activity, ScanLine, ShieldCheck, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ThemeToggle from '../ThemeToggle';
import ScanActions from '../ScanActions';
import Reveal3D from './Reveal3D';

const CROPS = [
  { name: 'Cocoa',  icon: Leaf,   count: 10, tint: '#C6996B', note: 'Black Pod thrives in heavy rains.' },
  { name: 'Coffee', icon: Coffee, count: 10, tint: '#C99A6A', note: 'Leaf Rust attacks the undersides.' },
  { name: 'Tomato', icon: Droplet,count: 20, tint: '#F0846A', note: 'Early Blight loves warm, wet air.' },
  { name: 'Banana', icon: Sprout, count: 9,  tint: '#E4C55A', note: 'Sigatoka demands strict sanitation.' },
  { name: 'Maize',  icon: Wheat,  count: 8,  tint: '#E8B54A', note: 'Watch for Fall Armyworm damage.' },
];

export default function DarkHome() {
  const { stats, scans } = useApp();
  const lastScan = scans[0];
  const scrollRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll({ container: scrollRef });
  // Parallax: hero art drifts up and fades; title layer moves slower.
  const heroY   = useTransform(scrollY, [0, 300], [0, -80]);
  const heroFade= useTransform(scrollY, [0, 240], [1, 0]);
  const glowY   = useTransform(scrollY, [0, 400], [0, 120]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <motion.div
      ref={scrollRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto hide-scrollbar pb-28 relative bg-[#07100C] text-white"
    >
      {/* Ambient moving glows */}
      <motion.div
        style={{ y: glowY }}
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#D4AF37]/10 blur-3xl"
      />
      <motion.div
        style={{ y: glowY }}
        className="pointer-events-none absolute top-40 -left-24 w-72 h-72 rounded-full bg-[#1B4332]/40 blur-3xl"
      />

      {/* ── Cinematic hero ── */}
      <div className="relative h-[300px] overflow-hidden">
        <motion.div
          style={{ y: heroY, opacity: heroFade }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#12241B] via-[#0B1611] to-[#07100C]" />
          {/* golden orbital rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-20 right-1/2 translate-x-1/2 w-[420px] h-[420px] rounded-full border border-[#D4AF37]/15"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-10 right-1/2 translate-x-1/2 w-[300px] h-[300px] rounded-full border border-[#95D5B2]/10"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-[#F5D77E] to-[#C9A227] flex items-center justify-center shadow-[0_0_60px_rgba(212,175,55,0.35)]"
            >
              <Leaf className="w-14 h-14 text-[#07100C]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Top bar with greeting + toggle */}
        <div className="relative z-10 flex justify-between items-start p-6 pt-12">
          <div>
            <p className="text-xs font-medium text-[#D4AF37]/80 tracking-wide uppercase">{greeting}</p>
            <h1 className="text-3xl font-bold tracking-tight mt-1 bg-gradient-to-r from-white to-[#95D5B2] bg-clip-text text-transparent">
              Yannick
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Fade to page */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#07100C] to-transparent" />
      </div>

      <div className="relative z-10 px-6 -mt-4">
        {/* Health ribbon */}
        <Reveal3D root={scrollRef} tilt="up">
          <div className="rounded-[26px] p-[1px] bg-gradient-to-r from-[#D4AF37]/60 via-[#95D5B2]/30 to-transparent">
            <div className="rounded-[25px] bg-[#0C1712]/90 backdrop-blur-xl px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#F5D77E]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Farm Health Index</p>
                <p className="text-2xl font-bold text-white">{stats.healthIndex}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Status</p>
                <p className="text-sm font-bold text-[#95D5B2]">Monitored</p>
              </div>
            </div>
          </div>
        </Reveal3D>

        {/* Stat trio with 3D reveal */}
        {stats.totalScans > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Scans', value: stats.totalScans, icon: ScanLine },
              { label: 'Plots', value: stats.activePlots, icon: Activity },
              { label: 'Crops', value: `${Object.keys(stats.cropCounts).length}/5`, icon: Leaf },
            ].map((s, i) => (
              <Reveal3D key={s.label} root={scrollRef} delay={i * 0.08} tilt={i === 0 ? 'left' : i === 2 ? 'right' : 'up'}>
                <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4 text-center backdrop-blur-sm">
                  <s.icon className="w-5 h-5 text-[#D4AF37] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mt-1">{s.label}</p>
                </div>
              </Reveal3D>
            ))}
          </div>
        )}

        {/* Last diagnosis */}
        {lastScan && (
          <Reveal3D root={scrollRef} className="mt-6" tilt="up">
            <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#14241C] to-[#0B1712] border border-[#D4AF37]/20 p-5">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#D4AF37]/10 blur-2xl" />
              <p className="text-[10px] uppercase tracking-wider text-[#D4AF37]/80 font-bold mb-2">Last Diagnosis</p>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">{lastScan.diseaseName}</h3>
                  <p className="text-sm text-white/50 mt-0.5">{lastScan.cropType} • {Math.round(lastScan.confidenceScore * 100)}% confidence</p>
                </div>
                <span className={`w-3 h-3 rounded-full animate-pulse ${
                  lastScan.severity === 'Critical' ? 'bg-red-400' :
                  lastScan.severity === 'High' ? 'bg-orange-400' :
                  lastScan.severity === 'Medium' ? 'bg-yellow-400' : 'bg-[#95D5B2]'
                }`} />
              </div>
            </div>
          </Reveal3D>
        )}

        {/* Scan actions */}
        <Reveal3D root={scrollRef} className="mt-6" tilt="up">
          <ScanActions />
        </Reveal3D>

        {/* About */}
        <Reveal3D root={scrollRef} className="mt-9" tilt="up">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#F5D77E] to-[#C9A227]" />
            About AgroPulse
          </h2>
          <div className="rounded-[24px] bg-white/[0.03] border border-white/10 p-5">
            <p className="text-sm text-white/70 leading-relaxed">
              An offline-first AI diagnostician for <span className="text-[#D4AF37] font-semibold">Cocoa, Coffee, Tomato, Banana</span> and <span className="text-[#D4AF37] font-semibold">Maize</span>. Point your camera at a leaf — the on-device model identifies the crop and its disease in milliseconds, with a full treatment roadmap.
            </p>
          </div>
        </Reveal3D>

        {/* Crop knowledge base — cinematic 3D stack */}
        <div className="mt-9">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#F5D77E] to-[#C9A227]" />
            Crop Knowledge Base
          </h2>
          <div className="space-y-4">
            {CROPS.map((c, i) => (
              <Reveal3D key={c.name} root={scrollRef} delay={(i % 2) * 0.06} tilt={i % 2 === 0 ? 'left' : 'right'}>
                <div className="group relative overflow-hidden rounded-[22px] bg-white/[0.04] border border-white/10 p-4 flex gap-4 items-center hover:border-[#D4AF37]/40 transition-colors">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${c.tint}1f`, boxShadow: `0 0 24px ${c.tint}22` }}
                  >
                    <c.icon className="w-8 h-8" style={{ color: c.tint }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-base">{c.name}</h3>
                      <span className="text-[10px] font-bold text-[#D4AF37]/70">{c.count} diseases</span>
                    </div>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed">{c.note}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#D4AF37] transition-colors" />
                </div>
              </Reveal3D>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-white/25 mt-10 tracking-widest uppercase">AgroPulse · Offline AI</p>
      </div>
    </motion.div>
  );
}
