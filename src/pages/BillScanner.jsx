import React, { useEffect, useMemo, useState } from "react";
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
    const [activeTab, setActiveTab] = useState("preview"); // "preview" | "history"

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
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
            setColumns(data.columns || []);
            setRows(data.rows || []);
            setMeta(data.meta || {});
            setState(STATES.READY);
            if ((data.columns || []).length === 0) {
                toast.warning(
                    "No table detected. Try a clearer photo or a PDF.",
                );
            } else {
                toast.success(
                    `Extracted ${data.rows?.length || 0} rows from bill.`,
                );
            }
        } catch (e) {
            console.error(e);
            const msg =
                e?.response?.data?.detail ||
                e?.message ||
                "Extraction failed. Please try again.";
            toast.error(String(msg));
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
                                <div className="mt-2 h-1 w-48 sm:w-64 overflow-hidden border border-black bg-white">
                                    <div className="h-full w-1/2 animate-pulse bg-[#E6FF00]" />
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
