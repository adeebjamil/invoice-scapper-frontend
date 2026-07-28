import React, { useEffect, useRef, useState } from "react";
import { X, Aperture, RotateCcw, Check } from "lucide-react";

export const CameraModal = ({ open, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) return;
        let s;
        (async () => {
            try {
                s = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });
                setStream(s);
                if (videoRef.current) videoRef.current.srcObject = s;
            } catch (e) {
                setError(
                    "Camera unavailable. Grant permission or use file upload.",
                );
            }
        })();
        return () => {
            if (s) s.getTracks().forEach((t) => t.stop());
            setStream(null);
            setPreview(null);
            setError(null);
        };
    }, [open]);

    if (!open) return null;

    const snap = () => {
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c) return;
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        c.toBlob(
            (blob) => {
                if (!blob) return;
                setPreview({
                    url: URL.createObjectURL(blob),
                    file: new File([blob], `capture-${Date.now()}.jpg`, {
                        type: "image/jpeg",
                    }),
                });
            },
            "image/jpeg",
            0.92,
        );
    };

    const confirm = () => {
        if (!preview) return;
        onCapture(preview.file);
    };

    return (
        <div
            data-testid="camera-modal"
            className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
        >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="label-eyebrow text-white/70">
                    camera capture
                </div>
                <button
                    data-testid="camera-close-btn"
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center border border-white/30 text-white transition-colors hover:bg-white hover:text-black"
                >
                    <X size={16} />
                </button>
            </div>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
                {error && (
                    <div className="max-w-sm border border-[#FF2A00] bg-black p-6 font-mono text-sm text-[#FF2A00]">
                        {error}
                    </div>
                )}
                {!error && !preview && (
                    <div className="relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            data-testid="camera-video"
                            className="max-h-[70vh] max-w-full border border-white/40"
                        />
                        <div className="pointer-events-none absolute inset-4 border-2 border-white/70" />
                        <div className="pointer-events-none absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-[#E6FF00]" />
                        <div className="pointer-events-none absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-[#E6FF00]" />
                        <div className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-[#E6FF00]" />
                        <div className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-[#E6FF00]" />
                    </div>
                )}
                {preview && (
                    <img
                        src={preview.url}
                        alt="capture preview"
                        className="max-h-[70vh] max-w-full border border-white/40"
                        data-testid="camera-preview"
                    />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex items-center justify-center gap-4 border-t border-white/10 p-6">
                {!preview && !error && (
                    <button
                        data-testid="camera-capture-btn"
                        onClick={snap}
                        className="group flex items-center gap-3 border-2 border-white bg-white px-8 py-4 font-mono text-xs uppercase tracking-widest text-black transition-colors hover:bg-[#E6FF00]"
                    >
                        <Aperture size={16} /> Capture
                    </button>
                )}
                {preview && (
                    <>
                        <button
                            data-testid="camera-retake-btn"
                            onClick={() => setPreview(null)}
                            className="flex items-center gap-2 border border-white px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
                        >
                            <RotateCcw size={14} /> Retake
                        </button>
                        <button
                            data-testid="camera-confirm-btn"
                            onClick={confirm}
                            className="flex items-center gap-2 border border-[#E6FF00] bg-[#E6FF00] px-8 py-3 font-mono text-xs uppercase tracking-widest text-black transition-colors hover:bg-white"
                        >
                            <Check size={14} /> Use Photo
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
