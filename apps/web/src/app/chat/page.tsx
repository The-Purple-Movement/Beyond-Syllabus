"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatMessage from "@/app/chat/_components/ChatMessage";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/app/chat/_components/ChatInput";
import { chatWithSyllabus } from "@/ai/flows/chat-with-syllabus";
import { Message, ChatWithSyllabusOutput } from "@/lib/types";
import { generateModuleTasks } from "@/ai/flows/generate-module-tasks";
import Header from "@/app/chat/_components/ChatHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function ChatHome() {
  const [moduleTitle, setModuleTitle] = useState("Loading title...");
  const [moduleContent, setModuleContent] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setModuleTitle(params.get("title") || "");
    setModuleContent(params.get("content") || "");
  }, []);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages, loading]);

  useEffect(() => {
    if (!moduleContent || moduleTitle === "Loading title...") return;

    const initializeChat = async () => {
      setLoading(true);
      setError(null);

      try {
        const syllabusResult: ChatWithSyllabusOutput = await chatWithSyllabus({
          message: `You are a professional tutor.Provide an introductory message for the module "${moduleTitle}".Module content: ${moduleContent} `,
          subjectArea: moduleTitle,
          syllabusContext: moduleContent,
          history: [],
          model: selectedModel,
        });

        const tasksResult = await generateModuleTasks({ moduleContent, moduleTitle, model: selectedModel });

        const combinedContent = [syllabusResult.response, tasksResult.introductoryMessage]
          .filter(Boolean)
          .join("\n\n");

        setMessages([{ role: "assistant", content: combinedContent }]);
        setSuggestions(syllabusResult.suggestions || []);
      } catch (err) {
        console.error(err);
        setError("Failed to initialize chat with module content.");
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [moduleContent, moduleTitle, selectedModel]);

  const handleSend = async (message: string) => {
    if (!message.trim() || loading) return;
    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setSuggestions([]);
    setLoading(true);
    setError(null);

    try {
      const chatHistoryForApi: Message[] = [...messages, userMessage];
      const result: ChatWithSyllabusOutput = await chatWithSyllabus({
        message,
        history: chatHistoryForApi,
        subjectArea: moduleTitle,
        syllabusContext: moduleContent,
        model: selectedModel,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: result.response }]);
      setSuggestions(result.suggestions || []);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
      setSuggestions([]);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => handleSend(text);
  const handleModelChange = (model: string) => setSelectedModel(model);
  const isInitial = messages.length === 0;
  const isEmpty = !moduleTitle && !moduleContent;

  return (
    <div className="flex flex-col h-screen md:h-[97vh] md:w-[98%] md:m-3 md:overflow-hidden md:rounded-3xl bg-[#F7F7F8] dark:bg-gradient-to-b from-[#22283E] to-[#26387C]">

      {!isInitial && (
        <div className="sticky top-0 z-50 bg-[#F7F7F8]/80 dark:bg-[#22283E]/80 backdrop-blur-md">
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
                Beyond Syllabus
              </h2>

              <div className="w-full max-w-3xl mb-4">
                <ChatInput
                  onSend={handleSend}
                  onModelChange={handleModelChange}
                  placeholder={
                    isEmpty
                      ? "Paste your syllabus or markdown here..."
                      : "Ask anything..."
                  }
                  disabled={loading}
                  className="w-full"
                />
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
                        whitespace-normal break-words text-[#969696] dark:text-[#BEBEBE] dark:hover:text-[#BEBEBE] h-auto text-left ring-1 ring-[#7B39FF] dark:ring-[rgba(236,236,236,0.16)]"
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
              placeholder={
                isEmpty
                  ? "Paste your syllabus or markdown here..."
                  : "Ask anything..."
              }
            disabled={loading}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}