import React, { useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CameraScanner from './CameraScanner';

export default function ScanActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { performScan, isScanning } = useApp();
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await performScan(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Open the live in-app camera scanner (not the OS file picker).
  const handleCameraClick = () => setCameraOpen(true);

  // Frame captured → close camera → auto-diagnose.
  const handleCameraCapture = (file: File) => {
    setCameraOpen(false);
    void performScan(file);
  };

  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={handleCameraClick}
        disabled={isScanning}
        className="flex-1 relative group overflow-hidden rounded-[20px] disabled:opacity-60"
      >
        <div className="absolute inset-0 bg-[#1B4332] opacity-90"></div>
        <div className="relative bg-[#1B4332] text-white font-bold py-4 px-4 flex items-center justify-center gap-2 shadow-lg transform transition-transform active:scale-95">
          {isScanning ? (
            <><Loader2 className="w-5 h-5 text-[#95D5B2] animate-spin" /> Analyzing...</>
          ) : (
            <><Camera className="w-5 h-5 text-[#95D5B2]" /> Scan Plant</>
          )}
        </div>
      </button>

      <button
        onClick={handleUploadClick}
        disabled={isScanning}
        className="flex-1 relative group overflow-hidden rounded-[20px] border border-[#1B4332]/10 bg-white disabled:opacity-60"
      >
        <div className="relative text-[#1B4332] font-bold py-4 px-4 flex items-center justify-center gap-2 shadow-sm transform transition-transform active:scale-95">
          {isScanning ? (
            <><Loader2 className="w-5 h-5 text-[#1B4332]/60 animate-spin" /> Wait...</>
          ) : (
            <><Upload className="w-5 h-5 text-[#1B4332]/60" /> Upload Image</>
          )}
        </div>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <AnimatePresence>
        {cameraOpen && (
          <CameraScanner
            onCapture={handleCameraCapture}
            onClose={() => setCameraOpen(false)}
            onPickFile={() => { setCameraOpen(false); handleUploadClick(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
