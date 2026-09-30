"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ChatMessagePayload, SystemMessagePayload } from "@/lib/realtimeProtocol";

export type ChatItem =
  | { type: "message"; data: ChatMessagePayload }
  | { type: "system"; data: SystemMessagePayload };

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: ChatItem[];
  currentIdentity: string;
  onSendMessage: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  items,
  currentIdentity,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsNearBottom(distanceFromBottom < 60);
  };

  useEffect(() => {
    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [items, isNearBottom, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <aside
      aria-label="Meeting Chat"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-[#262830] bg-[#16171b] shadow-2xl transition-all duration-200 sm:w-80"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-[#262830] px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#0e72ed]" />
          <h3 className="text-sm font-bold text-white">Meeting Chat</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-[#9ba1b0] hover:bg-[#252830] hover:text-white transition-colors cursor-pointer"
          aria-label="Close Chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text"
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252830] text-[#9ba1b0]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">No messages yet</p>
              <p className="text-[11px] text-[#9ba1b0] mt-0.5">Start the conversation with your team.</p>
            </div>
          </div>
        ) : (
          items.map((item) => {
            if (item.type === "system") {
              return (
                <div
                  key={item.data.id}
                  className="flex items-center justify-center my-2 text-center"
                >
                  <span className="rounded-full bg-[#252830] px-3 py-1 text-[10px] font-medium text-[#9ba1b0]">
                    {item.data.message}
                  </span>
                </div>
              );
            }

            const msg = item.data;
            const isMe = msg.senderIdentity === currentIdentity;

            return (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1 ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-bold text-[#cbd5e1]">
                    {isMe ? "You" : msg.senderName}
                  </span>
                  <span className="text-[10px] text-[#6b7280]">
                    {format(new Date(msg.timestamp), "h:mm a")}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed break-words ${
                    isMe
                      ? "bg-[#0e72ed] text-white rounded-tr-none"
                      : "bg-[#252830] text-[#f1f5f9] rounded-tl-none border border-[#34394a]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#262830] bg-[#1a1c22]">
        <div className="flex items-end gap-2 rounded-lg border border-[#34394a] bg-[#121316] p-2 focus-within:border-[#0e72ed] transition-colors">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none bg-transparent text-xs text-white placeholder:text-[#6b7280] focus:outline-none max-h-24 overflow-y-auto leading-relaxed"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0e72ed] text-white transition-opacity disabled:opacity-30 hover:bg-[#0b5cdb] cursor-pointer"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};
