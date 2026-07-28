import React from "react";
import { FileText, Building, Calendar, Tag, Globe, Hash } from "lucide-react";

export const DocumentPreview = ({ file, previewUrl, processing, historyItem, meta, columns, rows }) => {
    const isPdf = file?.type === "application/pdf";
    const activeItem = historyItem || (rows?.length > 0 ? { filename: file?.name, meta, columns, rows } : null);

    return (
        <div className="relative flex h-full flex-col border-r border-border bg-[#f4f4f5]">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
                <div className="label-eyebrow">
                    source · {file ? file.name : activeItem?.filename ? `history :: ${activeItem.filename}` : "no document"}
                </div>
                <div className="font-mono text-[11px] text-zinc-500">
                    {file
                        ? `${(file.size / 1024).toFixed(1)} KB · ${file.type || "unknown"}`
                        : activeItem
                        ? `${activeItem.rows?.length || 0} rows · ${activeItem.columns?.length || 0} cols`
                        : ""}
                </div>
            </div>

            {/* Document / Scan Preview Body */}
            <div
                className="relative flex-1 overflow-auto p-6"
                data-testid="document-preview"
            >
                {previewUrl ? (
                    isPdf ? (
                        <iframe
                            title="pdf preview"
                            src={previewUrl}
                            className="h-full min-h-[600px] w-full border border-border bg-white shadow-sm"
                        />
                    ) : (
                        <img
                            src={previewUrl}
                            alt="uploaded document"
                            className="mx-auto max-h-full max-w-full border border-border bg-white shadow-sm object-contain"
                        />
                    )
                ) : activeItem ? (
                    /* History Scan Data & Table Preview */
                    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                        <div className="border-2 border-black bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4">
                                <div>
                                    <div className="label-eyebrow text-black">Historical Scan Preview</div>
                                    <h3 className="font-display text-lg font-bold text-black mt-1">
                                        {activeItem.filename || "Extracted Invoice"}
                                    </h3>
                                </div>
                                <span className="bg-[#E6FF00] border border-black px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-black">
                                    Saved Item
                                </span>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs mb-4">
                                <div className="border border-zinc-200 bg-zinc-50 p-2.5">
                                    <span className="text-[10px] uppercase text-zinc-400 flex items-center gap-1 mb-0.5">
                                        <Building size={10} /> Vendor
                                    </span>
                                    <span className="font-semibold text-black block truncate">
                                        {activeItem.meta?.vendor || "N/A"}
                                    </span>
                                </div>
                                <div className="border border-zinc-200 bg-zinc-50 p-2.5">
                                    <span className="text-[10px] uppercase text-zinc-400 flex items-center gap-1 mb-0.5">
                                        <Hash size={10} /> Invoice #
                                    </span>
                                    <span className="font-semibold text-black block truncate">
                                        {activeItem.meta?.invoice_number || "N/A"}
                                    </span>
                                </div>
                                <div className="border border-zinc-200 bg-zinc-50 p-2.5">
                                    <span className="text-[10px] uppercase text-zinc-400 flex items-center gap-1 mb-0.5">
                                        <Calendar size={10} /> Date
                                    </span>
                                    <span className="font-semibold text-black block truncate">
                                        {activeItem.meta?.date || "N/A"}
                                    </span>
                                </div>
                                <div className="border border-zinc-200 bg-zinc-50 p-2.5">
                                    <span className="text-[10px] uppercase text-zinc-400 flex items-center gap-1 mb-0.5">
                                        <Tag size={10} /> Currency
                                    </span>
                                    <span className="font-semibold text-black block truncate">
                                        {activeItem.meta?.currency || "N/A"}
                                    </span>
                                </div>
                                <div className="border border-zinc-200 bg-zinc-50 p-2.5">
                                    <span className="text-[10px] uppercase text-zinc-400 flex items-center gap-1 mb-0.5">
                                        <Globe size={10} /> Language
                                    </span>
                                    <span className="font-semibold text-black block truncate capitalize">
                                        {activeItem.meta?.language_detected || "N/A"}
                                    </span>
                                </div>
                                <div className="border border-zinc-200 bg-zinc-50 p-2.5">
                                    <span className="text-[10px] uppercase text-zinc-400 block mb-0.5">
                                        Data Stats
                                    </span>
                                    <span className="font-semibold text-black block truncate">
                                        {activeItem.rows?.length || 0} rows · {activeItem.columns?.length || 0} cols
                                    </span>
                                </div>
                            </div>

                            {/* Table Preview */}
                            {activeItem.columns?.length > 0 && (
                                <div className="space-y-2">
                                    <div className="font-mono text-xs font-bold uppercase text-zinc-700">
                                        Original Scan Table Structure
                                    </div>
                                    <div className="max-h-72 overflow-auto border border-zinc-300 bg-white">
                                        <table className="w-full text-left font-mono text-xs border-collapse">
                                            <thead className="bg-zinc-100 border-b border-zinc-300">
                                                <tr>
                                                    {activeItem.columns.map((col, idx) => (
                                                        <th key={idx} className="p-2 border-r border-zinc-300 font-bold text-black uppercase">
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(activeItem.rows || []).slice(0, 10).map((row, rIdx) => (
                                                    <tr key={rIdx} className="border-b border-zinc-200">
                                                        {activeItem.columns.map((col, cIdx) => (
                                                            <td key={cIdx} className="p-2 border-r border-zinc-200 text-zinc-800">
                                                                {row[col] ?? ""}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {activeItem.rows?.length > 10 && (
                                            <div className="p-2 text-center font-mono text-[11px] text-zinc-500 bg-zinc-50 border-t border-zinc-200">
                                                + {activeItem.rows.length - 10} more rows (view & edit full table on the right grid)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center p-6">
                        <FileText
                            className="text-zinc-400 mb-3"
                            size={48}
                            strokeWidth={1.2}
                        />
                        <p className="font-mono text-xs font-semibold text-zinc-600">No document preview available</p>
                        <p className="font-mono text-[11px] text-zinc-400 mt-1 max-w-xs">
                            Upload a file or select a scan from history to preview.
                        </p>
                    </div>
                )}

                {processing && (
                    <div
                        data-testid="processing-overlay"
                        className="pointer-events-none absolute inset-0 overflow-hidden bg-black/10"
                    >
                        <div className="scan-laser absolute left-0 right-0 top-0 h-1" />
                        <div className="absolute bottom-6 left-6 right-6 border border-black bg-white p-4 font-mono text-xs shadow-lg">
                            <div className="label-eyebrow text-black">
                                Terminal
                            </div>
                            <div className="mt-2 space-y-1 text-black">
                                <div>{"> reading document ..."}</div>
                                <div>
                                    {
                                        "> detecting language + table structure ..."
                                    }
                                </div>
                                <div>{"> extracting rows to json ..."}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

