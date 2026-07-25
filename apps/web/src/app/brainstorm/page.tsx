"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ChatMessage from "@/app/chat/_components/ChatMessage";
import { ChatInput } from "@/app/chat/_components/ChatInput";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  guidedBrainstorm,
  BrainstormStage,
} from "@/ai/flows/guided-brainstorm";
import { Message } from "@/lib/types";
import {
  getDeliveryMode,
  recordBrainstormSession,
  recordQuestionCollected,
} from "@/lib/journey";
import { Map } from "lucide-react";
import {
  ArrowRight,
  Download,
  Lightbulb,
  ListChecks,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { orpc } from "@/lib/orpc";

type SheetQuestion = {
  id: string;
  text: string;
  source: "ai" | "mine";
};

const STAGES: { id: BrainstormStage; label: string; hint: string }[] = [
  { id: "prime", label: "1 · Prime", hint: "What do you already know?" },
  { id: "explore", label: "2 · Explore", hint: "Why does this matter?" },
  { id: "question", label: "3 · Questions", hint: "What will you ask in class?" },
];

export default function BrainstormPage() {
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleContent, setModuleContent] = useState("");
  const [stage, setStage] = useState<BrainstormStage>("prime");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [sheet, setSheet] = useState<SheetQuestion[]>([]);
  const [ownQuestion, setOwnQuestion] = useState("");
  const [model, setModel] = useState("openai/gpt-oss-120b");
  const [classCode, setClassCode] = useState("");
  const [sending, setSending] = useState(false);
  const startedStages = useRef<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  const storageKey = moduleTitle ? `question-sheet:${moduleTitle}` : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setModuleTitle(params.get("title") || "");
    setModuleContent(params.get("content") || "");
  }, []);

  // Restore a previously built sheet for this module
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setSheet(JSON.parse(saved));
    } catch {
      /* corrupted sheet: start fresh */
    }
  }, [storageKey]);

  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(sheet));
  }, [sheet, storageKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const runTurn = useCallback(
    async (message: string, forStage: BrainstormStage, history: Message[]) => {
      setLoading(true);
      try {
        const result = await guidedBrainstorm({
          stage: forStage,
          moduleTitle,
          moduleContent,
          history,
          message,
          model,
          deliveryMode: getDeliveryMode(),
        });
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.response },
        ]);
        if (result.suggestedQuestions.length) {
          setCandidates(result.suggestedQuestions);
        }
      } finally {
        setLoading(false);
      }
    },
    [moduleTitle, moduleContent, model]
  );

  // Stage opener: fires once per stage, once module context exists
  useEffect(() => {
    if (!moduleContent || !moduleTitle) return;
    if (startedStages.current.has(stage)) return;
    startedStages.current.add(stage);
    if (stage === "prime") recordBrainstormSession(moduleTitle);
    runTurn("", stage, messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleContent, moduleTitle, stage]);

  const handleSend = async (message: string) => {
    if (!message.trim() || loading) return;
    const next: Message[] = [...messages, { role: "user", content: message }];
    setMessages(next);
    await runTurn(message, stage, next);
  };

  const addToSheet = (text: string, source: "ai" | "mine") => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (sheet.some((q) => q.text === trimmed)) {
      toast("Already on your sheet");
      return;
    }
    setSheet((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: trimmed, source },
    ]);
    recordQuestionCollected(moduleTitle);
  };

  useEffect(() => {
    setClassCode(localStorage.getItem("last-class-code") || "");
  }, []);

  const sendToClass = async () => {
    const code = classCode.trim().toUpperCase();
    if (!code || !sheet.length || sending) return;
    setSending(true);
    try {
      await orpc.classroom.submit.call({
        code,
        module: moduleTitle,
        questions: sheet.map((q) => q.text),
      });
      localStorage.setItem("last-class-code", code);
      toast.success("Sent to your class, anonymously");
    } catch (e: any) {
      toast.error(e?.message || "Could not send to class");
    } finally {
      setSending(false);
    }
  };

  const exportSheet = () => {
    const lines = [
      `# Question Sheet — ${moduleTitle}`,
      "",
      `*Built with Beyond Syllabus Guided Brainstorm. Bring these to class.*`,
      "",
      ...sheet.map((q, i) => `${i + 1}. ${q.text}`),
      "",
      `— ${new Date().toLocaleDateString()}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `question-sheet-${moduleTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Question Sheet downloaded");
  };

  const stageIndex = STAGES.findIndex((s) => s.id === stage);
  const nextStage = STAGES[stageIndex + 1];

  if (!moduleTitle || !moduleContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-mint-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 p-6">
        <div className="text-center max-w-md space-y-4">
          <Sparkles className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Guided Brainstorm</h1>
          <p className="text-muted-foreground">
            Open a module from your syllabus and choose Brainstorm to start a
            session. You will leave with a Question Sheet to bring to class.
          </p>
          <Button asChild>
            <Link href="/select">Find your syllabus</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-mint-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 backdrop-blur-sm sticky top-0 z-20 bg-background/70">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Guided Brainstorm
          </p>
          <h1 className="font-semibold truncate max-w-[60vw]">{moduleTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" title="My Journey">
            <Link href="/journey">
              <Map className="h-4 w-4" />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Stage rail */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 flex-wrap">
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => i <= stageIndex && setStage(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              s.id === stage
                ? "bg-primary text-white border-primary"
                : i < stageIndex
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted text-muted-foreground border-transparent cursor-default"
            }`}
            title={s.hint}
          >
            {s.label}
          </button>
        ))}
        {nextStage && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs h-7"
            disabled={loading}
            onClick={() => setStage(nextStage.id)}
          >
            Next: {nextStage.label.split("· ")[1]}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      <div className="flex flex-1 gap-4 px-4 pb-4 max-w-6xl w-full mx-auto min-h-0 flex-col lg:flex-row">
        {/* Conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {messages
              .filter((m) => m.role !== "system")
              .map((m, i) => (
                <ChatMessage
                  key={i}
                  role={m.role as "user" | "assistant"}
                  content={m.content}
                />
              ))}
            {loading && (
              <p className="text-sm text-muted-foreground animate-pulse px-2">
                Thinking with you…
              </p>
            )}
            <div ref={endRef} />
          </div>

          {/* AI-suggested questions for the sheet */}
          {candidates.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5" /> Worth asking in class? Tap
                to add to your sheet:
              </p>
              <div className="flex flex-wrap gap-2">
                {candidates.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => addToSheet(q, "ai")}
                    className="text-left text-xs px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/15 transition-colors"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ChatInput
            placeholder={STAGES[stageIndex].hint}
            onSend={handleSend}
            disabled={loading}
            onModelChange={setModel}
          />
        </div>

        {/* Question Sheet */}
        <aside className="lg:w-80 w-full shrink-0">
          <div className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm p-4 lg:sticky lg:top-20 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2 text-sm">
                <ListChecks className="h-4 w-4 text-primary" /> Question Sheet
                <span className="text-xs text-muted-foreground">
                  ({sheet.length})
                </span>
              </h2>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                disabled={!sheet.length}
                onClick={exportSheet}
                title="Download as markdown"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              The point of this session: walk into class with questions worth
              asking.
            </p>

            <ul className="space-y-2 max-h-[40vh] overflow-y-auto">
              {sheet.map((q, i) => (
                <li
                  key={q.id}
                  className="group flex items-start gap-2 text-sm rounded-lg border border-border/50 px-2.5 py-2"
                >
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {i + 1}.
                  </span>
                  <span className="flex-1">{q.text}</span>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() =>
                      setSheet((prev) => prev.filter((x) => x.id !== q.id))
                    }
                    aria-label="Remove question"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
              {!sheet.length && (
                <li className="text-xs text-muted-foreground italic px-1">
                  Empty so far. Add the AI's suggestions below the chat, or
                  write your own here.
                </li>
              )}
            </ul>

            {sheet.length > 0 && (
              <div className="flex gap-2 items-center border-t border-border/50 pt-3">
                <input
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="Class code"
                  maxLength={6}
                  className="w-24 text-xs font-mono tracking-widest rounded-lg border border-border/60 bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1"
                  disabled={classCode.trim().length < 6 || sending}
                  onClick={sendToClass}
                  title="Send your questions to your teacher, anonymously"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  {sending ? "Sending…" : "Send to class"}
                </Button>
              </div>
            )}

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addToSheet(ownQuestion, "mine");
                setOwnQuestion("");
              }}
            >
              <input
                value={ownQuestion}
                onChange={(e) => setOwnQuestion(e.target.value)}
                placeholder="Write your own question…"
                className="flex-1 text-sm rounded-lg border border-border/60 bg-background px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button type="submit" size="sm" variant="outline" className="h-8">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
