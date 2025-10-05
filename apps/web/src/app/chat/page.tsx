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
  ChatSession,
  createNewChatSession,
  saveChatSession,
  getChatSessionsList,
  getChatSession,
} from "@/lib/chat-history";

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
    { title: string; messages: Message[] }[]
  >([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "quick" | "history">("ai");
  const [historyViewing, setHistoryViewing] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadedFromSession, setLoadedFromSession] = useState<boolean>(false);
  const [restoreAttempted, setRestoreAttempted] = useState<boolean>(false);

  const normalizeTitle = (title: string) => title.trim().toLowerCase();
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return h.toString(36);
  };
  const getStorageKey = (title: string, content: string) =>
    `bs_chat_${encodeURIComponent(normalizeTitle(title))}_${hash(content.slice(0, 500))}`;

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

  // Load last saved session for this module (if any)
  useEffect(() => {
    if (!moduleTitle || moduleTitle === "Loading title...") return;
    try {
      // Strong fallback: try per-module storage first
      const perModule = localStorage.getItem(getStorageKey(moduleTitle, moduleContent));
      if (perModule) {
        const parsed = JSON.parse(perModule) as { messages?: Message[]; suggestions?: string[] };
        if (parsed?.messages && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          setSuggestions(parsed.suggestions || []);
          setLoadedFromSession(true);
          setRestoreAttempted(true);
          return;
        }
      }

      const sessions = getChatSessionsList();
      const matching = sessions.find((s) => s.title && normalizeTitle(s.title).startsWith(normalizeTitle(moduleTitle)));
      if (matching) {
        setCurrentSessionId(matching.id);
        setMessages(matching.messages || []);
        setSuggestions(matching.suggestions || []);
        setLoadedFromSession(true);
        setRestoreAttempted(true);
      } else {
        setLoadedFromSession(false);
        setRestoreAttempted(true);
      }
    } catch (_) {
      // ignore
      setRestoreAttempted(true);
    }
  }, [moduleTitle, moduleContent]);

  // Generate initial tasks
  useEffect(() => {
    if (!moduleContent || moduleTitle === "Loading title..." || !restoreAttempted || loadedFromSession) return;

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

        // Initialize and save a new session with the intro
        const initialSession: ChatSession = {
          ...createNewChatSession(),
          title: moduleTitle,
          messages: [
            systemMessage,
            { role: "assistant", content: result.introductoryMessage },
          ],
          suggestions: result.suggestions || [],
        };
        saveChatSession(initialSession);
        setCurrentSessionId(initialSession.id);
      })
      .catch(() =>
        setError("Failed to generate initial tasks and applications.")
      )
      .finally(() => setLoading(false));
  }, [moduleContent, moduleTitle, loadedFromSession, restoreAttempted]);

  const persistSession = (updatedMessages: Message[], nextSuggestions: string[] = []) => {
    try {
      let session: ChatSession | null = null;
      if (currentSessionId) {
        session = getChatSession(currentSessionId);
      }
      if (!session) {
        session = {
          ...createNewChatSession(),
          title: (() => {
            const firstUser = updatedMessages.find((m) => m.role === "user");
            return firstUser ? `${moduleTitle} - ${firstUser.content.slice(0, 50)}` : moduleTitle;
          })(),
          messages: updatedMessages,
          suggestions: nextSuggestions,
        };
      } else {
        session = {
          ...session,
          title: session.title || moduleTitle,
          messages: updatedMessages,
          suggestions: nextSuggestions,
        };
      }
      saveChatSession(session);
      if (!currentSessionId) setCurrentSessionId(session.id);

      // Also persist under a per-module key so refreshes are robust
      localStorage.setItem(
        getStorageKey(moduleTitle, moduleContent),
        JSON.stringify({ messages: updatedMessages, suggestions: nextSuggestions })
      );
    } catch (_) {
      // ignore persistence errors
    }
  };

  // Save on every message/suggestions change as additional safety
  useEffect(() => {
    if (!moduleTitle || messages.length === 0) return;
    try {
      localStorage.setItem(
        getStorageKey(moduleTitle, moduleContent),
        JSON.stringify({ messages, suggestions })
      );
    } catch (_) {
      // ignore
    }
  }, [moduleTitle, moduleContent, messages, suggestions]);

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
    setChatHistory((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    // Persist immediately with the user message
    persistSession(updatedMessages, suggestions);
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

      setMessages((msgs) => [...msgs, assistantMessage]);
      setSuggestions(result.suggestions || []);
      // Persist with assistant response and new suggestions
      persistSession([...updatedMessages, assistantMessage], result.suggestions || []);
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

    if (historyViewing) {
      // Just exit history mode + clear messages
      setHistoryViewing(false);
      setMessages([]);
      return; // stop here, don’t archive old chat
    }

    // Normal behavior (not in history view)
    if (messages.length > 1) {
      setChatHistory((prev) => [
        ...prev,
        {
          title: firstUserMessage
            ? `Untitled - ${firstUserMessage.slice(0, 20)}`
            : `${moduleTitle} - New Topic`,
          messages: messages.filter((m) => m.role !== "system"),
        },
      ]);
      // Persist current session before starting a new one
      persistSession(messages, suggestions);
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
    // Reset session so next send creates a new one for the new topic
    setCurrentSessionId(null);
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
        />
      </div>
    </div>
  );
}
