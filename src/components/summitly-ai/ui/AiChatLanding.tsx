"use client";

import * as React from "react";
import { Paperclip, ArrowUp, Home, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = {
  id: string;
  icon: React.ReactNode;
  text: string;
};

const suggestions: Suggestion[] = [
  {
    id: "pool-92037",
    icon: <Home className="h-4 w-4 text-sky-600" aria-hidden="true" />,
    text: "Find me all single family homes for sale with a pool in 92037",
  },
  {
    id: "estimate-gig-harbor",
    icon: <DollarSign className="h-4 w-4 text-sky-600" aria-hidden="true" />,
    text: "What is the estimated value of 7209 48th Street Ct NW, Gig Harbor, WA?",
  },
];

export function AiChatLanding({
  className,
  onSend,
}: {
  className?: string;
  onSend?: (text: string) => void;
}) {
  const [value, setValue] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && onSend) {
      onSend(trimmed);
      setValue("");
    }
  };

  return (
    <section className={cn("w-full flex-1", className)}>
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:py-8">
        <div className="flex-1 flex flex-col justify-center mt-20">
          <header className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Ask me about real estate data
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              Search properties, get valuations, analyze markets, and discover investment opportunities.
            </p>
          </header>

          <div className="mt-8 sm:mt-10">
            <form
              className="mx-auto max-w-3xl"
              onSubmit={handleSubmit}
            >
              <div className="relative flex items-center rounded-2xl border border-sky-400/60 bg-white shadow-sm focus-within:border-sky-500">
                <button
                  type="button"
                  className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
                  aria-label="Attach a file"
                >
                  <Paperclip className="h-4 w-4" aria-hidden="true" />
                </button>

                <label className="sr-only" htmlFor="ai-prompt">
                  Ask a question
                </label>
                <input
                  id="ai-prompt"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Find me all single family homes for sale with a pool in 92037"
                  className="h-12 w-full border-0 rounded-none bg-transparent px-2 pr-14 text-sm text-foreground placeholder:text-muted-foreground ring-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />

                <button
                  type="submit"
                  disabled={!value.trim()}
                  className={cn(
                    "absolute right-2 inline-flex h-9 w-9 items-center justify-center rounded-xl shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60",
                    value.trim()
                      ? "bg-sky-500 text-white hover:bg-sky-600"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                  aria-label="Send"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>

            <div className="mx-auto mt-6 max-w-3xl">
              <p className="text-xs font-medium text-muted-foreground">Try asking:</p>
              <div className="mt-3 space-y-2">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setValue(s.text);
                      if (onSend) {
                        onSend(s.text);
                        setValue("");
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-foreground shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50">
                      {s.icon}
                    </span>
                    <span className="line-clamp-2">{s.text}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 rounded"
                >
                  See More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

