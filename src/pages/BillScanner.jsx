import React, { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { FileText, History as HistoryIcon } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { UploadZone } from "@/components/UploadZone";
import { CameraModal } from "@/components/CameraModal";
import { DocumentPreview } from "@/components/DocumentPreview";
import { DataGrid } from "@/components/DataGrid";
import { HistoryPanel } from "@/components/HistoryPanel";
import { extractBill, downloadExcel } from "@/lib/api";

const STATES = {
    IDLE: "idle",
    PROCESSING: "processing",
    READY: "ready",
    ERROR: "error",
};

// Progress stages with timing weights (total ~45s estimated)
const PROGRESS_STAGES = [
    { at: 0,  label: "Uploading file ..."              },
    { at: 8,  label: "Reading document ..."            },
    { at: 20, label: "Detecting language & layout ..." },
    { at: 38, label: "Extracting table rows ..."       },
    { at: 60, label: "Parsing JSON response ..."       },
    { at: 78, label: "Validating data ..."             },
    { at: 90, label: "Almost done ..."                 },
    { at: 97, label: "Finalising ..."                  },
];

function useProgressSimulator(active) {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        if (!active) {
            setProgress(0);
            clearInterval(intervalRef.current);
            return;
        }
        setProgress(0);
        startTimeRef.current = Date.now();

        // Simulate realistic progress: fast start, slow near 95
        intervalRef.current = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                // Slow down as we approach 95
                const increment = prev < 40 ? 1.2 : prev < 70 ? 0.7 : 0.25;
                return Math.min(95, prev + increment);
            });
        }, 400);

        return () => clearInterval(intervalRef.current);
    }, [active]);

    // Jump to 100 when done — caller sets active=false then calls complete()
    const complete = () => {
        clearInterval(intervalRef.current);
        setProgress(100);
    };

    return { progress: Math.round(progress), complete };
}

