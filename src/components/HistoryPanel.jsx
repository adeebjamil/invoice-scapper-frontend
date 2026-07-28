import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
    History,
    Trash2,
    Eye,
    RefreshCw,
    CheckSquare,
    Square,
    AlertTriangle,
    Search,
    X,
    Download,
    FileSpreadsheet,
    ArrowRight,
    Tag,
    Calendar,
    Building,
} from "lucide-react";
import {
    getHistory,
    deleteHistoryItem,
    deleteHistoryBulk,
    clearAllHistory,
    downloadExcel,
} from "@/lib/api";

export const HistoryPanel = ({ onSelectHistoryItem }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [previewItem, setPreviewItem] = useState(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getHistory();
            setHistory(data || []);
            setSelectedIds([]);
        } catch (err) {
            console.error("Failed to fetch history:", err);
            toast.error("Could not load extraction history.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const filteredHistory = history.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const fname = (item.filename || "").toLowerCase();
        const vendor = (item.meta?.vendor || "").toLowerCase();
        const inv = (item.meta?.invoice_number || "").toLowerCase();
        return fname.includes(q) || vendor.includes(q) || inv.includes(q);
    });

    const handleSelectAll = () => {
        if (selectedIds.length === filteredHistory.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredHistory.map((item) => item.id));
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleDeleteSingle = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this scan from history?")) return;
        setDeleting(true);
        try {
            await deleteHistoryItem(id);
            toast.success("Scan deleted from history.");
            setHistory((prev) => prev.filter((item) => item.id !== id));
            setSelectedIds((prev) => prev.filter((item) => item !== id));
            if (previewItem?.id === id) setPreviewItem(null);
        } catch (err) {
            toast.error("Failed to delete history item.");
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Delete ${selectedIds.length} selected item(s) from history?`)) return;
        setDeleting(true);
        try {
            await deleteHistoryBulk(selectedIds);
            toast.success(`Deleted ${selectedIds.length} items from history.`);
            setHistory((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
            setSelectedIds([]);
            if (previewItem && selectedIds.includes(previewItem.id)) setPreviewItem(null);
        } catch (err) {
            toast.error("Failed to delete selected items.");
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (history.length === 0) return;
        if (!window.confirm("WARNING: This will permanently delete ALL extraction history! Continue?")) return;
        setDeleting(true);
        try {
            await clearAllHistory();
            toast.success("All extraction history deleted.");
            setHistory([]);
            setSelectedIds([]);
            setPreviewItem(null);
        } catch (err) {
            toast.error("Failed to clear history.");
        } finally {
            setDeleting(false);
        }
    };

    const handleDownloadHistoryExcel = async (e, item) => {
        e.stopPropagation();
        try {
            const base = item.filename?.replace(/\.[^.]+$/, "") || "history_bill";
            await downloadExcel({
                columns: item.columns || [],
                rows: item.rows || [],
                filename: `${base}.xlsx`,
            });
            toast.success("Excel downloaded.");
        } catch (err) {
            toast.error("Download failed.");
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return "";
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return isoString;
        }
    };

    return (
        <div className="flex h-full flex-col bg-white border-r border-zinc-200">
            {/* Header */}
            <div className="border-b border-border bg-white px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-black" />
                        <h2 className="font-display text-base sm:text-lg font-bold tracking-tight">
                            Extraction History
                        </h2>
                        <span className="ml-1 rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-700">
                            {history.length}
                        </span>
                    </div>
                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="p-1.5 text-zinc-500 hover:text-black transition-colors rounded hover:bg-zinc-100"
                        title="Refresh History"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Search Input */}
                {history.length > 0 && (
                    <div className="relative mt-3">
                        <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search history by name, vendor, invoice..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-zinc-300 bg-zinc-50 pl-8 pr-8 py-1.5 font-mono text-xs text-black placeholder:text-zinc-400 focus:border-black focus:bg-white focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-2 text-zinc-400 hover:text-black"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}

                {/* Bulk Actions Toolbar */}
                {history.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2 text-xs">
                        <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-1.5 text-zinc-600 hover:text-black font-mono text-xs"
                        >
                            {selectedIds.length === filteredHistory.length && filteredHistory.length > 0 ? (
                                <CheckSquare size={14} className="text-black" />
                            ) : (
                                <Square size={14} />
                            )}
                            {selectedIds.length === filteredHistory.length && filteredHistory.length > 0
                                ? "Deselect All"
                                : `Select All (${filteredHistory.length})`}
                        </button>

                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    disabled={deleting}
                                    className="flex items-center gap-1 bg-red-600 px-2.5 py-1 text-white hover:bg-red-700 font-mono text-[11px] uppercase tracking-wider rounded transition-colors"
                                >
                                    <Trash2 size={12} />
                                    Delete ({selectedIds.length})
                                </button>
                            )}

                            <button
                                onClick={handleDeleteAll}
                                disabled={deleting}
                                className="flex items-center gap-1 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 font-mono text-[11px] uppercase tracking-wider rounded transition-colors"
                                title="Delete All Scans"
                            >
                                <AlertTriangle size={12} />
                                Clear All
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading && history.length === 0 ? (
                    <div className="flex h-48 items-center justify-center font-mono text-xs text-zinc-500">
                        <RefreshCw size={16} className="animate-spin mr-2" /> Loading history...
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200">
                        <History size={28} className="text-zinc-300 mb-2" />
                        <p className="font-mono text-xs font-semibold text-zinc-600">
                            {history.length === 0 ? "No saved history yet" : "No matching history found"}
                        </p>
                        <p className="font-mono text-[11px] text-zinc-400 mt-1">
                            {history.length === 0
                                ? "Uploaded bills and extractions will be automatically saved here."
                                : "Try clearing your search query."}
                        </p>
                    </div>
                ) : (
                    filteredHistory.map((item) => {
                        const isSelected = selectedIds.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                onClick={() => onSelectHistoryItem(item)}
                                className={[
                                    "group relative flex flex-col justify-between border p-3.5 cursor-pointer transition-all hover:border-black",
                                    isSelected ? "border-black bg-zinc-50" : "border-zinc-200 bg-white",
                                ].join(" ")}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleSelect(item.id);
                                            }}
                                            className="mt-0.5 text-zinc-400 hover:text-black"
                                        >
                                            {isSelected ? (
                                                <CheckSquare size={16} className="text-black" />
                                            ) : (
                                                <Square size={16} />
                                            )}
                                        </button>
                                        <div className="min-w-0">
                                            <h3 className="font-mono text-xs font-bold text-black truncate">
                                                {item.filename || "Untitled Bill"}
                                            </h3>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {formatDate(item.created_at)}
                                                </span>
                                                {item.meta?.vendor && (
                                                    <span className="flex items-center gap-1 bg-zinc-100 px-1.5 py-0.5 text-zinc-700 border border-zinc-200">
                                                        <Building size={10} />
                                                        {item.meta.vendor}
                                                    </span>
                                                )}
                                                {item.meta?.invoice_number && (
                                                    <span className="bg-zinc-100 px-1.5 py-0.5 text-zinc-700 border border-zinc-200">
                                                        #{item.meta.invoice_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewItem(item);
                                            }}
                                            className="p-1.5 text-zinc-600 hover:text-black hover:bg-zinc-100 border border-zinc-200 rounded"
                                            title="Quick Preview History Scan"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDownloadHistoryExcel(e, item)}
                                            className="p-1.5 text-zinc-600 hover:text-black hover:bg-zinc-100 border border-zinc-200 rounded"
                                            title="Download Excel"
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteSingle(e, item.id)}
                                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded"
                                            title="Delete Scan"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 font-mono text-[10px] text-zinc-500">
                                    <span className="flex items-center gap-1">
                                        <Tag size={10} />
                                        {item.rows?.length || 0} rows · {item.columns?.length || 0} cols
                                    </span>
                                    <span className="font-semibold text-black uppercase tracking-wider group-hover:text-blue-600 flex items-center gap-1">
                                        Open Editor <ArrowRight size={10} />
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col border-2 border-black bg-white shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b-2 border-black bg-zinc-900 px-5 py-3.5 text-white">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="text-[#E6FF00]" size={20} />
                                <div>
                                    <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                                        {previewItem.filename || "History Scan Preview"}
                                    </h3>
                                    <p className="font-mono text-[11px] text-zinc-400">
                                        Saved on {formatDate(previewItem.created_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewItem(null)}
                                className="p-1 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Metadata Badges */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                                <div className="border border-zinc-200 bg-zinc-50 p-2.5">
                                    <span className="text-[10px] uppercase text-zinc-500 block">Vendor</span>
                                    <span className="font-semibold text-black truncate block">
                                        {previewItem.meta?.vendor || "N/A"}
                                    </span>
                                </div>
                                <div className="border border-zinc-200 bg-zinc-50 p-2.5">
                                    <span className="text-[10px] uppercase text-zinc-500 block">Invoice #</span>
                                    <span className="font-semibold text-black truncate block">
                                        {previewItem.meta?.invoice_number || "N/A"}
                                    </span>
                                </div>
                                <div className="border border-zinc-200 bg-zinc-50 p-2.5">
                                    <span className="text-[10px] uppercase text-zinc-500 block">Date</span>
                                    <span className="font-semibold text-black truncate block">
                                        {previewItem.meta?.date || "N/A"}
                                    </span>
                                </div>
                                <div className="border border-zinc-200 bg-zinc-50 p-2.5">
                                    <span className="text-[10px] uppercase text-zinc-500 block">Language</span>
                                    <span className="font-semibold text-black truncate block capitalize">
                                        {previewItem.meta?.language_detected || "N/A"}
                                    </span>
                                </div>
                            </div>

                            {/* Table Preview */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                                        Extracted Table Preview ({previewItem.rows?.length || 0} rows, {previewItem.columns?.length || 0} columns)
                                    </span>
                                </div>

                                <div className="max-h-60 overflow-auto border border-black bg-white">
                                    <table className="w-full text-left font-mono text-xs border-collapse">
                                        <thead className="bg-zinc-100 border-b border-black sticky top-0">
                                            <tr>
                                                <th className="p-2 border-r border-zinc-300 w-10 text-center font-bold text-zinc-600">
                                                    #
                                                </th>
                                                {(previewItem.columns || []).map((col, idx) => (
                                                    <th
                                                        key={idx}
                                                        className="p-2 border-r border-zinc-300 font-bold text-black uppercase"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(previewItem.rows || []).map((row, rIdx) => (
                                                <tr key={rIdx} className="border-b border-zinc-200 hover:bg-zinc-50">
                                                    <td className="p-2 border-r border-zinc-200 text-center text-zinc-400">
                                                        {rIdx + 1}
                                                    </td>
                                                    {(previewItem.columns || []).map((col, cIdx) => (
                                                        <td key={cIdx} className="p-2 border-r border-zinc-200 text-zinc-800">
                                                            {row[col] ?? ""}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="flex items-center justify-between border-t-2 border-black bg-zinc-50 px-5 py-3.5">
                            <button
                                onClick={() => setPreviewItem(null)}
                                className="border border-zinc-300 bg-white px-4 py-2 font-mono text-xs uppercase tracking-wider text-zinc-700 hover:bg-zinc-100"
                            >
                                Close Preview
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handleDownloadHistoryExcel(e, previewItem)}
                                    className="flex items-center gap-1.5 border border-black bg-white px-4 py-2 font-mono text-xs uppercase tracking-wider text-black hover:bg-zinc-100"
                                >
                                    <Download size={14} /> Download Excel
                                </button>
                                <button
                                    onClick={() => {
                                        onSelectHistoryItem(previewItem);
                                        setPreviewItem(null);
                                    }}
                                    className="flex items-center gap-1.5 border border-black bg-black px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#E6FF00] hover:bg-zinc-800"
                                >
                                    Load Data Grid <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

