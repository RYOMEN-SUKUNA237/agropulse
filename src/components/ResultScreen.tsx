import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, ChevronRight, Clock, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ResultScreen({ onBack }: { onBack: () => void }) {
  const { lastResult, lastImageUrl } = useApp();

  if (!lastResult) return null;

  const { crop, cropConfidence, disease, diseaseConfidence, severity, processingTimeMs, mode, visualSymptoms, reasoning } = lastResult;

  if (!disease) {
    console.error('[AgroPulse] ResultScreen error: disease object is undefined', lastResult);
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-xl font-bold text-[#1B4332]">Diagnosis Error</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-xs">
          The disease classification model returned an invalid or missing diagnosis index. Please try again.
        </p>
        <button
          onClick={onBack}
          className="mt-6 bg-[#1B4332] text-white px-6 py-2.5 rounded-full font-semibold shadow-md active:scale-95 transition-transform"
        >
          Go Back
        </button>
      </div>
    );
  }

  const confidencePct = Math.round(diseaseConfidence * 100);
  const cropConfPct = Math.round(cropConfidence * 100);

  const severityClass = severity === 'Critical' ? 'bg-red-500' : severity === 'High' ? 'bg-orange-500' : severity === 'Medium' ? 'bg-yellow-500' : 'bg-green-500';
  const modeLabel = mode === 'gemini_vision' ? '🤖 Gemini AI' : mode === 'tflite_local' ? '📱 Offline AI' : '⚡ Quick Scan';
  const severityDash = severity === 'Critical' ? '98, 100' : severity === 'High' ? '75, 100' : severity === 'Medium' ? '50, 100' : '25, 100';

  const cropColors: Record<string, string> = { Cocoa: '#5A3A22', Coffee: '#6F4E37', Tomato: '#FF6347', Banana: '#E4B800', Maize: '#E8A000' };
  const cropColor = cropColors[crop] || '#1B4332';

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex-1 overflow-y-auto hide-scrollbar bg-white pb-6"
    >
      {/* Image Header */}
      <div className="relative h-[40vh] w-full">
        {lastImageUrl ? (
          <img src={lastImageUrl} alt="Scanned Leaf" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#D8F3DC] to-[#95D5B2]"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/40"></div>

        <button onClick={onBack} className="absolute top-12 left-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 hover:bg-white/30 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Processing badge */}
        <div className="absolute top-12 right-6 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-[10px] font-bold text-white">{processingTimeMs}ms</span>
          </div>
          <div className="bg-emerald-600/80 backdrop-blur-md px-2.5 py-1 rounded-full">
            <span className="text-[9px] font-bold text-white">{modeLabel}</span>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ backgroundColor: cropColor }} className="text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
              {crop} ({cropConfPct}%)
            </span>
            <span className={`${severityClass} text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm`}>
              {severity}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[#1B4332] drop-shadow-sm">{disease.name}</h1>
          <p className="text-[#1B4332]/80 text-base mt-1 font-semibold drop-shadow-sm">{disease.scientificName}</p>
        </div>
      </div>

      <div className="px-6 -mt-2 relative z-10">
        {/* AI Reasoning */}
        {reasoning && (
          <div className="bg-blue-50 rounded-[20px] p-4 mb-4 border border-blue-100">
            <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold mb-1.5">AI Analysis</p>
            <p className="text-sm text-blue-900/80 leading-relaxed">{reasoning}</p>
          </div>
        )}

        {/* Visual Symptoms Detected */}
        {visualSymptoms && visualSymptoms.length > 0 && (
          <div className="bg-amber-50 rounded-[20px] p-4 mb-4 border border-amber-100">
            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-bold mb-2">Symptoms Detected by AI</p>
            <div className="flex flex-wrap gap-2">
              {visualSymptoms.map((s: string, i: number) => (
                <span key={i} className="bg-white text-amber-800 text-xs font-medium px-3 py-1 rounded-full border border-amber-200">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-[#F9FBF9] rounded-[20px] p-4 mb-6 border border-[#1B4332]/5">
          <p className="text-sm text-[#1B4332]/80 leading-relaxed">{disease.description}</p>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#1B4332]/5 flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 flex items-center justify-center mb-3">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-[#D8F3DC]" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-[#1B4332]" strokeWidth="3.5" strokeDasharray={`${confidencePct}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{confidencePct}<span className="text-sm">%</span></span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#1B4332]/60 uppercase tracking-wider">Confidence</span>
          </div>

          <div className="flex-1 bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#1B4332]/5 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-[#1B4332]/60 uppercase tracking-wider mb-4 block text-center">Severity</span>
            <div className="flex h-4 rounded-full overflow-hidden mb-3">
              <div className="flex-1 bg-[#95D5B2]"></div>
              <div className="flex-1 bg-yellow-400"></div>
              <div className="flex-1 bg-red-500"></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-[#1B4332]/40 px-1">
              <span className={severity === 'Low' ? 'text-green-600' : ''}>LOW</span>
              <span className={severity === 'Critical' ? 'text-red-500' : ''}>CRITICAL</span>
            </div>
          </div>
        </div>

        {/* Symptoms */}
        {disease.symptoms[0] !== 'No symptoms — healthy tissue' && (
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-4">Symptoms Detected</h3>
            <div className="space-y-2">
              {disease.symptoms.map((s, i) => (
                <div key={i} className="flex items-start gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-[#1B4332]/80">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Treatment Roadmap — dynamically from disease KB */}
        <div className="mb-8">
          <h3 className="font-bold text-xl mb-6">Treatment Roadmap</h3>
          <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-[#1B4332]/10">
            {disease.treatment.map((item) => (
              <div key={item.step} className="relative pl-12">
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[#D8F3DC] border-4 border-white flex items-center justify-center text-sm font-bold text-[#1B4332]">
                  {item.step}
                </div>
                <h4 className="font-semibold text-base">{item.title}</h4>
                <p className="text-sm text-[#1B4332]/70 mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Products */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4">Recommended Products</h3>
          <div className="flex flex-wrap gap-2">
            {disease.products.map((p, i) => (
              <span key={i} className="bg-[#D8F3DC] text-[#1B4332] text-xs font-bold px-4 py-2 rounded-full">{p}</span>
            ))}
          </div>
        </div>

        {/* Agro-Dealer Link */}
        <button className="w-full bg-[#1B4332] text-white rounded-[24px] p-5 flex items-center justify-between shadow-lg active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#95D5B2]" />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">Find Treatment</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/50" />
        </button>
      </div>
    </motion.div>
  );
}
