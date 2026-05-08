"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Role = "user" | "assistant" | "error";

interface QueryRecord {
  query: string;
  row_count: number;
  error: string | null;
}

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  queries?: QueryRecord[];
  iterations?: number;
}

const SUGGESTIONS = [
  "How many orders did I get yesterday?",
  "What's my best-selling item this month?",
  "Compare last week's revenue to the week before.",
  "Which day of the week is busiest?",
];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hey! I'm your Sales AI. Ask me anything about your sales — revenue, top sellers, peak hours, modifier breakdowns, or whatever you're curious about. I'll write SQL against your data and answer in plain English.",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function SalesAITab() {
  const { restaurantId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pending]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending || !restaurantId) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/sales-ai/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId, question: trimmed }),
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          detail = body.detail || detail;
        } catch {}
        throw new Error(detail);
      }

      const data: {
        answer: string;
        queries: QueryRecord[];
        iterations: number;
        error: string | null;
      } = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: data.answer,
          queries: data.queries,
          iterations: data.iterations,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "error",
          content:
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  const showSuggestions = messages.length === 1 && !pending;

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {messages.map((msg) => (
            <Bubble key={msg.id} message={msg} />
          ))}
          {pending && <ThinkingBubble />}
          {showSuggestions && (
            <div className="mt-2">
              <p className="text-xs text-capy-muted font-medium uppercase tracking-wide mb-2 px-1">
                Try asking…
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-3 py-1.5 text-sm text-capy-text bg-white border border-capy-border rounded-full hover:border-capy-text hover:bg-capy-bg transition-colors shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-capy-border bg-white px-4 py-3">
        <form
          className="max-w-3xl mx-auto flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
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
            placeholder={
              restaurantId
                ? "Ask about your sales — e.g. “How many Fatty Patties had extra cheese last 4 Thursday nights?”"
                : "Loading…"
            }
            rows={1}
            disabled={!restaurantId || pending}
            className="flex-1 resize-none rounded-2xl border border-capy-border bg-white px-4 py-2.5 text-sm text-capy-text placeholder:text-capy-muted focus:outline-none focus:border-capy-text transition-colors disabled:opacity-60"
            style={{ maxHeight: 160 }}
          />
          <button
            type="submit"
            disabled={!restaurantId || pending || !input.trim()}
            className="flex-shrink-0 h-10 px-4 rounded-2xl bg-capy-green text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 transition"
          >
            {pending ? "…" : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="self-end max-w-[80%] bg-capy-green text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm">
        {message.content}
      </div>
    );
  }
  if (message.role === "error") {
    return (
      <div className="self-start max-w-[90%] bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-2.5 text-sm">
        {message.content}
      </div>
    );
  }
  return (
    <div className="self-start max-w-[90%] flex flex-col gap-2">
      <div className="bg-white border border-capy-border rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-capy-text whitespace-pre-wrap shadow-sm">
        {message.content}
      </div>
      {message.queries && message.queries.length > 0 && (
        <QueryDetails queries={message.queries} iterations={message.iterations} />
      )}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="self-start bg-white border border-capy-border rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-1.5">
        <Dot delay={0} />
        <Dot delay={0.15} />
        <Dot delay={0.3} />
        <span className="ml-2 text-xs text-capy-muted">Querying your data…</span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-capy-muted animate-bounce"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

function QueryDetails({
  queries,
  iterations,
}: {
  queries: QueryRecord[];
  iterations?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="group bg-white/60 border border-capy-border rounded-xl text-xs"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer select-none px-3 py-1.5 text-capy-muted hover:text-capy-text flex items-center gap-1.5">
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span>
          {queries.length === 1 ? "1 query" : `${queries.length} queries`}
          {iterations ? ` · ${iterations} step${iterations === 1 ? "" : "s"}` : ""}
        </span>
      </summary>
      <div className="px-3 pb-3 pt-1 flex flex-col gap-2">
        {queries.map((q, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-capy-muted">
              <span>Query {i + 1}</span>
              {q.error ? (
                <span className="text-red-500">error</span>
              ) : (
                <span>
                  {q.row_count} row{q.row_count === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <pre className="bg-capy-bg rounded-lg px-2.5 py-2 text-[11px] leading-snug text-capy-text whitespace-pre-wrap break-words font-mono">
              {q.query}
            </pre>
            {q.error && (
              <p className="text-[11px] text-red-600 break-words">{q.error}</p>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
