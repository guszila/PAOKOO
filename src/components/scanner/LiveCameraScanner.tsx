import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Zap, ZapOff, Image as ImageIcon, AlertCircle, Check, Sparkles, QrCode } from 'lucide-react';
import { Button } from '../common/Button';
import { decodeQRFromImageData, DecodedSlipQR } from '../../lib/slip/qrDecoder';

interface LiveCameraScannerProps {
  onCapture: (blob: Blob, qr?: DecodedSlipQR | null) => void;
  onPickGallery: () => void;
  onFallbackNativeCamera: () => void;
  onCancel?: () => void;
}

export const LiveCameraScanner: React.FC<LiveCameraScannerProps> = ({
  onCapture,
  onPickGallery,
  onFallbackNativeCamera,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [qrDetected, setQrDetected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Stop camera tracks cleanly and release hardware lock
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.enabled = false;
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  // Lifecycle: Start camera ONLY when mounted, and immediately kill if unmounted
  useEffect(() => {
    let isCancelled = false;
    let localStream: MediaStream | null = null;
    let timeoutId: any = null;

    setPermissionError(null);

    const initCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!isCancelled) {
          setPermissionError('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้องแบบสด โปรดใช้การถ่ายรูปแทน');
        }
        return;
      }

      timeoutId = setTimeout(() => {
        if (!isCancelled) {
          setPermissionError((prev) => prev || 'ไม่สามารถเปิดกล้องได้ทันเวลา โปรดใช้การถ่ายรูปผ่านกล้องมือถือ');
        }
      }, 4000);

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          // Fallback for desktops or virtual environments
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        // If user closed modal or switched away before getUserMedia completed, kill stream IMMEDIATELY
        if (isCancelled) {
          stream.getTracks().forEach((t) => {
            try {
              t.enabled = false;
              t.stop();
            } catch (e) {
              console.warn('Error killing cancelled track:', e);
            }
          });
          return;
        }

        clearTimeout(timeoutId);
        localStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.warn('Video play deferred:', e);
          }
          if (!isCancelled) {
            setCameraActive(true);

            // Check torch capability
            const track = stream.getVideoTracks()[0];
            const capabilities = track?.getCapabilities?.() as any;
            if (capabilities && 'torch' in capabilities) {
              setHasTorch(true);
            } else {
              setHasTorch(false);
            }
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (isCancelled) return;
        console.warn('Failed to access camera:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionError('โปรดอนุญาตสิทธิ์เข้าถึงกล้อง เพื่อใช้งานระบบสแกนสลิปสด');
        } else if (err.name === 'NotFoundError') {
          setPermissionError('ไม่พบอุปกรณ์กล้องบนอุปกรณ์นี้');
        } else {
          setPermissionError('ไม่สามารถเปิดกล้องได้ โปรดใช้การถ่ายรูปผ่านเบราว์เซอร์');
        }
      }
    };

    initCamera();

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (localStream) {
        localStream.getTracks().forEach((t) => {
          try {
            t.enabled = false;
            t.stop();
          } catch (e) {
            console.warn('Error stopping local track:', e);
          }
        });
      }
      stopCamera();
    };
  }, [facingMode, stopCamera]);

  // If user locks phone or switches tabs, shut off camera immediately
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopCamera();
        onCancel?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [stopCamera, onCancel]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const newTorchState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setTorchOn(newTorchState);
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  };

  // Flip Camera
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Manual Shutter Snap
  const handleManualCapture = () => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          stopCamera();
          onCapture(blob, null);
        } else {
          setIsProcessing(false);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  // Real-time QR Scanning Loop
  useEffect(() => {
    if (!cameraActive) return;

    let scanInterval: any = null;

    const performScan = () => {
      if (!videoRef.current || !canvasRef.current || isProcessing) return;
      const video = videoRef.current;
      if (video.readyState < video.HAVE_CURRENT_DATA) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Sample at 480px width for ultra-fast 20ms QR scanning
      const scale = Math.min(1, 480 / (video.videoWidth || 480));
      const w = Math.round((video.videoWidth || 480) * scale);
      const h = Math.round((video.videoHeight || 640) * scale);

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);

      try {
        const imageData = ctx.getImageData(0, 0, w, h);
        const qr = decodeQRFromImageData(imageData);

        if (qr && (qr.refNo || qr.isPromptPayPayment || qr.bankCode)) {
          // Detected!
          setQrDetected(true);
          setIsProcessing(true);

          if (navigator.vibrate) {
            navigator.vibrate([60, 40, 60]);
          }

          // Full-resolution capture for OCR & Confirmation
          const highResCanvas = document.createElement('canvas');
          highResCanvas.width = video.videoWidth || 1280;
          highResCanvas.height = video.videoHeight || 720;
          const highResCtx = highResCanvas.getContext('2d');
          if (highResCtx) {
            highResCtx.drawImage(video, 0, 0, highResCanvas.width, highResCanvas.height);
          }

          highResCanvas.toBlob(
            (blob) => {
              if (blob) {
                stopCamera();
                onCapture(blob, qr);
              } else {
                setIsProcessing(false);
                setQrDetected(false);
              }
            },
            'image/jpeg',
            0.92
          );
        }
      } catch (err) {
        console.warn('Live scan error:', err);
      }
    };

    // Run QR detection every 120ms to keep CPU & battery low while feeling instant
    scanInterval = setInterval(performScan, 120);

    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [cameraActive, isProcessing, onCapture, stopCamera]);

  return (
    <div className="space-y-4">
      {/* Video Viewfinder Container */}
      <div className="relative w-full aspect-[3/4] max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-xl flex items-center justify-center">
        {/* Hidden Canvas for QR sampling */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Video Element */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            cameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Loading Spinner while camera initializes */}
        {!cameraActive && !permissionError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-400 bg-neutral-900/90 z-10">
            <RefreshCw size={28} className="animate-spin text-emerald-400" />
            <span className="text-xs font-medium">กำลังเปิดกล้อง...</span>
            {onCancel && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onCancel();
                }}
                className="mt-2 text-[11px] text-neutral-400 hover:text-white underline underline-offset-4"
              >
                ย้อนกลับ
              </button>
            )}
          </div>
        )}

        {/* Permission / Unsupported Fallback Screen */}
        {permissionError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center text-neutral-200 bg-neutral-900 z-20 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <p className="text-xs font-medium leading-relaxed">{permissionError}</p>
            <div className="flex flex-col gap-2 w-full max-w-[200px] mt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={onFallbackNativeCamera}
                className="text-xs w-full"
              >
                <Camera size={14} className="mr-1.5" />
                ถ่ายรูปผ่านกล้องมือถือ
              </Button>
              {onCancel && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    stopCamera();
                    onCancel();
                  }}
                  className="text-xs w-full"
                >
                  ย้อนกลับ
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Scanner Overlay UI (when camera active) */}
        {cameraActive && (
          <>
            {/* Dark Vignette Mask */}
            <div className="absolute inset-0 pointer-events-none bg-black/25" />

            {/* Target Reticle (กรอบเล็งทรงสลิปสากลแบบเต็มใบ - รองรับทุกธนาคาร) */}
            <div className="absolute inset-x-4 top-10 bottom-24 pointer-events-none flex flex-col items-center justify-center">
              <div
                className={`relative w-full max-w-[240px] h-[300px] rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between p-3.5 ${
                  qrDetected
                    ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_35px_#10b981]'
                    : 'border-white/40 shadow-[0_0_20px_rgba(0,0,0,0.6)]'
                }`}
              >
                {/* 4 Corner Markers */}
                <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                {/* Top Badge: Full Slip Guide */}
                <div className="text-center">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/60 border border-white/15 text-[10px] text-white/90 font-medium tracking-wide">
                    📄 กรอบสลิปแบบเต็มใบ
                  </span>
                </div>

                {/* Center Hologram Placeholder */}
                {!qrDetected && (
                  <div className="flex flex-col items-center justify-center gap-1.5 text-white/35 my-auto">
                    <QrCode size={34} strokeWidth={1.5} className="text-emerald-400/40" />
                    <span className="text-[10px] text-white/60 font-medium">QR โค้ดอยู่มุมบนหรือล่างก็ได้</span>
                  </div>
                )}

                {/* Laser Scanning Beam (up & down across full receipt) */}
                {!qrDetected && (
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_#10b981] animate-bounce" />
                )}

                {/* QR Detected Status Overlay */}
                {qrDetected && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl gap-2 p-4 text-center">
                    <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-bounce">
                      <Check size={22} strokeWidth={3} />
                    </div>
                    <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      ✓ ตรวจพบ QR Code สลิปแล้ว!
                    </span>
                    <span className="text-[10px] text-emerald-200">กำลังอ่านข้อมูลและยอดเงิน...</span>
                  </div>
                )}

                {/* Bottom subtle bar */}
                <div className="text-center">
                  <span className="text-[9px] text-white/40 block">รองรับทุกธนาคาร (KTB, SCB, BBL, Dime)</span>
                </div>
              </div>

              {/* Instructions Pill */}
              <div className="mt-2.5 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700/80 backdrop-blur-md text-[11px] text-white font-medium text-center shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span>ส่องให้เห็นสลิปทั้งใบ (ระบบตรวจจับอัตโนมัติ)</span>
              </div>
            </div>

            {/* Top Toolbar Controls (Back, Torch & Flip) */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                {onCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      onCancel();
                    }}
                    className="h-8 px-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-medium flex items-center gap-1 backdrop-blur-md transition-colors shadow-sm"
                  >
                    <span>← กลับ</span>
                  </button>
                )}
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                      torchOn
                        ? 'bg-amber-400 text-neutral-950 shadow-[0_0_10px_#fbbf24]'
                        : 'bg-black/60 text-white hover:bg-black/80'
                    }`}
                    aria-label="เปิด/ปิดไฟแฟลช"
                  >
                    {torchOn ? <Zap size={15} /> : <ZapOff size={15} />}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={flipCamera}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                aria-label="สลับกล้อง"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Bottom Shutter & Controls */}
            <div className="absolute bottom-3 inset-x-4 flex items-center justify-between z-20">
              {/* Pick from Album */}
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onPickGallery();
                }}
                className="w-10 h-10 rounded-2xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors active:scale-95"
                title="เลือกจากอัลบั้ม"
              >
                <ImageIcon size={18} />
              </button>

              {/* Big Circular Manual Shutter Button */}
              <button
                type="button"
                onClick={handleManualCapture}
                disabled={isProcessing}
                className="w-16 h-16 rounded-full border-4 border-white/80 p-1 flex items-center justify-center transition-transform active:scale-90 hover:scale-105 shadow-lg group"
                title="กดถ่ายสลิปทันที"
              >
                <div className="w-full h-full rounded-full bg-white group-hover:bg-emerald-400 transition-colors" />
              </button>

              {/* Native Camera Fallback */}
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onFallbackNativeCamera();
                }}
                className="w-10 h-10 rounded-2xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors active:scale-95"
                title="กล้องของระบบ"
              >
                <Camera size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Helpful Multi-Bank Tips */}
      <div className="p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
        <p className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
          <Sparkles size={13} className="text-emerald-500 shrink-0" />
          <span>สลิปแต่ละธนาคารจัดวางตำแหน่งต่างกัน:</span>
        </p>
        <p className="text-[10.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          • <strong>กรุงไทย:</strong> QR โค้ดอยู่มุมบนขวา, ยอดเงินอยู่ล่าง<br />
          • <strong>SCB / BBL / Dime:</strong> QR อยู่มุมล่าง/กลาง, ยอดเงินอยู่บนหรือล่าง<br />
          💡 <em>เพียงจัดให้เห็นทั้งใบสลิป ระบบจะอ่าน QR และยอดเงินอัตโนมัติ หรือกดชัตเตอร์สีขาวเพื่อถ่ายทันทีครับ</em>
        </p>
      </div>
    </div>
  );
};
