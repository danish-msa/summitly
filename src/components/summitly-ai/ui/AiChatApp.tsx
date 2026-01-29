"use client";

import * as React from "react";
import { AiNoScroll } from "./AiNoScroll";
import { AiTopBar } from "./AiTopBar";
import { AiChatLanding } from "./AiChatLanding";
import { AiSidebar } from "./AiSidebar";
import { AiThread } from "./AiThread";
import { AiComposer } from "./AiComposer";
import { DatasetPreviewPanel } from "./DatasetPreviewPanel";
import type { AiChat, AiChatMessage } from "../types";
import { getMockChats } from "../mock/mockChats";

function isoNow() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

const DEFAULT_PREVIEW_WIDTH = 320;
const MIN_PREVIEW_WIDTH = 280;
const MAX_PREVIEW_WIDTH = 640;

export function AiChatApp() {
  const [chats, setChats] = React.useState<AiChat[]>(() => getMockChats());
  const [activeChatId, setActiveChatId] = React.useState<string>("");
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [datasetPreviewEnabled, setDatasetPreviewEnabled] = React.useState(false);
  const [previewPanelOpen, setPreviewPanelOpen] = React.useState(false);
  const [previewPanelWidth, setPreviewPanelWidth] = React.useState(DEFAULT_PREVIEW_WIDTH);
  const [isResizingPreview, setIsResizingPreview] = React.useState(false);
  const resizeStartRef = React.useRef<{ x: number; width: number } | null>(null);
  const [draft, setDraft] = React.useState("");

  const handlePreviewResizeStart = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingPreview(true);
    resizeStartRef.current = { x: e.clientX, width: previewPanelWidth };
  }, [previewPanelWidth]);

  React.useEffect(() => {
    if (!isResizingPreview) return;
    const onMove = (e: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;
      const deltaX = start.x - e.clientX;
      const next = Math.min(MAX_PREVIEW_WIDTH, Math.max(MIN_PREVIEW_WIDTH, start.width + deltaX));
      setPreviewPanelWidth(next);
      resizeStartRef.current = { x: e.clientX, width: next };
    };
    const onUp = () => {
      setIsResizingPreview(false);
      resizeStartRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingPreview]);

  const activeChat = React.useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId]
  );

  const handleNewChat = () => {
    const id = newId("chat");
    const createdAt = isoNow();
    const chat: AiChat = {
      id,
      title: "New chat",
      createdAt,
      updatedAt: createdAt,
      messages: [],
    };
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(id);
    setDraft("");
    setHistoryOpen(true);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      const next = chats.find((c) => c.id !== chatId)?.id ?? "";
      setActiveChatId(next);
    }
  };

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // If no active chat, create a new one
    let chatToUse = activeChat;
    if (!chatToUse) {
      const id = newId("chat");
      const createdAt = isoNow();
      chatToUse = {
        id,
        title: trimmed.length > 50 ? trimmed.slice(0, 50) + "..." : trimmed,
        createdAt,
        updatedAt: createdAt,
        messages: [],
      };
      setChats((prev) => [chatToUse!, ...prev]);
      setActiveChatId(chatToUse.id);
    }

    const userMsg: AiChatMessage = {
      id: newId("m"),
      role: "user",
      createdAt: isoNow(),
      userText: trimmed,
    };

    // Mock assistant response (UI-only)
    const assistantMsg: AiChatMessage = {
      id: newId("m"),
      role: "assistant",
      createdAt: isoNow(),
      assistant: {
        intro: "Here’s a quick mock response based on your prompt (UI only).",
        sections: [
          { title: "Key points", bullets: ["Mock insight #1", "Mock insight #2", "Mock insight #3"] },
        ],
        outro: "Want me to refine this by price, beds/baths, or neighborhood?",
        dataset: chatToUse.messages[1]?.assistant?.dataset, // reuse the mock dataset when available
      },
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatToUse!.id) return c;
        const updatedAt = isoNow();
        const nextTitle = c.title === "New chat" || c.title.length > 50 ? (trimmed.length > 50 ? trimmed.slice(0, 50) + "..." : trimmed) : c.title;
        return {
          ...c,
          title: nextTitle,
          updatedAt,
          messages: [...c.messages, userMsg, assistantMsg],
        };
      })
    );
    setDraft("");
  };

  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-16 flex flex-col">
      <AiNoScroll />

      <AiTopBar
        className="shrink-0"
        historyOpen={historyOpen}
        datasetPreviewEnabled={datasetPreviewEnabled}
        onNewChat={handleNewChat}
        onToggleHistory={setHistoryOpen}
        onToggleDatasetPreview={(enabled) => {
          setDatasetPreviewEnabled(enabled);
          setPreviewPanelOpen(enabled);
        }}
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex overflow-hidden">
          {/* Search History – slides in from left */}
          <div
            className={`overflow-hidden shrink-0 transition-[width] duration-300 ease-out motion-reduce:transition-none ${historyOpen ? "w-[320px]" : "w-0"}`}
            aria-hidden={!historyOpen}
          >
            <div
              className={`h-full w-[320px] transition-transform duration-300 ease-out motion-reduce:transition-none ${historyOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
              <AiSidebar
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={setActiveChatId}
                onDeleteChat={handleDeleteChat}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              {activeChat && activeChat.messages.length > 0 ? (
                <AiThread
                  chat={activeChat}
                  datasetPreviewEnabled={datasetPreviewEnabled}
                  onOpenPreview={() => {
                    setPreviewPanelOpen(true);
                    setDatasetPreviewEnabled(true);
                  }}
                />
              ) : (
                <div className="h-full">
                  <AiChatLanding
                    className="h-full"
                    onSend={handleSend}
                  />
                </div>
              )}
            </div>

            {activeChat && activeChat.messages.length > 0 && (
              <AiComposer
                value={draft}
                onChange={setDraft}
                onSend={handleSend}
              />
            )}
          </div>

          {/* Dataset Preview – slides in from right, draggable to resize */}
          <div
            className={`overflow-hidden shrink-0 ${!isResizingPreview ? "transition-[width] duration-300 ease-out motion-reduce:transition-none" : ""}`}
            style={{ width: previewPanelOpen ? previewPanelWidth : 0 }}
            aria-hidden={!previewPanelOpen}
          >
            <div
              className={`h-full flex transition-transform duration-300 ease-out motion-reduce:transition-none ${previewPanelOpen ? "translate-x-0" : "translate-x-full"}`}
              style={{ width: previewPanelWidth }}
            >
              <div
                role="separator"
                aria-orientation="vertical"
                aria-valuenow={previewPanelWidth}
                aria-valuemin={MIN_PREVIEW_WIDTH}
                aria-valuemax={MAX_PREVIEW_WIDTH}
                aria-label="Resize dataset preview panel"
                onMouseDown={handlePreviewResizeStart}
                className="w-1 shrink-0 cursor-col-resize touch-none bg-slate-200 hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
              />
              <DatasetPreviewPanel width={previewPanelWidth} className="flex-1 min-w-0" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

