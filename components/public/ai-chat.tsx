"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Square, RotateCcw, Copy, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiDisclaimer } from "@/components/public/ai-disclaimer";
import { AI_MODE_LABELS, SUGGESTED_PROMPTS, type AiModeKey } from "@/lib/ai/config";
import { cn } from "@/lib/utils";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

const CLIENT_KEY = "pc_ai_client";
const HISTORY_KEY = "pc_ai_chat";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AiChat({
  enabled,
  availableModes,
  compact = false,
}: {
  enabled: boolean;
  availableModes: AiModeKey[];
  compact?: boolean;
}) {
  const modes = availableModes.length ? availableModes : (["GENERAL"] as AiModeKey[]);
  const [clientId, setClientId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AiModeKey>(modes[0]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initialise anonymous clientId + restore history.
  useEffect(() => {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(CLIENT_KEY, id);
    }
    setClientId(id);
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          messages?: ChatMessage[];
          mode?: AiModeKey;
          conversationId?: string;
        };
        if (saved.messages) setMessages(saved.messages);
        if (saved.mode && modes.includes(saved.mode)) setMode(saved.mode);
        if (saved.conversationId) setConversationId(saved.conversationId);
      }
    } catch {
      /* ignore corrupt history */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist + autoscroll.
  useEffect(() => {
    if (!clientId) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ messages, mode, conversationId }));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, mode, conversationId, clientId]);

  async function run(history: ChatMessage[]) {
    if (!clientId) return;
    const assistantId = newId();
    setMessages([...history, { id: assistantId, role: "assistant" as const, content: "" }]);
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          clientId,
          mode,
          conversationId,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "The assistant is unavailable right now.");
      }
      const convo = res.headers.get("X-Conversation-Id");
      if (convo) setConversationId(convo);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream.");
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        );
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && !m.content ? { ...m, content: `⚠️ ${message}` } : m,
        ),
      );
      toast.error(message);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming || !clientId) return;
    const userMsg: ChatMessage = { id: newId(), role: "user", content: trimmed };
    setInput("");
    void run([...messages, userMsg]);
  }

  function regenerate() {
    if (streaming) return;
    const history = [...messages];
    while (history.length && history[history.length - 1].role === "assistant") history.pop();
    if (!history.length) return;
    void run(history);
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function clearChat() {
    stop();
    setMessages([]);
    setConversationId(undefined);
    if (clientId) {
      void fetch(`/api/ai/conversations?clientId=${encodeURIComponent(clientId)}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied"),
      () => toast.error("Could not copy"),
    );
  }

  if (!enabled) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        The AI assistant is currently unavailable. Please check back later.
      </div>
    );
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Mode selector + actions */}
      <div className="flex items-center justify-between gap-2 border-b pb-2">
        <Select value={mode} onValueChange={(v) => setMode(v as AiModeKey)}>
          <SelectTrigger className="h-9 w-[200px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modes.map((m) => (
              <SelectItem key={m} value={m}>
                {AI_MODE_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearChat}
          disabled={empty && !streaming}
          aria-label="Clear chat"
        >
          <Trash2 className="h-4 w-4" /> Clear
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={cn("flex-1 space-y-4 overflow-y-auto py-4", compact ? "min-h-0" : "min-h-[40vh]")}
      >
        {empty ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" /> Ask me about pharmacy, medicines, careers
              or jobs
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS[mode].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-full border px-3 py-1.5 text-left text-xs hover:border-primary hover:bg-accent"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={m.id}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <>
                      <Markdown content={m.content} className="text-sm [&_p]:my-2" />
                      {!streaming && (
                        <div className="mt-1.5 flex gap-1">
                          <button
                            type="button"
                            onClick={() => copy(m.content)}
                            className="rounded p-1 text-muted-foreground hover:bg-background/60"
                            aria-label="Copy response"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          {i === messages.length - 1 && (
                            <button
                              type="button"
                              onClick={regenerate}
                              className="rounded p-1 text-muted-foreground hover:bg-background/60"
                              aria-label="Regenerate response"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex gap-1" aria-label="Assistant is typing">
                      <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
                    </span>
                  )
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <div className="border-t pt-2">
        <AiDisclaimer className="mb-2" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Type your question…"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {streaming ? (
            <Button type="button" variant="outline" size="icon" onClick={stop} aria-label="Stop">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim() || !clientId} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: delay }}
    />
  );
}