export default function BillScanner() {
    const [state, setState] = useState(STATES.IDLE);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({});
    const [historyItem, setHistoryItem] = useState(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [activeTab, setActiveTab] = useState("preview");
    const [elapsedSec, setElapsedSec] = useState(0);
    const timerRef = useRef(null);

    const isProcessing = state === STATES.PROCESSING;
    const { progress, complete } = useProgressSimulator(isProcessing);

    // Elapsed-time counter
    useEffect(() => {
        if (!isProcessing) {
            clearInterval(timerRef.current);
            setElapsedSec(0);
            return;
        }
        setElapsedSec(0);
        timerRef.current = setInterval(() => {
            setElapsedSec((s) => s + 1);
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [isProcessing]);

    // Estimated time remaining (rough: assume ~45s total)
    const estTotal = 45;
    const estRemaining = progress < 100
        ? Math.max(0, Math.round((estTotal * (100 - progress)) / 100))
        : 0;

    // Current stage label
    const stageLabel = [...PROGRESS_STAGES]
        .reverse()
        .find((s) => progress >= s.at)?.label ?? "Initialising ...";

    useEffect(() => {
        if (!file) { setPreviewUrl(null); return; }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const runExtraction = async (f) => {
        setState(STATES.PROCESSING);
        setHistoryItem(null);
        setColumns([]);
        setRows([]);
        setMeta({});
        try {
            const data = await extractBill(f);
            complete();
            // Small delay so user sees 100%
            await new Promise((r) => setTimeout(r, 400));
            setColumns(data.columns || []);
            setRows(data.rows || []);
            setMeta(data.meta || {});
            setState(STATES.READY);
            if ((data.columns || []).length === 0) {
                toast.warning("No table detected. Try a clearer photo or a PDF.");
            } else {
                toast.success(`Extracted ${data.rows?.length || 0} rows · ${data.columns?.length || 0} columns`);
            }
        } catch (e) {
            console.error(e);
            const detail = e?.response?.data?.detail || e?.message || "Extraction failed.";
            const status = e?.response?.status;
            let msg = String(detail);
            if (status === 500 && msg.includes("OPENROUTER_API_KEY")) {
                msg = "⚠️ No API key configured. Add your free OpenRouter key to backend/.env as OPENROUTER_API_KEY";
            } else if (status === 502) {
                msg = "All AI models failed. Check your OpenRouter API key or try again.";
            }
            toast.error(msg, { duration: 8000 });
            setState(STATES.ERROR);
        }
    };

    const handleFile = (f) => {
        setFile(f);
        setHistoryItem(null);
        runExtraction(f);
    };

    const handleReset = () => {
        setFile(null);
        setPreviewUrl(null);
        setHistoryItem(null);
        setColumns([]);
        setRows([]);
        setMeta({});
        setState(STATES.IDLE);
    };

    const handleReExtract = () => {
        if (file) runExtraction(file);
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const base = file?.name?.replace(/\.[^.]+$/, "") || historyItem?.filename?.replace(/\.[^.]+$/, "") || "bill";
            await downloadExcel({
                columns,
                rows,
                filename: `${base}.xlsx`,
            });
            toast.success("Excel downloaded.");
        } catch (e) {
            toast.error("Download failed.");
        } finally {
            setDownloading(false);
        }
    };

    const handleSelectHistoryItem = (item) => {
        setFile(null);
        setHistoryItem(item);
        setColumns(item.columns || []);
        setRows(item.rows || []);
        setMeta(item.meta || {});
        setState(STATES.READY);
        toast.success(`Loaded history: ${item.filename || "Extraction"}`);
    };

    const showWorkspace = state !== STATES.IDLE;
    const status = useMemo(() => {
        switch (state) {
            case STATES.PROCESSING:
                return "scanning";
            case STATES.READY:
                return "ready";
            case STATES.ERROR:
                return "error";
            default:
                return "idle";
        }
    }, [state]);

    return (
        <div className="min-h-screen">
            <AppHeader
                status={status}
                onReset={showWorkspace ? handleReset : null}
            />

            {!showWorkspace && (
                <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-10">
                    <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <div className="label-eyebrow">Bill → Sheet</div>
                            <p className="font-mono mt-3 max-w-2xl text-xs sm:text-sm text-zinc-600">
                                A precise multilingual OCR utility. It reads any
                                invoice or bill, pulls the line-item table
                                dynamically, and hands you an editable Excel — no
                                template needed.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setState(STATES.READY);
                                setActiveTab("history");
                            }}
                            className="inline-flex items-center gap-2 border border-black bg-white px-4 py-2 font-mono text-xs uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
                        >
                            <HistoryIcon size={14} /> View History
                        </button>
                    </div>
                    <UploadZone
                        onFile={handleFile}
                        onOpenCamera={() => setCameraOpen(true)}
                    />
                </main>
            )}

            {showWorkspace && (
                <main
                    className="flex flex-col lg:grid lg:grid-cols-12 min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)]"
                    data-testid="workspace"
                >
                    {/* Left Panel: Preview / History */}
                    <div className="w-full lg:col-span-5 min-h-[360px] lg:h-full flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-zinc-200">
                        {/* Tab Switcher */}
                        <div className="flex border-b border-zinc-200 bg-zinc-50 font-mono text-xs uppercase tracking-wider">
                            <button
                                onClick={() => setActiveTab("preview")}
                                className={[
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 font-semibold transition-colors border-b-2",
                                    activeTab === "preview"
                                        ? "border-black bg-white text-black"
                                        : "border-transparent text-zinc-500 hover:text-black hover:bg-zinc-100",
                                ].join(" ")}
                            >
                                <FileText size={14} /> Preview Document
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={[
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 font-semibold transition-colors border-b-2",
                                    activeTab === "history"
                                        ? "border-black bg-white text-black"
                                        : "border-transparent text-zinc-500 hover:text-black hover:bg-zinc-100",
                                ].join(" ")}
                            >
                                <HistoryIcon size={14} /> History
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {activeTab === "preview" ? (
                                <DocumentPreview
                                    file={file}
                                    previewUrl={previewUrl}
                                    processing={state === STATES.PROCESSING}
                                    historyItem={historyItem}
                                    meta={meta}
                                    columns={columns}
                                    rows={rows}
                                />
                            ) : (
                                <HistoryPanel
                                    onSelectHistoryItem={handleSelectHistoryItem}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Editable Data Grid */}
                    <div className="w-full lg:col-span-7 flex-1 lg:h-full overflow-y-auto lg:overflow-hidden">
                        {state === STATES.PROCESSING ? (
                            <div className="flex h-full flex-col items-start justify-center gap-6 p-6 sm:p-12">
                                <div className="label-eyebrow">Working</div>
                                <h2 className="font-display max-w-lg text-2xl sm:text-3xl font-bold leading-tight tracking-tighter">
                                    Parsing your bill.
                                    <br />
                                    Detecting the table.
                                </h2>
                                <div className="font-mono max-w-lg text-xs sm:text-sm text-zinc-600">
                                    Larger PDFs and multi-language bills can
                                    take a few seconds. You&apos;ll see the
                                    editable grid the moment it&apos;s ready.
                                </div>

                                {/* ── Progress Bar + Stats ── */}
                                <div className="mt-2 w-full max-w-sm space-y-3">
                                    {/* Bar + Percentage side by side */}
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-1 h-1.5 overflow-hidden border border-black bg-white">
                                            <div
                                                className="h-full bg-[#E6FF00] transition-all duration-500 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="font-mono text-sm font-bold tabular-nums text-black w-10 text-right">
                                            {progress}%
                                        </span>
                                    </div>

                                    {/* Stage label + Time */}
                                    <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
                                        <span>{stageLabel}</span>
                                        <span className="flex items-center gap-3 text-zinc-400">
                                            <span>{elapsedSec}s elapsed</span>
                                            {estRemaining > 0 && (
                                                <span className="text-zinc-500">
                                                    ~{estRemaining}s left
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : state === STATES.ERROR ? (
                            <div className="flex h-full flex-col items-start justify-center gap-6 p-6 sm:p-12">
                                <div className="label-eyebrow text-[#FF2A00]">
                                    error
                                </div>
                                <h2 className="font-display max-w-lg text-2xl sm:text-3xl font-bold leading-tight tracking-tighter">
                                    Something broke while reading this bill.
                                </h2>
                                <button
                                    data-testid="error-retry-btn"
                                    onClick={handleReExtract}
                                    className="border border-black bg-black px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#E6FF00] hover:text-black"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : (
                            <DataGrid
                                columns={columns}
                                rows={rows}
                                setColumns={setColumns}
                                setRows={setRows}
                                meta={meta}
                                onDownload={handleDownload}
                                onReExtract={handleReExtract}
                                downloading={downloading}
                            />
                        )}
                    </div>
                </main>
            )}

            <CameraModal
                open={cameraOpen}
                onClose={() => setCameraOpen(false)}
                onCapture={(f) => {
                    setCameraOpen(false);
                    handleFile(f);
                }}
            />
        </div>
    );
}
