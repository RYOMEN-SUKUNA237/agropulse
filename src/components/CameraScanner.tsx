import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Loader2, AlertTriangle, RefreshCw, ImageUp } from 'lucide-react';

type CamState = 'loading' | 'ready' | 'error';

interface CameraScannerProps {
  /** Called with the captured photo. Parent closes the modal and runs diagnosis. */
  onCapture: (file: File) => void;
  /** Close the camera without capturing. */
  onClose: () => void;
  /** Fallback to the normal file picker (used when the camera can't start). */
  onPickFile: () => void;
}

/**
 * Full-screen live camera scanner with an animated scan-line overlay.
 * Streams the rear camera, lets the user capture a frame, and hands the
 * resulting JPEG File back to the parent which triggers auto-diagnosis.
 */
export default function CameraScanner({ onCapture, onClose, onPickFile }: CameraScannerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState]       = useState<CamState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [facing, setFacing]     = useState<'environment' | 'user'>('environment');
  const [flash, setFlash]       = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startStream = useCallback(async (mode: 'environment' | 'user') => {
    setState('loading');
    setErrorMsg('');
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('ready');
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      let msg = 'Could not access the camera.';
      if (name === 'NotAllowedError')      msg = 'Camera permission was denied. Allow camera access in your browser, or upload a photo instead.';
      else if (name === 'NotFoundError')   msg = 'No camera was found on this device. You can upload a photo instead.';
      else if (name === 'NotReadableError')msg = 'The camera is already in use by another app. Close it and try again.';
      setErrorMsg(msg);
      setState('error');
    }
  }, [stopStream]);

  // Start on mount, clean up on unmount.
  useEffect(() => {
    startStream(facing);
    return stopStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitch = () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    startStream(next);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || state !== 'ready' || !video.videoWidth) return;

    const canvas  = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Brief flash for capture feedback
    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopStream();
      onCapture(file); // parent closes modal + runs performScan (auto-diagnose)
    }, 'image/jpeg', 0.92);
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black flex items-center justify-center"
    >
      <div className="relative w-full h-full max-w-md mx-auto overflow-hidden bg-black">
        {/* Live camera feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${facing === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Capture flash */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-30"
            />
          )}
        </AnimatePresence>

        {/* ── Scan overlay (only when the feed is live) ── */}
        {state === 'ready' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Dim outside the focus frame */}
            <div className="absolute inset-0 bg-black/30" />
            {/* Focus window */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[72%] aspect-square">
              {/* Cut-out (clear) window with soft ring */}
              <div className="absolute inset-0 rounded-[28px] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />

              {/* Animated scan line sweeping top→bottom */}
              <div className="absolute inset-0 overflow-hidden rounded-[28px]">
                <motion.div
                  className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#95D5B2] to-transparent shadow-[0_0_14px_2px_rgba(149,213,178,0.8)]"
                  animate={{ top: ['4%', '96%', '4%'] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* faint trailing glow band */}
                <motion.div
                  className="absolute left-0 right-0 h-16 bg-gradient-to-b from-[#95D5B2]/20 to-transparent"
                  animate={{ top: ['0%', '90%', '0%'] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              {/* Corner brackets */}
              {[
                'top-0 left-0 border-t-4 border-l-4 rounded-tl-[28px]',
                'top-0 right-0 border-t-4 border-r-4 rounded-tr-[28px]',
                'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-[28px]',
                'bottom-0 right-0 border-b-4 border-r-4 rounded-br-[28px]',
              ].map((c) => (
                <div key={c} className={`absolute w-10 h-10 border-[#95D5B2] ${c}`} />
              ))}
            </div>

            <p className="absolute left-0 right-0 bottom-36 text-center text-white/90 text-sm font-medium px-8">
              Center a single leaf inside the frame, then tap to scan
            </p>
          </div>
        )}

        {/* ── Loading ── */}
        {state === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
            <Loader2 className="w-10 h-10 animate-spin text-[#95D5B2] mb-4" />
            <p className="text-sm font-medium">Starting camera…</p>
          </div>
        )}

        {/* ── Error ── */}
        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-sm font-medium leading-relaxed mb-6 max-w-[280px]">{errorMsg}</p>
            <div className="flex gap-3">
              <button
                onClick={() => startStream(facing)}
                className="flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-5 py-3 rounded-2xl active:scale-95 transition-transform"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
              <button
                onClick={() => { stopStream(); onPickFile(); }}
                className="flex items-center gap-2 bg-[#95D5B2] text-[#1B4332] font-bold px-5 py-3 rounded-2xl active:scale-95 transition-transform"
              >
                <ImageUp className="w-4 h-4" /> Upload instead
              </button>
            </div>
          </div>
        )}

        {/* ── Top bar ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-5 z-20">
          <button
            onClick={handleClose}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label="Close camera"
          >
            <X className="w-6 h-6" />
          </button>
          <span className="text-white/90 text-sm font-semibold bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
            AI Leaf Scanner
          </span>
          <button
            onClick={handleSwitch}
            disabled={state === 'loading'}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-40"
            aria-label="Switch camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* ── Capture button ── */}
        {state === 'ready' && (
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-10 z-20">
            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Capture and diagnose"
            >
              <span className="w-16 h-16 rounded-full bg-[#95D5B2] flex items-center justify-center shadow-lg">
                <Camera className="w-8 h-8 text-[#1B4332]" />
              </span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
