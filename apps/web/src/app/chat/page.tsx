"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import ChatMessage from "@/app/chat/components/Message";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/app/chat/components/Input";
import { chatWithSyllabus, Message } from "@/ai/flows/chat-with-syllabus";
import Header from "@/app/chat/components/Header";

export default function ChatArea() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Why do I need to study this?",
    "What is the purpose of this module?",
    "How can I apply this in real life?",
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const result = await chatWithSyllabus({
        history: messages.filter((m) => m.role !== "system"),
        message,
        model: selectedModel,
      });

      const aiMessage: Message = {
        role: "assistant",
        content: result.response,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (model: string) => setSelectedModel(model);

  const isInitial = messages.length === 0;

  return (
    <div className="flex flex-col h-screen dark:bg-linear-to-b from-[#22283E] to-[#26387C]">
      <div className="flex-none px-6 py-1">
        <Header />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isInitial ? (
          <div className="flex flex-col items-center justify-center text-center h-full">
            <h2 className="text-3xl font-bold mb-6">BeyondSyllabus</h2>

            <div className="w-full max-w-3xl mb-4">
              <ChatInput
                onSend={handleSend}
                onModelChange={handleModelChange}
                placeholder="Ask anything..."
                disabled={loading}
                className="w-full"
              />
            </div>

            <p className="text-sm mb-3 font-medium">Try these:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedPrompts.map((prompt, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant={"outline"}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="rounded-full text-xs px-3 py-1.5 border-border hover:text-white"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                role={msg.role as "user" | "assistant"}
                content={msg.content}
                onCopy={() => {
                  navigator.clipboard.writeText(msg.content);
                  toast.success("Copied to clipboard!");
                }}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
      {!isInitial && (
        <div className="flex-none px-6 py-4 sticky bottom-0">
          <ChatInput
            onSend={handleSend}
            onModelChange={handleModelChange}
            placeholder="Ask anything..."
            disabled={loading}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
