"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ModelSelector from "./Model-Selector";
import { ChatInputProps } from "@/lib/types";

export function ChatInput({
  placeholder = "Send a message...",
  onSend,
  className,
  disabled = false,
  onModelChange,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedModel") || "openai/gpt-oss-120b";
    }
    return "openai/gpt-oss-120b";
  });

  useEffect(() => {
    onModelChange?.(selectedModel);
  }, [selectedModel, onModelChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSend && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className={cn(
        "relative border border-border rounded-3xl bg-[#DEDEDF] dark:bg-[#1B1B1B]",
        "p-4 px-6 py-4 transition-all duration-200",
        "shadow-[0_0_20px_5px_#D9D9D9] dark:shadow-[0_0_20px_5px_rgba(123,57,255,0.3)]",
        className
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent border-0 outline-none",
              "text-foreground placeholder:text-muted-foreground",
              "text-base leading-6 py-2",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ minHeight: "50px", maxHeight: "120px", height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
        </div>

        <Button
          variant={"outline"}
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
          className={cn(
            "flex items-center justify-center w-9 h-9 mt-1 rounded-full border border-border bg-purple-500 text-white",
            "transition-colors",
            (disabled || !message.trim()) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <ModelSelector value={selectedModel} onChange={setSelectedModel} />
      </div>
    </div>
  );
}
