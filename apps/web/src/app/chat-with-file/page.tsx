"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Sparkles,
  Wand2,
  Send,
  BrainCircuit,
  User,
  Copy,
  Check,
  Edit3,
  Menu,
  Plus as PlusIcon,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateModuleTasks,
  GenerateModuleTasksOutput,
} from "@/ai/flows/generate-module-tasks";
import { chatWithSyllabus, Message } from "@/ai/flows/chat-with-syllabus";

import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatHistorySidebar } from "@/components/common/ChatHistorySidebar";
import {
  ChatSession,
  createNewChatSession,
  saveChatSession,
  getChatSessionsList,
  getChatSession,
  extractTitleFromMarkdown,
  deleteChatSession,
} from "@/lib/chat-history";

export default function ChatWithFilePage() {
  const [markdown, setMarkdown] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAwaitingAi, setIsAwaitingAi] = useState(false);
  const [chatTitle, setChatTitle] = useState<string>("AI Assistant");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(
    null
  );

  // New state for content/chat mode
  const [showChatInterface, setShowChatInterface] = useState(false);

  // History-related state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);

  // Thinking animation states
  const [thinkingText, setThinkingText] = useState("AI is thinking");
  const thinkingTexts = [
    "AI is thinking",
    "Analyzing your content",
    "Generating insights",
    "Crafting response",
    "Almost there",
  ];

  // Cycle through thinking texts
  useEffect(() => {
    if (loading || isAwaitingAi) {
      const interval = setInterval(() => {
        setThinkingText((prev) => {
          const currentIndex = thinkingTexts.indexOf(prev);
          const nextIndex = (currentIndex + 1) % thinkingTexts.length;
          return thinkingTexts[nextIndex];
        });
      }, 2000); // Change text every 2 seconds

      return () => clearInterval(interval);
    }
  }, [loading, isAwaitingAi]);

  useEffect(() => {
    // Scroll to the latest message (beginning of the last message)
    if (messages.length > 0 && !loading) {
      // Small delay to ensure the message is rendered
      setTimeout(() => {
        latestMessageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start", // Show the top of the element
          inline: "nearest",
        });
      }, 100);
    } else if (loading) {
      // While loading, scroll to the loading indicator
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, loading]);

  // Auto-resize textarea when markdown changes
  useEffect(() => {
    resizeTextarea();
  }, [markdown]);

  // Additional effect to handle textarea resize when switching to content input mode
  useEffect(() => {
    if (!showChatInterface && markdown.trim()) {
      // Small delay to ensure the textarea is rendered and visible
      const timer = setTimeout(() => {
        resizeTextarea();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showChatInterface]);

  // Auto-focus chat input when switching to chat interface
  useEffect(() => {
    if (showChatInterface && chatInputRef.current && !loading) {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showChatInterface, loading]);

  // Auto-focus chat input after sending a message
  useEffect(() => {
    if (
      showChatInterface &&
      chatInputRef.current &&
      !loading &&
      !isAwaitingAi
    ) {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [messages, loading, isAwaitingAi, showChatInterface]);

  // Auto-focus chat input when loading session with content
  useEffect(() => {
    if (showChatInterface && chatInputRef.current && messages.length > 0) {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [currentSessionId, showChatInterface]);

  const copyToClipboard = async (text: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(messageIndex);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Helper function to resize textarea
  const resizeTextarea = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 240) + "px";

      // Enable/disable scrolling based on content height
      if (textarea.scrollHeight > 240) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }
    }
  };

  // Load chat sessions on component mount
  useEffect(() => {
    const sessions = getChatSessionsList();
    setChatSessions(sessions);
  }, []);

  // Auto-save current session - only save if chat interface is shown (content has been submitted)
  useEffect(() => {
    if (
      currentSessionId &&
      showChatInterface &&
      (messages.length > 0 || markdown.trim())
    ) {
      const timeoutId = setTimeout(() => {
        saveCurrentSession();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [currentSessionId, messages, markdown, suggestions, showChatInterface]);

  const saveCurrentSession = () => {
    if (!currentSessionId) return;

    const session: ChatSession = {
      id: currentSessionId,
      title: extractTitleFromMarkdown(markdown) || "Untitled Chat",
      createdAt: new Date(),
      lastModified: new Date(),
      markdown,
      messages,
      suggestions,
    };

    const existingSession = getChatSession(currentSessionId);
    if (existingSession) {
      session.createdAt = existingSession.createdAt;
    }

    saveChatSession(session);

    const updatedSessions = getChatSessionsList();
    setChatSessions(updatedSessions);
  };

  const createNewChat = () => {
    // Check if current session is already empty/new - if so, don't create another
    if (
      currentSessionId &&
      !markdown.trim() &&
      messages.length === 0 &&
      suggestions.length === 0 &&
      !showChatInterface
    ) {
      // Current session is already empty and unused, don't create a new one
      return;
    }

    // Only save current session if it has been actually used (chat interface was shown)
    if (currentSessionId && showChatInterface) {
      saveCurrentSession();
    }

    const newSession = createNewChatSession();
    setCurrentSessionId(newSession.id);

    // Reset all state
    setMarkdown("");
    setMessages([]);
    setInput("");
    setSuggestions([]);
    setError(null);
    setChatTitle("AI Assistant");
    setShowChatInterface(false); // Reset to content input mode

    // Close mobile sidebar when creating new chat
    setMobileSidebarOpen(false);

    // Don't add to sessions list until actually used
  };

  const editContent = () => {
    setShowChatInterface(false);
    setSidebarCollapsed(false); // Expand sidebar when editing content

    // Trigger textarea resize after a short delay to ensure it's rendered
    setTimeout(() => {
      resizeTextarea();
    }, 150);
  };

  const editSessionContent = (sessionId: string) => {
    // Load the session and switch to edit mode
    loadSession(sessionId);
    setShowChatInterface(false); // Switch to content input mode
    setSidebarCollapsed(false); // Expand sidebar
  };

  const editSessionTitle = (sessionId: string, newTitle: string) => {
    // Update the session title
    const session = getChatSession(sessionId);
    if (session) {
      const updatedSession = {
        ...session,
        title: newTitle,
        lastModified: new Date(),
      };
      saveChatSession(updatedSession);

      // Update local state
      setChatSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? updatedSession : s))
      );

      // Update current chat title if this is the active session
      if (currentSessionId === sessionId) {
        setChatTitle(newTitle);
      }
    }
  };

  const loadSession = (sessionId: string) => {
    // Check if current session is empty and should be deleted
    if (currentSessionId && currentSessionId !== sessionId) {
      const isCurrentSessionEmpty =
        !markdown.trim() && messages.length === 0 && suggestions.length === 0;

      if (isCurrentSessionEmpty || !showChatInterface) {
        // Delete the empty/unused session instead of saving it
        setChatSessions((prev) =>
          prev.filter((s) => s.id !== currentSessionId)
        );
        // Also delete from localStorage
        deleteChatSession(currentSessionId);
      } else {
        // Save the session only if it has been used (chat interface was shown)
        saveCurrentSession();
      }
    }

    const session = getChatSession(sessionId);
    if (!session) return;

    setCurrentSessionId(sessionId);
    setMarkdown(session.markdown);
    setMessages(session.messages);
    setSuggestions(session.suggestions);
    setChatTitle(session.title);
    setError(null);
    setInput("");

    // Show chat interface if session has content or messages
    const hasContent =
      Boolean(session.markdown.trim()) || session.messages.length > 0;
    setShowChatInterface(hasContent);

    // Minimize sidebar when loading a session with content
    if (hasContent) {
      setSidebarCollapsed(true);
    }
  };

  const deleteSession = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));

    // If deleting current session, handle it smartly
    if (currentSessionId === sessionId) {
      // Check if there are other sessions to switch to
      const remainingSessions = chatSessions.filter((s) => s.id !== sessionId);

      if (remainingSessions.length > 0) {
        // Switch to the most recent session
        const mostRecentSession = remainingSessions[0];
        loadSession(mostRecentSession.id);
      } else {
        // No other sessions exist, reset to clean state without creating new session
        setCurrentSessionId(null);
        setMarkdown("");
        setMessages([]);
        setInput("");
        setSuggestions([]);
        setError(null);
        setChatTitle("AI Assistant");
        setShowChatInterface(false); // Return to content input mode
      }
    }
  };

  const handleGenerateTasks = async () => {
    if (!markdown.trim()) {
      setError("Please paste your syllabus content first.");
      return;
    }

    // Create new session if none exists
    if (!currentSessionId) {
      const newSession = createNewChatSession();
      setCurrentSessionId(newSession.id);
      setChatSessions((prev) => [newSession, ...prev]);
    }

    setLoading(true);
    setError(null);
    setIsAwaitingAi(true);
    setMessages([]);
    setSuggestions([]);
    setShowChatInterface(true); // Show chat interface
    setSidebarCollapsed(true); // Minimize sidebar when starting chat

    // Extract title from markdown
    const extractedTitle = extractTitleFromMarkdown(markdown);
    setChatTitle(extractedTitle);

    try {
      const result = await generateModuleTasks({
        moduleContent: markdown,
        moduleTitle: extractedTitle,
      });
      setMessages([
        {
          role: "system",
          content: `You are an expert assistant for the provided syllabus content.\n\n${markdown}`,
        },
        {
          role: "assistant",
          content: result.introductoryMessage,
        },
      ]);
      setSuggestions(result.suggestions);
    } catch (e: any) {
      setError(
        "Failed to generate an introduction for the provided content. Please try again."
      );
    } finally {
      setLoading(false);
      setIsAwaitingAi(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      document.getElementById("chat-submit-button")?.click();
    }, 50);
  };

  const handleSend = async () => {
    if (!input.trim() || isAwaitingAi) return;

    // Ensure we have a session before sending
    if (!currentSessionId) {
      const newSession = createNewChatSession();
      setCurrentSessionId(newSession.id);
      setChatSessions((prev) => [newSession, ...prev]);
    } else {
      // If session exists but not in list, add it (for cases where new chat was created but not used until now)
      const sessionExists = chatSessions.some((s) => s.id === currentSessionId);
      if (!sessionExists) {
        const currentSession = getChatSession(currentSessionId);
        if (currentSession) {
          setChatSessions((prev) => [currentSession, ...prev]);
        }
      }
    }

    setSuggestions([]);
    const userMessage: Message = { role: "user", content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setLoading(true);
    setIsAwaitingAi(true);
    setError(null);

    try {
      const chatHistory = currentMessages.filter(
        (m): m is { role: "user" | "assistant"; content: string } =>
          m.role !== "system"
      );
      const result = await chatWithSyllabus({
        history: chatHistory,
        message: input,
      });
      const assistantMessage: Message = {
        role: "assistant",
        content: result.response,
      };
      setMessages((msgs) => [...msgs, assistantMessage]);
      setSuggestions(result.suggestions || []);
    } catch (e) {
      console.error("Error getting AI response:", e);
      setError("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setIsAwaitingAi(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#181824] dark:to-[#232946] overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative pt-20">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <ChatHistorySidebar
            sessions={chatSessions}
            currentSessionId={currentSessionId}
            onSessionSelect={loadSession}
            onNewChat={createNewChat}
            onDeleteSession={deleteSession}
            onEditTitle={editSessionTitle}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setMobileSidebarOpen(false)}
              />
              {/* Sidebar */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="relative w-80 max-w-[85vw]"
              >
                <ChatHistorySidebar
                  sessions={chatSessions}
                  currentSessionId={currentSessionId}
                  onSessionSelect={(sessionId) => {
                    loadSession(sessionId);
                    setMobileSidebarOpen(false);
                  }}
                  onNewChat={() => {
                    createNewChat();
                    setMobileSidebarOpen(false);
                  }}
                  onDeleteSession={deleteSession}
                  onEditTitle={editSessionTitle}
                  isCollapsed={false}
                  onToggleCollapse={() => setMobileSidebarOpen(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-hidden flex flex-col items-center justify-center">
          {!showChatInterface ? (
            // Content Input Mode (ChatGPT style)
            <div className="flex flex-col items-center justify-center w-full h-full py-8 px-4 relative">
              {/* Mobile History Button - Top Right */}
              {chatSessions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden absolute top-4 right-4 z-10 flex items-center gap-2 text-xs px-3 py-2 h-8"
                >
                  <History className="h-3 w-3" />
                  <span>History</span>
                </Button>
              )}

              <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8">
                {/* Header */}
                <div className="text-center space-y-3 md:space-y-4">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent leading-tight">
                    Introducing BeyondSyllabus
                  </h1>
                  <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Paste any syllabus or educational content below. Our AI will
                    help you understand it, generate learning tasks, and answer
                    your questions.
                  </p>
                </div>

                {/* Input Container */}
                <div className="w-full max-w-3xl mx-auto">
                  <Card className="shadow-xl border-0 bg-background/95 backdrop-blur-lg">
                    <CardContent className="p-0">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleGenerateTasks();
                        }}
                        className="flex flex-col sm:flex-row items-start gap-3 p-4 md:p-6"
                      >
                        <div className="flex-1 w-full">
                          <textarea
                            ref={textareaRef}
                            placeholder="Paste your syllabus or markdown here..."
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            className="w-full text-sm md:text-base px-0 py-2 bg-transparent border-none focus:outline-none placeholder:text-muted-foreground resize-none"
                            disabled={isAwaitingAi}
                            autoFocus
                            rows={1}
                            style={{
                              minHeight: "48px",
                              maxHeight: "200px",
                              height: "auto",
                              overflowY: "hidden",
                              scrollbarWidth: "thin",
                              scrollbarColor:
                                "hsl(var(--muted-foreground) / 0.2) transparent",
                            }}
                          />
                          <style jsx>{`
                            textarea::-webkit-scrollbar {
                              width: 6px;
                            }
                            textarea::-webkit-scrollbar-track {
                              background: transparent;
                            }
                            textarea::-webkit-scrollbar-thumb {
                              background-color: hsl(
                                var(--muted-foreground) / 0.2
                              );
                              border-radius: 3px;
                            }
                            textarea::-webkit-scrollbar-thumb:hover {
                              background-color: hsl(
                                var(--muted-foreground) / 0.4
                              );
                            }
                          `}</style>
                        </div>
                        {markdown.trim() && (
                          <Button
                            type="submit"
                            disabled={loading || !markdown.trim()}
                            className="h-10 px-4 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex-shrink-0 w-full sm:w-auto"
                            size="sm"
                          >
                            {isAwaitingAi && loading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            <span className="sm:hidden">Generate Response</span>
                            <span className="hidden sm:inline">Start</span>
                          </Button>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {error && (
                  <Alert variant="destructive" className="max-w-3xl mx-auto">
                    <BrainCircuit className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ) : (
            // Chat Interface Mode
            <div className="w-full h-full flex flex-col">
              {/* Chat Header */}
              <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center gap-3 max-w-7xl mx-auto">
                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="md:hidden flex-shrink-0 p-2"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 min-w-0"
                  >
                    <h1 className="text-lg md:text-xl lg:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent truncate">
                      {chatTitle}
                    </h1>
                    <p className="text-muted-foreground text-xs md:text-sm">
                      Chat with your syllabus content
                    </p>
                  </motion.div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={editContent}
                    className="flex items-center gap-2 flex-shrink-0 text-xs px-3 py-2 h-8"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 flex flex-col min-h-0 max-w-7xl mx-auto w-full">
                <Card className="flex-1 flex flex-col m-4 shadow-lg border bg-card/50 backdrop-blur-sm min-h-0">
                  <CardContent className="flex flex-col p-3 md:p-4 lg:p-6 h-full min-h-0">
                    {/* Messages Container */}
                    <div
                      className="flex-1 overflow-y-auto scroll-smooth pr-1 md:pr-2 min-h-0"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor:
                          "hsl(var(--muted-foreground) / 0.2) transparent",
                      }}
                    >
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          width: 6px;
                        }
                        div::-webkit-scrollbar-track {
                          background: transparent;
                        }
                        div::-webkit-scrollbar-thumb {
                          background-color: hsl(var(--muted-foreground) / 0.2);
                          border-radius: 3px;
                        }
                        div::-webkit-scrollbar-thumb:hover {
                          background-color: hsl(var(--muted-foreground) / 0.4);
                        }
                      `}</style>

                      <div className="space-y-4 md:space-y-6 pb-4">
                        {/* Welcome Message */}
                        {messages.filter((m) => m.role !== "system").length ===
                          0 &&
                          !loading && (
                            <Alert className="bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <AlertTitle>Ready to Assist!</AlertTitle>
                              <AlertDescription>
                                Your AI study assistant is ready to help you
                                understand and explore your syllabus content.
                              </AlertDescription>
                            </Alert>
                          )}

                        {/* Error Display */}
                        {error && (
                          <Alert variant="destructive">
                            <BrainCircuit className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        {/* Messages */}
                        {messages
                          .filter((m) => m.role !== "system")
                          .map((msg, idx) => {
                            const filteredMessages = messages.filter(
                              (m) => m.role !== "system"
                            );
                            const isLastMessage =
                              idx === filteredMessages.length - 1;

                            return (
                              <motion.div
                                key={idx}
                                ref={isLastMessage ? latestMessageRef : null}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex items-start gap-2 md:gap-3 w-full ${
                                  msg.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                {/* AI Avatar */}
                                {msg.role === "assistant" && (
                                  <Avatar className="w-6 h-6 md:w-8 md:h-8 border flex-shrink-0">
                                    <AvatarFallback className="bg-primary/10">
                                      <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                                    </AvatarFallback>
                                  </Avatar>
                                )}

                                {/* Message Content */}
                                <div className="relative group max-w-[90%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-2xl">
                                  <div
                                    className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 text-sm md:text-base shadow-md ${
                                      msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-md ml-auto"
                                        : "bg-muted/50 text-foreground rounded-bl-md border backdrop-blur-sm"
                                    }`}
                                  >
                                    <div className="prose prose-sm dark:prose-invert prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-li:my-1 max-w-none">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                      >
                                        {msg.content}
                                      </ReactMarkdown>
                                    </div>
                                  </div>

                                  {/* Copy Button */}
                                  {msg.role === "assistant" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity bg-background hover:bg-accent border shadow-sm h-6 w-6 md:h-8 md:w-8 p-0 z-10"
                                      onClick={() =>
                                        copyToClipboard(msg.content, idx)
                                      }
                                      title="Copy response"
                                    >
                                      {copiedMessageIndex === idx ? (
                                        <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-3 w-3 md:h-4 md:w-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>

                                {/* User Avatar */}
                                {msg.role === "user" && (
                                  <Avatar className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                                    <AvatarFallback className="bg-muted">
                                      <User className="h-3 w-3 md:h-4 md:w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </motion.div>
                            );
                          })}

                        {/* Loading Indicator */}
                        {(loading || isAwaitingAi) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start items-center gap-2 md:gap-3"
                          >
                            <Avatar className="w-6 h-6 md:w-8 md:h-8 border flex-shrink-0">
                              <AvatarFallback className="bg-primary/10">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                >
                                  <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                                </motion.div>
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted/50 rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-md border backdrop-blur-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                >
                                  <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-primary" />
                                </motion.div>
                                <motion.span
                                  key={thinkingText}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  transition={{ duration: 0.3 }}
                                  className="text-xs md:text-sm font-medium"
                                >
                                  {thinkingText}
                                </motion.span>
                                <motion.div
                                  animate={{ opacity: [0, 1, 0] }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                  className="flex gap-0.5"
                                >
                                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                                </motion.div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Suggestions */}
                        {suggestions.length > 0 && !loading && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3 mt-6"
                          >
                            <div className="flex flex-wrap gap-2 mb-2 md:w-full">
                              <p className="flex">
                                <Menu />
                                Related
                              </p>
                              {suggestions.map((s, i) => (
                                <div className="flex items-center justify-between w-full  border-b-[.8px] ">
                                  <Button
                                    key={i}
                                    className="w-[350px] md:w-full text-wrap flex bg-transparent   hover:text-purple-600 hover:bg-transparent text-left md:h-[7vh] h-[10vh] text-[12px] md:text-[13px] text-black dark:text-white justify-start rounded"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(s)}
                                  >
                                    {s}
                                  </Button>
                                  <PlusIcon
                                    size={20}
                                    className="text-purple-500"
                                  />
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        <div ref={chatEndRef} />
                      </div>
                    </div>

                    {/* Input Form */}
                    <div className="flex-shrink-0 border-t pt-3 md:pt-4 mt-3 md:mt-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSend();
                        }}
                        className="flex gap-2 items-end p-2 rounded-2xl shadow-lg border bg-background/95 backdrop-blur-sm"
                      >
                        <input
                          ref={chatInputRef}
                          id="chat-input-field"
                          className="flex-1 bg-transparent border-none rounded-lg px-3 py-3 text-sm md:text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 disabled:opacity-50 min-h-[44px] resize-none"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Ask about your syllabus..."
                          disabled={loading || messages.length === 0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                        />
                        <Button
                          id="chat-submit-button"
                          type="submit"
                          size="icon"
                          disabled={loading || !input.trim()}
                          className="h-11 w-11 flex-shrink-0 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                        >
                          <Send className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
