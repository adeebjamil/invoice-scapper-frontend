import React from "react";
import { FileSpreadsheet, Rewind } from "lucide-react";

export const AppHeader = ({ onReset, status }) => {
    return (
        <header
            data-testid="app-header"
            className="sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur-xl"
        >
            <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center border border-black bg-black text-[#E6FF00]">
                        <FileSpreadsheet size={18} strokeWidth={2.25} />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-display text-lg sm:text-xl font-bold tracking-tighter">
                            BILL/SHEET
                        </span>
                        <span className="label-eyebrow mt-1 text-[10px] sm:text-xs">
                            multilingual ocr → xlsx
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="hidden sm:block label-eyebrow" data-testid="header-status">
                        status ::{" "}
                        <span className="text-black">{status || "idle"}</span>
                    </div>
                    {onReset && (
                        <button
                            data-testid="header-reset-btn"
                            onClick={onReset}
                            className="group flex items-center gap-2 border border-black bg-white px-3 py-1.5 sm:px-4 sm:py-2 font-mono text-xs uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
                        >
                            <Rewind
                                size={14}
                                className="transition-transform group-hover:-translate-x-0.5"
                            />
                            <span className="hidden sm:inline">New Bill</span>
                            <span className="sm:hidden">New</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};