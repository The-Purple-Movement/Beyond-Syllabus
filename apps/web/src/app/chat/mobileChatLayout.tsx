"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { Loader2, Send, Sparkles, User, Copy, Check } from "lucide-react";

import { chatWithSyllabus, Message } from "@/ai/flows/chat-with-syllabus";
import { generateModuleTasks } from "@/ai/flows/generate-module-tasks";

import MobileChatPanels from "./mobileChatPanels"; // Ensure this exists

export default function MobileChatLayout() {
  const searchParams = useSearchParams();
  const moduleTitle = searchParams.get("title") || "Loading title...";
  const moduleContent = searchParams.get("content") || "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(
    null
  );
  const [chatHistory, setChatHistory] = useState<
    { id?: string; title: string; messages: Message[] }[]
  >([]);
  const [activeTab, setActiveTab] = useState<"ai" | "quick" | "history">("ai");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState("llama3-8b-8192");
  const quickQuestions = [
    "Why do I need to study this?",
    "What is the purpose of this module?",
    "How can I apply this in real life?",
  ];

  useEffect(() => {
    setTimeout(
      () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  }, [messages, loading]);

  useEffect(() => {
    if (!moduleContent || moduleTitle === "Loading title...") return;

    const systemMessage: Message = {
      role: "system",
      content: `You are an expert assistant for the course module: ${moduleTitle}.\nModule Content:\n${moduleContent}`,
    };

    setMessages([systemMessage]);
    setLoading(true);
    setError(null);

    generateModuleTasks({ moduleContent, moduleTitle })
      .then((result) => {
        setMessages([
          systemMessage,
          { role: "assistant", content: result.introductoryMessage },
        ]);
        setSuggestions(result.suggestions);
      })
      .catch(() =>
        setError("Failed to generate initial tasks and applications.")
      )
      .finally(() => setLoading(false));
  }, [moduleContent, moduleTitle]);

  const copyToClipboard = async (text: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(messageIndex);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    setTimeout(
      () => document.getElementById("chat-submit-button-mobile")?.click(),
      50
    );
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setSuggestions([]);
    setLoading(true);
    setError(null);

    try {
      const chatHistoryForApi = updatedMessages.filter(
        (m): m is { role: "user" | "assistant"; content: string } =>
          m.role !== "system"
      );

      const result = await chatWithSyllabus({
        history: chatHistoryForApi,
        message: input,
        model: selectedModel, // Use the selected model if provided
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: result.response,
      };

      setMessages((msgs) => [...msgs, assistantMessage]);
      setSuggestions(result.suggestions || []);
    } catch (err) {
      console.error("Error getting AI response:", err);
      setError("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewTopic = () => {
    const firstUserMessage =
      messages.find((m) => m.role === "user")?.content || "";

    if (messages.length > 1) {
      setChatHistory((prev) => [
        ...prev,
        {
          title: `${moduleTitle}${
            firstUserMessage ? ` - ${firstUserMessage}` : ""
          }`,
          messages: messages.filter((m) => m.role !== "system"),
        },
      ]);
    }

    const systemMessage: Message = {
      role: "system",
      content: `You are an expert assistant for the course module: ${moduleTitle}.\nModule Content:\n${moduleContent}`,
    };

    setMessages([systemMessage]);
    setInput("");
    setSuggestions([]);
    setError(null);
    setActiveTab("ai");
  };

  return (
    <div className="flex-1 w-full">
      <MobileChatPanels
        messages={messages}
        input={input}
        setInput={setInput}
        loading={loading}
        error={error}
        onModelChange={setSelectedModel}
        suggestions={suggestions}
        copiedMessageIndex={copiedMessageIndex}
        chatHistory={chatHistory}
        quickQuestions={quickQuestions}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        chatEndRef={chatEndRef}
        moduleTitle={moduleTitle}
        setMessages={setMessages}
        setChatHistory={setChatHistory}
        copyToClipboard={copyToClipboard}
        handleSuggestionClick={handleSuggestionClick}
        handleSend={handleSend}
        handleNewTopic={handleNewTopic}
      />
    </div>
  );
}
