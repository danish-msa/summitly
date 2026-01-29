"use client";

import * as React from "react";
import { Paperclip, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string) => void;
  className?: string;
};

export function AiComposer({ value, onChange, onSend, className }: Props) {
  const canSend = value.trim().length > 0;

  return (
    <div className={cn("shrink-0 border-t border-slate-200 bg-white/70 backdrop-blur", className)}>
      <div className="mx-auto max-w-3xl px-4 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) onSend(value);
          }}
        >
          <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
              aria-label="Attach a file"
            >
              <Paperclip className="h-4 w-4" aria-hidden="true" />
            </button>

            <label className="sr-only" htmlFor="ai-chat-composer"
              >Ask a question</label
            >
            <input
              id="ai-chat-composer"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ask a question to get started"
              className="h-12 w-full border-0 rounded-none bg-transparent px-2 pr-14 text-sm text-foreground placeholder:text-slate-400 ring-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            <button
              type="submit"
              disabled={!canSend}
              className={cn(
                "absolute right-2 inline-flex h-9 w-9 items-center justify-center rounded-xl shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60",
                canSend
                  ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              )}
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

