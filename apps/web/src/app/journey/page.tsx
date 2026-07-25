"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DeliveryMode,
  Journey,
  loadJourney,
  setDeliveryMode,
  getStreak,
  exportAllData,
  importAllData,
  setModuleStatus,
  ModuleStatus,
  buildRunwayPlan,
  daysUntil,
  removeExam,
  RunwayItem,
} from "@/lib/journey";
import {
  BrainCircuit,
  CalendarClock,
  Download,
  Flame,
  ListChecks,
  Map,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "react-hot-toast";

const MODES: { id: DeliveryMode; label: string; blurb: string }[] = [
  { id: "peer", label: "Like a peer", blurb: "Casual, relatable, zero jargon" },
  { id: "mentor", label: "Like a mentor", blurb: "Warm, guiding, balanced" },
  {
    id: "example-first",
    label: "Examples first",
    blurb: "Every idea opens with a concrete case",
  },
];

const STATUS_META: Record<ModuleStatus, { label: string; cls: string }> = {
  explored: {
    label: "Explored",
    cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  shaky: {
    label: "Shaky",
    cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  solid: {
    label: "Solid",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
};

export default function JourneyPage() {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [streak, setStreak] = useState(0);
  const [sheets, setSheets] = useState<{ module: string; count: number }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setJourney(loadJourney());
    setStreak(getStreak());
    const found: { module: string; count: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("question-sheet:")) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(parsed) && parsed.length) {
            found.push({
              module: key.replace("question-sheet:", ""),
              count: parsed.length,
            });
          }
        } catch {
          /* skip corrupt sheet */
        }
      }
    }
    setSheets(found.sort((a, b) => b.count - a.count));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleExport = () => {
    const blob = new Blob([exportAllData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beyond-syllabus-journey-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Journey exported");
  };

  const handleImport = async (file: File) => {
    try {
      const { imported } = importAllData(await file.text());
      refresh();
      toast.success(`Imported ${imported} item(s)`);
    } catch (e: any) {
      toast.error(e?.message || "Import failed");
    }
  };

  const modules = journey ? Object.entries(journey.modules) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-mint-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 sticky top-0 z-20 bg-background/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">My Journey</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/select">Find a syllabus</Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Privacy note + streak */}
        <section className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-center">
            <Flame
              className={`h-7 w-7 mx-auto mb-1 ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`}
            />
            <p className="text-3xl font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">day streak</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-center">
            <Sparkles className="h-7 w-7 mx-auto mb-1 text-primary" />
            <p className="text-3xl font-bold">{modules.length}</p>
            <p className="text-xs text-muted-foreground">modules touched</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-center">
            <ListChecks className="h-7 w-7 mx-auto mb-1 text-primary" />
            <p className="text-3xl font-bold">
              {sheets.reduce((n, s) => n + s.count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">questions collected</p>
          </div>
        </section>

        <p className="text-xs text-muted-foreground text-center">
          Your journey lives on this device only. No account, no tracking.
          Export it anytime; it is yours.
        </p>

        {/* Exam runway */}
        {journey && journey.exams.length > 0 && (
          <section className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" /> Exam Runway
            </h2>
            {journey.exams
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((exam) => {
                const days = daysUntil(exam.date);
                const plan = buildRunwayPlan(exam);
                return (
                  <div
                    key={exam.id}
                    className="rounded-xl border border-border/50 p-3 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm flex-1 min-w-[10rem]">
                        {exam.subject}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          days <= 3
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : days <= 10
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {days < 0
                          ? "done"
                          : days === 0
                            ? "today"
                            : `${days} day${days === 1 ? "" : "s"} left`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          removeExam(exam.id);
                          refresh();
                        }}
                        aria-label="Remove exam"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                    {days >= 0 && (
                      <ol className="space-y-1.5">
                        {plan.map((item: RunwayItem) => (
                          <li
                            key={item.module.title}
                            className="flex flex-wrap items-center gap-2 text-sm"
                          >
                            <span className="text-xs text-muted-foreground w-20 shrink-0">
                              {item.suggestedDate.slice(5)}
                            </span>
                            <span className="flex-1 min-w-[10rem]">
                              {item.module.title}
                            </span>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                item.status
                                  ? STATUS_META[item.status].cls
                                  : "border-border/50 text-muted-foreground"
                              }`}
                            >
                              {item.status
                                ? STATUS_META[item.status].label
                                : "Untouched"}
                            </span>
                            {item.action !== "light-review" ? (
                              <Link
                                href={`/brainstorm?title=${encodeURIComponent(item.module.title)}&content=${encodeURIComponent(item.module.content)}`}
                                className="text-[11px] px-2 py-0.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1"
                              >
                                <BrainCircuit className="h-3 w-3" />
                                {item.action === "brainstorm"
                                  ? "Brainstorm"
                                  : "Revisit"}
                              </Link>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                light review
                              </span>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Weakest modules first; the eve of the exam stays free for
                      one light pass over everything.
                    </p>
                  </div>
                );
              })}
          </section>
        )}

        {/* Delivery mode */}
        <section className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-3">
          <h2 className="font-semibold text-sm">How should the AI talk to you?</h2>
          <div className="grid sm:grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setDeliveryMode(m.id);
                  refresh();
                  toast.success(`Delivery mode: ${m.label}`);
                }}
                className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                  journey?.deliveryMode === m.id
                    ? "border-primary bg-primary/10"
                    : "border-border/60 hover:bg-muted"
                }`}
              >
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.blurb}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Modules */}
        <section className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-3">
          <h2 className="font-semibold text-sm">Modules</h2>
          {!modules.length && (
            <p className="text-sm text-muted-foreground">
              Nothing yet. Open a module and hit{" "}
              <span className="text-primary font-medium">
                Brainstorm before class
              </span>{" "}
              to start your journey.
            </p>
          )}
          <ul className="space-y-2">
            {modules
              .sort(
                (a, b) =>
                  (b[1].lastActivity || "").localeCompare(a[1].lastActivity || "")
              )
              .map(([title, p]) => (
                <li
                  key={title}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 px-3 py-2"
                >
                  <span className="flex-1 min-w-[12rem] text-sm font-medium">
                    {title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.brainstormSessions}× brainstormed ·{" "}
                    {p.questionsCollected} questions
                  </span>
                  <div className="flex gap-1">
                    {(Object.keys(STATUS_META) as ModuleStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setModuleStatus(title, s);
                          refresh();
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                          p.status === s
                            ? STATUS_META[s].cls
                            : "border-border/50 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {STATUS_META[s].label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
          </ul>
        </section>

        {/* Question sheets */}
        <section className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-3">
          <h2 className="font-semibold text-sm">Question Sheets</h2>
          {!sheets.length && (
            <p className="text-sm text-muted-foreground">
              No sheets yet. Every brainstorm builds one.
            </p>
          )}
          <ul className="space-y-1">
            {sheets.map((s) => (
              <li key={s.module} className="text-sm flex justify-between gap-2">
                <span className="truncate">{s.module}</span>
                <span className="text-muted-foreground shrink-0">
                  {s.count} question{s.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Data portability */}
        <section className="flex flex-wrap gap-2 justify-center pb-8">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export my data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
        </section>
      </main>
    </div>
  );
}
