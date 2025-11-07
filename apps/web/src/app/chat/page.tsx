"use client";

import "katex/dist/katex.min.css";
import { useState, useEffect, useRef } from "react";
import ChatMessage from "@/app/chat/components/Message";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/app/chat/components/Input";
import { chatWithSyllabus, Message } from "@/ai/flows/chat-with-syllabus";
import { generateModuleTasks } from "@/ai/flows/generate-module-tasks";
import Header from "@/app/chat/components/Header";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function ChatArea() {
  const [moduleTitle, setModuleTitle] = useState("Loading title...");
  const [moduleContent, setModuleContent] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Why do I need to study this?",
    "What is the purpose of this module?",
    "How can I apply this in real life?",
  ]);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages, loading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title") || "AI Chat";
    const content = params.get("content") || "";
    setModuleTitle(title);
    setModuleContent(content);
  }, []);

  useEffect(() => {
    if (!moduleContent || moduleTitle === "Loading title...") return;
    setLoading(true);
    setError(null);
    generateModuleTasks({ moduleContent, moduleTitle })
      .then((result) => {
        if (result.introductoryMessage) {
          setMessages([{ role: "assistant", content: result.introductoryMessage }]);
        }
        setSuggestions(result.suggestions || []);
      })
      .catch(() => setError("Failed to generate initial tasks and related topics."))
      .finally(() => setLoading(false));
  }, [moduleContent, moduleTitle]);

  const handleSend = async (message: string) => {
    if (!message.trim() || loading) return;
    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setSuggestions([]);
    setLoading(true);
    setError(null);

    try {
      const systemMessage: Message = {
        role: "system",
        content: `You are an expert assistant for the course module: ${moduleTitle}.\nModule Content:\n${moduleContent}`,
      };

      const chatHistoryForApi = [systemMessage, ...messages.filter((m) => m.role !== "system")];
      const result = await chatWithSyllabus({
        history: chatHistoryForApi,
        message,
        model: selectedModel,
      });

      const aiMessage: Message = { role: "assistant", content: result.response };
      setMessages((prev) => [...prev, aiMessage]);
      setSuggestions(result.suggestions || []);
    } catch (err) {
      console.error(err);
      setError("Sorry, something went wrong. Please try again.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => handleSend(text);
  const handleModelChange = (model: string) => setSelectedModel(model);

  const isInitial = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[#F7F7F8] dark:bg-gradient-to-b from-[#22283E] to-[#26387C]">
      {!isInitial && (
        <div className="sticky top-0 z-50 px-6 py-2 bg-[#F7F7F8]/80 dark:bg-[#22283E]/80 backdrop-blur-md border-b border-border">
          <Header />
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-6 py-4" id="chat-scroll-area">
          {isInitial ? (
            <div className="relative flex flex-col items-center justify-center text-center h-full">
              <div className="absolute top-0 left-0">
                <SidebarTrigger className="-ml-1" />
              </div>
              <div className="absolute top-0 right-0">
                <ThemeToggle />
              </div>

              <h2
                className="text-3xl font-bold mb-6
                bg-[radial-gradient(50%_335.34%_at_50%_50%,#B56DFC_0%,#7B39FF_100%)]
                bg-clip-text text-transparent"
              >
                BeyondSyllabus
              </h2>

              <div className="w-full max-w-3xl mb-4">
                <ChatInput
                  onSend={handleSend}
                  onModelChange={handleModelChange}
                  placeholder="Ask anything..."
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <p className="text-sm mb-3 font-medium">Suggestions:</p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {suggestions.map((s, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="outline"
                    onClick={() => handleSuggestionClick(s)}
                    disabled={loading}
                    className="rounded-full text-xs sm:text-sm px-3 py-1.5
                    max-w-[90%] sm:max-w-[400px]
                    whitespace-normal break-words text-center
                    flex-1 sm:flex-none hover:text-white ring-2 ring-[#B56DFC]"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-4 mt-5">
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={idx}
                    role={msg.role as "user" | "assistant"}
                    content={msg.content}
                  />
                ))}

                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 justify-start">
                    {suggestions.map((s, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        onClick={() => handleSuggestionClick(s)}
                        className="rounded-full text-xs sm:text-sm px-3 py-1.5
                        max-w-full sm:max-w-[400px]
                        whitespace-normal break-words hover:text-white h-auto text-left ring-2 ring-[#B56DFC]"
                        disabled={loading}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </>
          )}
        </div>
      </div>

      {!isInitial && (
        <div className="flex-none px-6 py-4 sticky bottom-0 backdrop-blur-md">
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