import React from "react";
import { FileText } from "lucide-react";

export const DocumentPreview = ({ file, previewUrl, processing }) => {
    const isPdf = file?.type === "application/pdf";
    return (
        <div className="relative flex h-full flex-col border-r border-border bg-[#f4f4f5]">
            <div className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
                <div className="label-eyebrow">source · {file?.name}</div>
                <div className="font-mono text-[11px] text-zinc-500">
                    {file
                        ? `${(file.size / 1024).toFixed(1)} KB · ${file.type || "unknown"}`
                        : ""}
                </div>
            </div>
            <div
                className="relative flex-1 overflow-auto p-6"
                data-testid="document-preview"
            >
                {previewUrl ? (
                    isPdf ? (
                        <iframe
                            title="pdf preview"
                            src={previewUrl}
                            className="h-full min-h-[600px] w-full border border-border bg-white"
                        />
                    ) : (
                        <img
                            src={previewUrl}
                            alt="uploaded document"
                            className="mx-auto max-h-full max-w-full border border-border bg-white shadow-sm"
                        />
                    )
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <FileText
                            className="text-zinc-400"
                            size={48}
                            strokeWidth={1.2}
                        />
                    </div>
                )}
                {processing && (
                    <div
                        data-testid="processing-overlay"
                        className="pointer-events-none absolute inset-0 overflow-hidden bg-black/10"
                    >
                        <div className="scan-laser absolute left-0 right-0 top-0 h-1" />
                        <div className="absolute bottom-6 left-6 right-6 border border-black bg-white p-4 font-mono text-xs">
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
