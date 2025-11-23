"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check, Bot } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { ChatMessageProps } from "@/lib/types";
import { Streamdown } from "streamdown";
import { responseHelper } from "@/lib/chat-response";

export default function ChatMessage({
  role,
  content,
  onCopy,
}: ChatMessageProps & { status?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) return onCopy();

    navigator.clipboard.writeText(content).then(() => {
      toast.success("Copied to clipboard!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const ChatResponse = responseHelper(content);

  if (role === "user") {
    return (
      <div className="flex justify-end px-2 sm:px-4">
        <div className="w-auto max-w-[90%] sm:max-w-2xl bg-[#B56DFC] text-white rounded-lg rounded-br-none px-4 py-3 break-words text-sm sm:text-base">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-4 px-2 sm:px-4">
      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-foreground text-xs sm:text-sm font-semibold flex-shrink-0">
        <Bot className="h-6 w-6 text-[#B56DFC]" />
      </div>

      <div className="flex-1 max-w-[90%] sm:max-w-3xl space-y-2 sm:space-y-3">
        <div className="text-foreground text-sm sm:text-base space-y-2 sm:space-y-2 break-words overflow-x-hidden">
          <Streamdown>
            {ChatResponse}
          </Streamdown>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-2 h-7 sm:h-8 px-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <p>Copied</p>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <p>Copy</p>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
