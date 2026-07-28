import React, { useState } from "react";
import { Plus, Trash2, Download, RefreshCw } from "lucide-react";

const isRTL = (text) => /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/.test(text || "");

export const DataGrid = ({
    columns,
    rows,
    setColumns,
    setRows,
    onDownload,
    onReExtract,
    meta,
    downloading,
}) => {
    const [newColName, setNewColName] = useState("");

    const updateCell = (rIdx, col, val) => {
        setRows((prev) => {
            const cp = [...prev];
            cp[rIdx] = { ...cp[rIdx], [col]: val };
            return cp;
        });
    };

    const addRow = () => {
        const blank = Object.fromEntries(columns.map((c) => [c, ""]));
        setRows((prev) => [...prev, blank]);
    };

    const deleteRow = (idx) => {
        setRows((prev) => prev.filter((_, i) => i !== idx));
    };

    const addColumn = () => {
        const name = newColName.trim();
        if (!name || columns.includes(name)) return;
        setColumns((prev) => [...prev, name]);
        setRows((prev) => prev.map((r) => ({ ...r, [name]: "" })));
        setNewColName("");
    };

    const deleteColumn = (col) => {
        setColumns((prev) => prev.filter((c) => c !== col));
        setRows((prev) =>
            prev.map((r) => {
                const cp = { ...r };
                delete cp[col];
                return cp;
            }),
        );
    };

    return (
        <div className="flex h-full flex-col bg-white">
            {/* meta bar */}
            <div className="border-b border-border bg-white px-6 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                        <div className="label-eyebrow">02 · Editable table</div>
                        <h2 className="font-display mt-2 text-2xl font-bold tracking-tight">
                            {rows.length} row{rows.length === 1 ? "" : "s"} ·{" "}
                            {columns.length} column
                            {columns.length === 1 ? "" : "s"}
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                        {meta?.vendor && (
                            <span>
                                vendor ::{" "}
                                <span className="text-black">
                                    {meta.vendor}
                                </span>
                            </span>
                        )}
                        {meta?.invoice_number && (
                            <span>
                                inv ::{" "}
                                <span className="text-black">
                                    {meta.invoice_number}
                                </span>
                            </span>
                        )}
                        {meta?.date && (
                            <span>
                                date ::{" "}
                                <span className="text-black">{meta.date}</span>
                            </span>
                        )}
                        {meta?.currency && (
                            <span>
                                ccy ::{" "}
                                <span className="text-black">
                                    {meta.currency}
                                </span>
                            </span>
                        )}
                        {meta?.language_detected && (
                            <span>
                                lang ::{" "}
                                <span className="text-black">
                                    {meta.language_detected}
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* table */}
            <div className="flex-1 overflow-auto" data-testid="data-grid">
                {columns.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-12 text-center">
                        <div>
                            <div className="label-eyebrow text-[#FF2A00]">
                                empty
                            </div>
                            <p className="mt-3 font-mono text-sm text-zinc-600">
                                No table was found in this bill. Add columns
                                manually or re-scan a clearer image.
                            </p>
                        </div>
                    </div>
                ) : (
                    <table className="w-full border-collapse font-mono text-sm">
                        <thead className="sticky top-0 z-10 bg-black text-white">
                            <tr>
                                <th className="w-12 border-r border-white/20 px-2 py-3 text-left text-[11px] uppercase tracking-widest">
                                    #
                                </th>
                                {columns.map((c) => (
                                    <th
                                        key={c}
                                        className="border-r border-white/20 px-3 py-3 text-left text-[11px] uppercase tracking-widest"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span>{c}</span>
                                            <button
                                                data-testid={`delete-column-${c}`}
                                                onClick={() => deleteColumn(c)}
                                                className="text-white/60 hover:text-[#E6FF00]"
                                                title="Remove column"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                <th className="w-12 px-2 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rIdx) => (
                                <tr
                                    key={rIdx}
                                    className="border-b border-border transition-colors hover:bg-[#fafafa]"
                                >
                                    <td className="border-r border-border px-2 py-1 text-center text-[11px] text-zinc-500">
                                        {String(rIdx + 1).padStart(2, "0")}
                                    </td>
                                    {columns.map((c) => {
                                        const v = row[c] ?? "";
                                        return (
                                            <td
                                                key={c}
                                                className="border-r border-border p-0"
                                            >
                                                <input
                                                    dir={
                                                        isRTL(v)
                                                            ? "rtl"
                                                            : "auto"
                                                    }
                                                    className="cell-input"
                                                    value={v}
                                                    data-testid={`cell-${rIdx}-${c}`}
                                                    onChange={(e) =>
                                                        updateCell(
                                                            rIdx,
                                                            c,
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                        );
                                    })}
                                    <td className="px-2 text-center">
                                        <button
                                            data-testid={`delete-row-${rIdx}`}
                                            onClick={() => deleteRow(rIdx)}
                                            className="text-zinc-400 hover:text-[#FF2A00]"
                                            title="Delete row"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* footer actions */}
            <div className="border-t border-border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            data-testid="add-row-btn"
                            onClick={addRow}
                            disabled={columns.length === 0}
                            className="inline-flex items-center gap-2 border border-black bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white disabled:opacity-40"
                        >
                            <Plus size={12} /> Row
                        </button>
                        <div className="flex items-stretch">
                            <input
                                value={newColName}
                                onChange={(e) => setNewColName(e.target.value)}
                                placeholder="New column"
                                data-testid="new-column-input"
                                className="w-40 border border-black bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-widest outline-none placeholder:text-zinc-400"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addColumn();
                                }}
                            />
                            <button
                                data-testid="add-column-btn"
                                onClick={addColumn}
                                className="inline-flex items-center gap-2 border border-l-0 border-black bg-black px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white transition-colors hover:bg-[#E6FF00] hover:text-black"
                            >
                                <Plus size={12} /> Column
                            </button>
                        </div>
                        {onReExtract && (
                            <button
                                data-testid="re-extract-btn"
                                onClick={onReExtract}
                                className="inline-flex items-center gap-2 border border-black bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
                            >
                                <RefreshCw size={12} /> Re-scan
                            </button>
                        )}
                    </div>
                    <button
                        data-testid="download-excel-btn"
                        onClick={onDownload}
                        disabled={downloading || columns.length === 0}
                        className="inline-flex items-center gap-2 border border-black bg-[#E6FF00] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-[#E6FF00] disabled:opacity-40"
                    >
                        <Download size={14} />{" "}
                        {downloading ? "Preparing ..." : "Download .xlsx"}
                    </button>
                </div>
            </div>
        </div>
    );
};
