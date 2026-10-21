import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle } from 'lucide-react';

interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title?: string;
}

export const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Capture Student Face Photo',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    const startCamera = async () => {
      setCameraError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Please allow camera access in browser settings.'
            : 'No camera found or camera is being used by another application.'
        );
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleAccept = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-xl bg-blue-600/20 p-2 text-blue-400 border border-blue-500/30">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Position face centrally within the frame</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cameraError ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-8 text-center text-rose-300 space-y-3">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-400" />
            <p className="text-sm font-semibold">{cameraError}</p>
            <p className="text-xs text-slate-400">
              You can still upload a photo directly from your computer using the file picker.
            </p>
          </div>
        ) : (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-inner">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="h-full w-full object-cover" />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover mirror"
                />
                {/* Oval Face Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-dashed border-blue-400/70 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>

          {!cameraError && !capturedImage && (
            <button
              type="button"
              onClick={handleCapture}
              className="flex items-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/40 transition"
            >
              <Camera className="h-4 w-4" />
              <span>Capture Photo</span>
            </button>
          )}

          {capturedImage && (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition"
              >
                <Check className="h-4 w-4" />
                <span>Use This Photo</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
