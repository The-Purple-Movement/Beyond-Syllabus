"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { orpc } from "@/lib/orpc";
import {
  GraduationCap,
  ListChecks,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";

type SavedClassroom = { code: string; name: string };

type Submission = { module: string; questions: string[]; at: number };

type AggregatedModule = {
  module: string;
  total: number;
  questions: { text: string; count: number }[];
};

function aggregate(submissions: Submission[]): AggregatedModule[] {
  const byModule = new Map<string, Map<string, number>>();
  for (const sub of submissions) {
    const mod = byModule.get(sub.module) ?? new Map<string, number>();
    for (const q of sub.questions) {
      const key = q.trim();
      mod.set(key, (mod.get(key) ?? 0) + 1);
    }
    byModule.set(sub.module, mod);
  }
  return Array.from(byModule.entries())
    .map(([module, qs]) => ({
      module,
      total: Array.from(qs.values()).reduce((a, b) => a + b, 0),
      questions: Array.from(qs.entries())
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.total - a.total);
}

const SAVED_KEY = "classrooms:v1";

export default function TeachPage() {
  const [saved, setSaved] = useState<SavedClassroom[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [active, setActive] = useState<{
    code: string;
    name: string;
    submissions: Submission[];
  } | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  useEffect(() => {
    document.title = "For Teachers | Beyond Syllabus";
    try {
      setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"));
    } catch {
      /* start fresh */
    }
  }, []);

  const persist = (list: SavedClassroom[]) => {
    setSaved(list);
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  };

  const createClassroom = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const result = (await orpc.classroom.create.call({
        name: newName.trim(),
      })) as { code: string; name: string };
      persist([...saved, result]);
      setNewName("");
      toast.success(`Classroom created: ${result.code}`);
      openClassroom(result.code);
    } catch (e: any) {
      toast.error(e?.message || "Could not create classroom");
    } finally {
      setCreating(false);
    }
  };

  const openClassroom = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setLoadingView(true);
    try {
      const result = (await orpc.classroom.get.call({
        code: normalized,
      })) as { name: string; submissions: Submission[] };
      setActive({ code: normalized, ...result });
    } catch (e: any) {
      toast.error(e?.message || "Could not open classroom");
    } finally {
      setLoadingView(false);
    }
  };

  const modules = active ? aggregate(active.submissions) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-mint-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 sticky top-0 z-20 bg-background/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Teach</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/select">Syllabus</Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto">
          The flipped classroom's other half: students brainstorm before class
          and send their questions in, <strong>anonymously</strong>: no names,
          no accounts, questions only. You walk in knowing exactly where the
          class actually is.
        </p>

        {/* Create + open */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-3">
            <h2 className="font-semibold text-sm">Create a classroom</h2>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. S3 AI&DS · Economics"
              maxLength={80}
              className="w-full rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button
              size="sm"
              onClick={createClassroom}
              disabled={!newName.trim() || creating}
            >
              <Plus className="h-4 w-4 mr-1" /> Create & get code
            </Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-3">
            <h2 className="font-semibold text-sm">Open a classroom</h2>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Classroom code"
              maxLength={6}
              className="w-full rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => openClassroom(codeInput)}
              disabled={codeInput.trim().length < 6 || loadingView}
            >
              Open
            </Button>
            {saved.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {saved.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => openClassroom(c.code)}
                    className="text-[11px] px-2 py-1 rounded-full border border-border/60 hover:bg-muted"
                    title={c.name}
                  >
                    <span className="font-mono">{c.code}</span> · {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Dashboard */}
        {active && (
          <section className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold flex-1 min-w-[12rem]">
                {active.name}{" "}
                <span className="font-mono text-sm text-muted-foreground">
                  ({active.code})
                </span>
              </h2>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {active.submissions.length}{" "}
                submission{active.submissions.length === 1 ? "" : "s"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openClassroom(active.code)}
                disabled={loadingView}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loadingView ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Students send questions from their Brainstorm sessions with your
              code: <span className="font-mono font-semibold">{active.code}</span>.
              Repeated questions rise to the top; those are your lecture's
              first ten minutes.
            </p>

            {!modules.length && (
              <p className="text-sm text-muted-foreground italic">
                No questions yet. Share the code and give it a class-prep
                cycle.
              </p>
            )}

            {modules.map((m) => (
              <div
                key={m.module}
                className="rounded-xl border border-border/50 p-3 space-y-2"
              >
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  {m.module}
                  <span className="text-xs text-muted-foreground font-normal">
                    {m.total} question{m.total === 1 ? "" : "s"}
                  </span>
                </h3>
                <ol className="space-y-1.5">
                  {m.questions.map((q) => (
                    <li
                      key={q.text}
                      className="flex items-start gap-2 text-sm"
                    >
                      {q.count > 1 && (
                        <span className="shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          ×{q.count}
                        </span>
                      )}
                      <span>{q.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
