"use client";

import "katex/dist/katex.min.css";
import { Button } from "@/components/ui/button";
import { Copy, Check, User } from "lucide-react";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  onCopy?: () => void;
}

export default function ChatMessage({
  role,
  content,
  onCopy,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) return onCopy();

    navigator.clipboard.writeText(content).then(() => {
      toast.success("Copied to clipboard!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (role === "user") {
    return (
      <div className="flex justify-end px-2 sm:px-4">
        <div className="w-full max-w-[90%] sm:max-w-2xl bg-primary/15 text-foreground rounded-lg px-4 py-3 break-words text-sm sm:text-base">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-4 px-2 sm:px-4">
      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-foreground text-xs sm:text-sm font-semibold flex-shrink-0">
        <User />
      </div>

      <div className="flex-1 max-w-[90%] sm:max-w-3xl space-y-2 sm:space-y-3">
        <div className="text-foreground text-sm sm:text-base space-y-1 sm:space-y-2 break-words overflow-x-hidden">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-2 h-7 sm:h-8 px-2"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
