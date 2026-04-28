import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import type { ChatMessage } from "../../hooks/useChat";

interface Props {
  messages: ChatMessage[];
  currentUserId: string;
  otherName: string;
  sending: boolean;
  onSend: (content: string) => Promise<void>;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatBox({ messages, currentUserId, otherName, sending, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to latest message whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    await onSend(text);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <MessageCircle size={15} className="text-cobalt shrink-0" />
        <p className="text-sm font-semibold text-gray-800">Chat with {otherName}</p>
      </div>

      {/* Message list */}
      <div className="flex flex-col gap-2 p-4 h-56 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-gray-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 max-w-[78%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
              >
                {!isMe && (
                  <span className="text-[11px] font-medium text-gray-400 px-1">
                    {otherName}
                  </span>
                )}
                <div
                  className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-cobalt text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  } ${msg.id.startsWith("temp-") ? "opacity-60" : ""}`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          maxLength={2000}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cobalt/30 focus:border-cobalt transition"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-cobalt text-white transition hover:bg-cobalt-dark disabled:opacity-40 cursor-pointer border-none shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
