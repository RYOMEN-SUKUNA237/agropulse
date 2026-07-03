import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowLeft, MapPin, ChevronRight, Zap, Sparkles, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Reveal3D from './Reveal3D';

export default function DarkResultScreen({ onBack }: { onBack: () => void }) {
  const { lastResult, lastImageUrl } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const imgY     = useTransform(scrollY, [0, 300], [0, 60]);
  const imgScale = useTransform(scrollY, [0, 300], [1, 1.12]);

  if (!lastResult || !lastResult.disease) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#07100C] text-center text-white">
        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Diagnosis Error</h2>
        <p className="text-sm text-white/50 mt-2 max-w-xs">The model returned an invalid diagnosis. Please try again.</p>
        <button onClick={onBack} className="mt-6 bg-gradient-to-r from-[#F5D77E] to-[#C9A227] text-[#07100C] px-6 py-2.5 rounded-full font-bold active:scale-95 transition-transform">
          Go Back
        </button>
      </div>
    );
  }

  const { crop, cropConfidence, disease, diseaseConfidence, severity, processingTimeMs, mode, visualSymptoms, reasoning } = lastResult;
  const confidencePct = Math.round(diseaseConfidence * 100);
  const cropConfPct = Math.round(cropConfidence * 100);
  const modeLabel = mode === 'gemini_vision' ? '🤖 Gemini AI' : mode === 'tflite_local' ? '📱 Offline AI' : '⚡ Quick Scan';

  const sevColor = severity === 'Critical' ? '#F87171' : severity === 'High' ? '#FB923C' : severity === 'Medium' ? '#FACC15' : '#95D5B2';
  const cropColors: Record<string, string> = { Cocoa: '#C6996B', Coffee: '#C99A6A', Tomato: '#F0846A', Banana: '#E4C55A', Maize: '#E8B54A' };
  const cropColor = cropColors[crop] || '#95D5B2';

  const ring = (pct: number, color: string, label: string) => (
    <div className="flex-1 rounded-[24px] bg-white/[0.04] border border-white/10 p-5 flex flex-col items-center justify-center">
      <div className="relative w-20 h-20 flex items-center justify-center mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${pct}, 100`} />
        </svg>
        <span className="absolute text-lg font-bold text-white">{pct}%</span>
      </div>
      <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{label}</p>
    </div>
  );

  return (
    <motion.div
      key="dark-result"
      ref={scrollRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex-1 overflow-y-auto hide-scrollbar bg-[#07100C] text-white pb-10"
    >
      {/* Parallax image header */}
      <div className="relative h-[42vh] w-full overflow-hidden">
        <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0">
          {lastImageUrl
            ? <img src={lastImageUrl} alt="Scanned Leaf" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-[#12241B] to-[#07100C]" />}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#07100C] via-[#07100C]/30 to-black/40" />

        <button onClick={onBack} className="absolute top-12 left-6 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform">
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="absolute top-12 right-6 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
            <Zap className="w-3 h-3 text-[#F5D77E]" />
            <span className="text-[10px] font-bold text-white">{processingTimeMs}ms</span>
          </div>
          <div className="bg-[#C9A227]/80 backdrop-blur-md px-2.5 py-1 rounded-full">
            <span className="text-[9px] font-bold text-white">{modeLabel}</span>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ backgroundColor: cropColor }} className="text-[#07100C] text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
              {crop} ({cropConfPct}%)
            </span>
            <span style={{ backgroundColor: sevColor }} className="text-[#07100C] text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
              {severity}
            </span>
          </div>
          <h1 className="text-4xl font-bold drop-shadow-lg">{disease.name}</h1>
          <p className="text-white/70 text-base mt-1 font-semibold italic">{disease.scientificName}</p>
        </div>
      </div>

      <div className="px-6 -mt-2 relative z-10 space-y-4">
        {reasoning && (
          <Reveal3D root={scrollRef} tilt="up">
            <div className="rounded-[20px] p-4 bg-[#D4AF37]/[0.08] border border-[#D4AF37]/20">
              <p className="text-[10px] uppercase tracking-wider text-[#F5D77E] font-bold mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> AI Analysis
              </p>
              <p className="text-sm text-white/75 leading-relaxed">{reasoning}</p>
            </div>
          </Reveal3D>
        )}

        {visualSymptoms && visualSymptoms.length > 0 && (
          <Reveal3D root={scrollRef} tilt="up">
            <div className="rounded-[20px] p-4 bg-white/[0.04] border border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Symptoms Detected</p>
              <div className="flex flex-wrap gap-2">
                {visualSymptoms.map((s, i) => (
                  <span key={i} className="bg-white/[0.06] text-white/80 text-xs font-medium px-3 py-1 rounded-full border border-white/10">{s}</span>
                ))}
              </div>
            </div>
          </Reveal3D>
        )}

        <Reveal3D root={scrollRef} tilt="up">
          <div className="rounded-[20px] p-4 bg-white/[0.03] border border-white/10">
            <p className="text-sm text-white/70 leading-relaxed">{disease.description}</p>
          </div>
        </Reveal3D>

        {/* Confidence rings */}
        <div className="flex gap-4 pt-2">
          {ring(confidencePct, cropColor, 'Disease Match')}
          {ring(cropConfPct, '#95D5B2', 'Crop Confidence')}
        </div>

        {/* Treatment roadmap */}
        <div className="pt-4">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#F5D77E] to-[#C9A227]" />
            Treatment Roadmap
          </h2>
          <div className="space-y-3">
            {disease.treatment.map((t, i) => (
              <Reveal3D key={t.step} root={scrollRef} delay={i * 0.06} tilt={i % 2 === 0 ? 'left' : 'right'}>
                <div className="rounded-[20px] bg-white/[0.04] border border-white/10 p-4 flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F5D77E] to-[#C9A227] flex items-center justify-center flex-shrink-0 text-[#07100C] font-bold text-sm">
                    {t.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{t.title}</h3>
                    <p className="text-xs text-white/55 mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              </Reveal3D>
            ))}
          </div>
        </div>

        {/* Recommended products */}
        <div className="pt-2">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#F5D77E] to-[#C9A227]" />
            Recommended Products
          </h2>
          <div className="flex flex-wrap gap-2">
            {disease.products.map((p, i) => (
              <span key={i} className="bg-[#D4AF37]/[0.12] text-[#F5D77E] text-xs font-bold px-4 py-2 rounded-full border border-[#D4AF37]/20">{p}</span>
            ))}
          </div>
        </div>

        {/* Find treatment */}
        <button className="w-full mt-4 rounded-[24px] p-[1px] bg-gradient-to-r from-[#F5D77E] to-[#C9A227] active:scale-[0.98] transition-transform">
          <div className="rounded-[23px] bg-[#0B1611] p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[#F5D77E]" />
              </div>
              <p className="font-bold text-lg text-white">Find Treatment</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/40" />
          </div>
        </button>
      </div>
    </motion.div>
  );
}
