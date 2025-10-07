"use client";
import "katex/dist/katex.min.css";
import { useState, useEffect, useRef } from "react";
import { chatWithSyllabus, Message } from "@/ai/flows/chat-with-syllabus";
import { generateModuleTasks } from "@/ai/flows/generate-module-tasks";
import DesktopChatLayout from "./DesktopChatLayout";
import DesktopChat from "./DesktopChat/DesktopChat";
import MobileChatPanels from "./mobileChatPanels";
import styles from './page.module.css';
import {
  StoredChat,
  StoredChatMessage,
  createNewChat,
  deleteChatById,
  getActiveChatId,
  getOrCreateUserId,
  loadChats,
  saveChats,
  setActiveChatId,
  upsertChat,
} from "@/lib/chatStorage";

export default function ChatComponent() {
  // Client-only state for module title/content
  const [moduleTitle, setModuleTitle] = useState("Loading title...");
  const [moduleContent, setModuleContent] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(
    null
  );
  const [selectedModel, setSelectedModel] = useState("llama3-8b-8192"); // default model

  const [chatHistory, setChatHistory] = useState<
    { id: string; title: string; messages: Message[]; createdAt?: string; updatedAt?: string }[]
  >([]);
  const [activeChatId, setActiveChat] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "quick" | "history">("ai");
  const [historyViewing, setHistoryViewing] = useState<boolean>(false);

  const quickQuestions = [
    "Why do I need to study this?",
    "What is the purpose of this module?",
    "How can I apply this in real life?",
  ];

  // === CLIENT-ONLY: read search params ===
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title") || "Untitled Module";
    const content = params.get("content") || "";
    setModuleTitle(title);
    setModuleContent(content);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    setTimeout(
      () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  }, [messages, loading]);

  useEffect(() => {
    console.log(messages)
  }, [messages])

  // Load persisted chats on mount
  useEffect(() => {
    const id = getOrCreateUserId();
    setUserId(id);
    const existing = loadChats(id);
    const mapped: { id: string; title: string; messages: Message[]; createdAt?: string; updatedAt?: string }[] = existing.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages.map((m): Message => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    }));
    setChatHistory(mapped);
    const active = getActiveChatId(id);
    if (active) {
      setActiveChat(active);
      const found = mapped.find((c) => c.id === active);
      if (found) setMessages([{ role: "system", content: `You are an expert assistant for the course module: ${moduleTitle}.\nModule Content:\n${moduleContent}` }, ...found.messages]);
    }
  }, []);

  // Generate initial tasks
  useEffect(() => {
    if (!moduleContent || moduleTitle === "Loading title...") return;

    const systemMessage: Message = {
      role: "system",
      content: `You are an expert assistant for the course module: ${moduleTitle}.\nModule Content:\n${moduleContent}`,
    };
    if (!activeChatId) {
      setMessages([systemMessage]);
    }
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
      () => document.getElementById("chat-submit-button")?.click(),
      50
    );
  };

  const handleDeleteTopic = (idx: number) => {
    setChatHistory((prev) => {
      const toDelete = prev[idx]?.id;
      const next = prev.filter((_, i) => i !== idx);
      if (userId && toDelete) {
        const persisted = loadChats(userId);
        saveChats(userId, deleteChatById(persisted, toDelete));
        if (activeChatId === toDelete) {
          setActiveChat(null);
          setActiveChatId(userId, "");
        }
      }
      return next;
    });
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
        model: selectedModel, // ✅ Correct model usage
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: result.response,
      };

      setMessages((msgs) => {
        const nextMsgs = [...msgs, assistantMessage];
        // persist to localStorage as current chat
        if (userId) {
          const now = new Date().toISOString();
          let currentId = activeChatId;
          if (!currentId) {
            const newChat = createNewChat(moduleTitle);
            currentId = newChat.id;
            setActiveChat(currentId);
            setActiveChatId(userId, currentId);
            const stored = loadChats(userId);
            saveChats(userId, upsertChat(stored, newChat));
            setChatHistory((prev) => [{ id: newChat.id, title: newChat.title, messages: [], createdAt: newChat.createdAt, updatedAt: newChat.updatedAt }, ...prev]);
          }

          const persisted = loadChats(userId);
          const withoutSystem = nextMsgs.filter((m) => m.role !== "system");
          const storedMsgs: StoredChatMessage[] = withoutSystem.map((m) => ({
            sender: m.role === "user" ? "user" : "bot",
            text: m.content,
            timestamp: now,
          }));
          const existing = persisted.find((c) => c.id === currentId);
          const firstUserSnippet = withoutSystem[0]?.content?.slice(0, 40);
          const derivedTitle = firstUserSnippet || `${moduleTitle} - New Chat`;
          const chatToSave: StoredChat = existing
            ? {
                ...existing,
                messages: storedMsgs,
                updatedAt: now,
                // auto-title only if this is the first user message (previously empty)
                title:
                  (existing.messages?.length ?? 0) === 0 && firstUserSnippet
                    ? firstUserSnippet
                    : existing.title || derivedTitle,
              }
            : {
                id: currentId!,
                title: derivedTitle,
                messages: storedMsgs,
                createdAt: now,
                updatedAt: now,
                moduleTitle,
              };
          saveChats(userId, upsertChat(persisted, chatToSave));
          setChatHistory((prev) => {
            const index = prev.findIndex((c) => c.id === chatToSave.id);
            const mapped = { id: chatToSave.id, title: chatToSave.title, messages: withoutSystem };
            if (index === -1) return [mapped, ...prev];
            const copy = [...prev];
            copy[index] = mapped;
            return copy;
          });
        }

        return nextMsgs;
      });
      setSuggestions(result.suggestions || []);
    } catch (err) {
      console.error("Error getting AI response:", err);
      setError("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewTopic = () => {
    // start a fresh conversation and set as active
    const systemMessage: Message = {
      role: "system",
      content: `You are an expert assistant for the course module: ${moduleTitle}.\nModule Content:\n${moduleContent}`,
    };
    setMessages([systemMessage]);
    setInput("");
    setSuggestions([]);
    setError(null);
    setActiveTab("ai");
    if (userId) {
      const newChat = createNewChat(moduleTitle);
      const stored = loadChats(userId);
      saveChats(userId, upsertChat(stored, newChat));
      setActiveChat(newChat.id);
      setActiveChatId(userId, newChat.id);
      setChatHistory((prev) => [{ id: newChat.id, title: newChat.title, messages: [] }, ...prev]);
    } else {
      setActiveChat(null);
    }
  };

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    if (userId) setActiveChatId(userId, id);
    const found = chatHistory.find((c) => c.id === id);
    if (found) {
      const systemMessage: Message = {
        role: "system",
        content: `You are an expert assistant for the course module: ${moduleTitle}.\nModule Content:\n${moduleContent}`,
      };
      setMessages([systemMessage, ...found.messages]);
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChatHistory((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c));
      if (userId) {
        const persisted = loadChats(userId);
        const updated = persisted.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c));
        saveChats(userId, updated);
      }
      return next;
    });
  };

  return (
    <div className={styles.container}>


      <div className={styles.desktopContainer}>
        {/* <DesktopChatLayout
          moduleTitle={moduleTitle}
          moduleContent={moduleContent}
          messages={messages}
          chatHistory={chatHistory}
          suggestions={suggestions}
          quickQuestions={quickQuestions}
          input={input}
          setInput={setInput}
          onDeleteTopic={handleDeleteTopic}
          loading={loading}
          onModelChange={setSelectedModel}
          copiedMessageIndex={copiedMessageIndex}
          handleSend={handleSend}
          handleNewTopic={handleNewTopic}
          handleSuggestionClick={handleSuggestionClick}
          copyToClipboard={copyToClipboard}
          setMessages={setMessages}
        /> */}
        <DesktopChat
          chatHistory={chatHistory}
          onDeleteTopic={handleDeleteTopic}
          moduleTitle={moduleTitle}
          messages={messages}
          copiedMessageIndex={copiedMessageIndex}
          copyToClipboard={copyToClipboard}
          loading={loading}
          suggestions={suggestions}
          handleSend={handleSend}
          handleSuggestionClick={handleSuggestionClick}
          input={input}
          setInput={setInput}
          onModelChange={setSelectedModel}
          handleNewTopic={handleNewTopic}
          setMessages={setMessages}
          setActiveTab={setActiveTab}
          historyViewing={historyViewing}
          setHistoryViewing={setHistoryViewing}
          onSelectChat={handleSelectChat}
          onRenameChat={handleRenameChat}
        />


      </div>

      <div className={styles.mobileContainer}>
        <MobileChatPanels
          messages={messages}
          onModelChange={setSelectedModel}
          setMessages={setMessages}
          input={input}
          setInput={setInput}
          loading={loading}
          error={error}
          suggestions={suggestions}
          copiedMessageIndex={copiedMessageIndex}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          quickQuestions={quickQuestions}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          chatEndRef={chatEndRef}
          moduleTitle={moduleTitle}
          copyToClipboard={copyToClipboard}
          handleSuggestionClick={handleSuggestionClick}
          handleSend={handleSend}
          handleNewTopic={handleNewTopic}
          onSelectChat={handleSelectChat}
          onRenameChat={handleRenameChat}
        />
      </div>
    </div>
  );
}
