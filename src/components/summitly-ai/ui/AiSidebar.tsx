"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiChat } from "../types";

type Props = {
  chats: AiChat[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  className?: string;
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinLastDays(d: Date, days: number) {
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  return ms >= 0 && ms <= days * 24 * 60 * 60 * 1000;
}

export function AiSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  className,
}: Props) {
  const now = new Date();

  const sorted = React.useMemo(
    () =>
      [...chats].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [chats]
  );

  const today = sorted.filter((c) => isSameDay(new Date(c.updatedAt), now));
  const last30 = sorted.filter(
    (c) => !isSameDay(new Date(c.updatedAt), now) && isWithinLastDays(new Date(c.updatedAt), 30)
  );

  const Item = ({ chat }: { chat: AiChat }) => {
    const active = chat.id === activeChatId;
    return (
      <div
        className={cn(
          "group flex items-start justify-between gap-2 rounded-md px-3 py-2 cursor-pointer",
          active ? "bg-slate-100" : "hover:bg-slate-50"
        )}
        role="button"
        tabIndex={0}
        onClick={() => onSelectChat(chat.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onSelectChat(chat.id);
        }}
        aria-current={active ? "page" : undefined}
      >
        <p className="text-xs leading-5 text-slate-700 line-clamp-2 pr-2">
          {chat.title}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteChat(chat.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 rounded"
          aria-label="Delete chat"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "w-[320px] shrink-0 border-r border-slate-200 bg-white",
        className
      )}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-900">Search History</h2>
        </div>

        <div className="flex-1 overflow-auto px-2 py-3">
          {today.length > 0 && (
            <div className="px-2">
              <p className="text-[11px] font-semibold text-slate-700 mb-2">Today</p>
              <div className="space-y-1">
                {today.map((c) => (
                  <Item key={c.id} chat={c} />
                ))}
              </div>
            </div>
          )}

          {last30.length > 0 && (
            <div className="px-2 mt-6">
              <p className="text-[11px] font-semibold text-slate-700 mb-2">Last 30 Days</p>
              <div className="space-y-1">
                {last30.map((c) => (
                  <Item key={c.id} chat={c} />
                ))}
              </div>
            </div>
          )}

          {today.length === 0 && last30.length === 0 && (
            <p className="px-4 text-xs text-slate-500">No chats yet.</p>
          )}
        </div>
      </div>
    </aside>
  );
}

