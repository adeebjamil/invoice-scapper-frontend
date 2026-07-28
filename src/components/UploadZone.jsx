import React, { useCallback, useRef, useState } from "react";
import { Upload, Camera, FileText, ImageIcon, ScanLine } from "lucide-react";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.heic,image/*,application/pdf";

export const UploadZone = ({ onFile, onOpenCamera, disabled }) => {
    const inputRef = useRef(null);
    const [drag, setDrag] = useState(false);

    const handleFiles = useCallback(
        (files) => {
            if (!files || !files[0]) return;
            onFile(files[0]);
        },
        [onFile],
    );

    return (
        <section className="grid gap-6 lg:grid-cols-12">
            {/* Left: Dropzone */}
            <div className="lg:col-span-8">
                <div
                    data-testid="upload-dropzone"
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDrag(false);
                        handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => inputRef.current?.click()}
                    className={[
                        "dashed-zone group relative flex min-h-[420px] cursor-pointer flex-col items-start justify-between border-2 border-dashed p-10 transition-colors md:p-16",
                        drag
                            ? "border-black bg-[#f4f4f5]"
                            : "border-zinc-300 bg-white hover:border-black",
                    ].join(" ")}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPT}
                        className="hidden"
                        data-testid="upload-file-input"
                        onChange={(e) => handleFiles(e.target.files)}
                        disabled={disabled}
                    />
                    <div className="flex w-full items-start justify-between">
                        <div>
                            <div className="label-eyebrow">
                                01 · Drop / Select
                            </div>
                            <h1 className="font-display mt-6 text-4xl font-black leading-none tracking-tighter text-black sm:text-5xl md:text-6xl">
                                Drop your bill.
                                <br />
                                Get an Excel.
                            </h1>
                            <p className="mt-6 max-w-xl font-mono text-sm leading-relaxed text-zinc-600">
                                PDF, PNG, JPG or a phone camera capture — any
                                language including{" "}
                                <span className="border-b border-black text-black">
                                    Arabic
                                </span>
                                ,{" "}
                                <span className="border-b border-black text-black">
                                    Hindi
                                </span>
                                ,{" "}
                                <span className="border-b border-black text-black">
                                    English
                                </span>
                                . We read the item table, you edit and download.
                            </p>
                        </div>
                        <ScanLine
                            size={40}
                            className="text-black opacity-80"
                            strokeWidth={1.5}
                        />
                    </div>

                    <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            data-testid="upload-select-file-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                inputRef.current?.click();
                            }}
                            disabled={disabled}
                            className="inline-flex items-center gap-2 border border-black bg-black px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#E6FF00] hover:text-black disabled:opacity-50"
                        >
                            <Upload size={14} /> Select File
                        </button>
                        <button
                            type="button"
                            data-testid="upload-open-camera-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenCamera();
                            }}
                            disabled={disabled}
                            className="inline-flex items-center gap-2 border border-black bg-white px-6 py-3 font-mono text-xs uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white disabled:opacity-50"
                        >
                            <Camera size={14} /> Use Camera
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: How it works */}
            <aside className="lg:col-span-4">
                <div className="h-full border border-black bg-white p-8">
                    <div className="label-eyebrow">How it works</div>
                    <ol className="mt-6 space-y-6">
                        {[
                            {
                                icon: <FileText size={16} />,
                                t: "Upload the bill",
                                d: "PDF, image or camera snapshot. RTL scripts supported.",
                            },
                            {
                                icon: <ImageIcon size={16} />,
                                t: "AI reads the table",
                                d: "Dynamic columns are pulled from the actual invoice.",
                            },
                            {
                                icon: <ScanLine size={16} />,
                                t: "Edit + Download",
                                d: "Fix any cell, then export a clean .xlsx.",
                            },
                        ].map((s, i) => (
                            <li key={i} className="flex gap-4">
                                <span className="mt-0.5 flex h-8 w-8 items-center justify-center border border-black bg-black text-[#E6FF00]">
                                    {s.icon}
                                </span>
                                <div>
                                    <div className="font-display text-base font-semibold">
                                        {String(i + 1).padStart(2, "0")} —{" "}
                                        {s.t}
                                    </div>
                                    <div className="mt-1 font-mono text-xs leading-relaxed text-zinc-600">
                                        {s.d}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                    <div className="mt-8 border-t border-border pt-6">
                        <div className="label-eyebrow">Supported</div>
                        <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-widest">
                            {["pdf", "png", "jpg", "jpeg", "webp", "camera"].map(
                                (t) => (
                                    <span
                                        key={t}
                                        className="border border-black px-2 py-1"
                                    >
                                        {t}
                                    </span>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </section>
    );
};
