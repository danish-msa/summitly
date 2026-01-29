"use client";

import * as React from "react";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiChat, AiDataset } from "../types";

type Props = {
  chat: AiChat;
  datasetPreviewEnabled: boolean;
  onOpenPreview?: () => void;
};

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, data: unknown) {
  downloadTextFile(filename, JSON.stringify(data, null, 2), "application/json");
}

function downloadCsv(filename: string, csv: string) {
  downloadTextFile(filename, csv, "text/csv");
}

function DatasetBlock({
  dataset,
  previewEnabled,
  onOpenPreview,
}: {
  dataset: AiDataset;
  previewEnabled: boolean;
  onOpenPreview?: () => void;
}) {
  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <p className="text-xs font-semibold text-slate-800">Dataset available</p>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => downloadJson(`${dataset.name}.json`, dataset.json)}
          className="inline-flex items-center gap-2 text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 rounded"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download JSON
        </button>
        <button
          type="button"
          onClick={() => downloadCsv(`${dataset.name}.csv`, dataset.csv)}
          className="inline-flex items-center gap-2 text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 rounded"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download CSV
        </button>
        <button
          type="button"
          onClick={onOpenPreview}
          className="inline-flex items-center gap-2 text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 rounded cursor-pointer"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          {previewEnabled ? "Previewing" : "Preview"}
        </button>
      </div>

      {previewEnabled && (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {dataset.previewColumns.map((c) => (
                    <th
                      key={c}
                      className="px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.previewRows.map((row, idx) => (
                  <tr key={idx} className="border-t border-slate-200">
                    {dataset.previewColumns.map((c) => (
                      <td key={c} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                        {String(row[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function AiThread({ chat, datasetPreviewEnabled, onOpenPreview }: Props) {
  // Scroll anchor (internal scroll only)
  const endRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chat.id, chat.messages.length]);

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {chat.messages.map((m) => {
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end gap-3">
                  <div className="max-w-[760px] rounded-2xl bg-sky-500 px-4 py-3 text-sm text-white shadow-sm">
                    {m.userText}
                  </div>
                  <div className="h-9 w-9 shrink-0 rounded-full bg-slate-900/10 flex items-center justify-center">
                    <span className="text-slate-700 text-xs font-semibold" aria-hidden="true">
                      U
                    </span>
                  </div>
                </div>
              );
            }

            const a = m.assistant;
            return (
              <div key={m.id} className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-sky-50 flex items-center justify-center">
                  <Image
                    src="/images/logo/ai-icon.png"
                    alt=""
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px] object-contain"
                    aria-hidden="true"
                  />
                </div>

                <div className="w-full max-w-[900px] rounded-2xl bg-white px-5 py-4 shadow-sm border border-slate-100">
                  <p className="text-sm text-slate-800">{a?.intro}</p>

                  {a?.sections?.map((s) => (
                    <div key={s.title} className="mt-4">
                      <p className="text-xs font-semibold text-slate-800">{s.title}:</p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-700 list-disc pl-5">
                        {s.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {a?.outro && <p className="mt-4 text-xs text-slate-700">{a.outro}</p>}

                  <div className="mt-4 flex items-center gap-3 text-slate-400">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
                      aria-label="Thumbs up"
                    >
                      <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
                      aria-label="Thumbs down"
                    >
                      <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  {a?.dataset && (
                    <DatasetBlock
                      dataset={a.dataset}
                      previewEnabled={datasetPreviewEnabled}
                      onOpenPreview={onOpenPreview}
                    />
                  )}
                </div>
              </div>
            );
          })}

          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}

