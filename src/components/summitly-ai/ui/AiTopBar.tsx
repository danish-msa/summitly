"use client";

import * as React from "react";
import Image from "next/image";
import { PanelLeft, SquarePen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type AiTopBarProps = {
  className?: string;
  historyOpen?: boolean;
  datasetPreviewEnabled?: boolean;
  onNewChat?: () => void;
  onToggleHistory?: (open: boolean) => void;
  onToggleDatasetPreview?: (enabled: boolean) => void;
};

export function AiTopBar({
  className,
  historyOpen = false,
  datasetPreviewEnabled = false,
  onNewChat,
  onToggleHistory,
  onToggleDatasetPreview,
}: AiTopBarProps) {
  return (
    <div className={cn("w-full border-b border-slate-200 bg-white", className)}>
      <div className="container-1400 mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        {/* Left: New chat + history toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
            aria-label="Create a new chat"
          >
            <SquarePen className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-pressed={historyOpen}
            onClick={() => onToggleHistory?.(!historyOpen)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60",
              historyOpen && "bg-slate-100"
            )}
            aria-label="Toggle chat history"
          >
            <PanelLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Middle: Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/images/logo/ai-icon.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-slate-800">Summitly.AI</span>
        </div>

        {/* Right: Dataset Preview toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Dataset Preview</span>
          <Switch
            checked={datasetPreviewEnabled}
            onCheckedChange={(checked) => onToggleDatasetPreview?.(checked)}
            aria-label="Toggle dataset preview"
          />
        </div>
      </div>
    </div>
  );
}

