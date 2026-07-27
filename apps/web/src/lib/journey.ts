"use client";

/**
 * The Journey store: local-first continuity for Beyond Syllabus.
 *
 * Principles (docs/VISION.md): learning never requires an account, so the
 * journey lives on the device. Everything is exportable/importable JSON,
 * and the shape is deliberately sync-ready so future lightweight accounts
 * or μLearn Karma interop can attach without a rewrite.
 */

export type ModuleStatus = "explored" | "shaky" | "solid";

export type DeliveryMode = "peer" | "mentor" | "example-first";

export interface ModuleProgress {
  status: ModuleStatus;
  brainstormSessions: number;
  questionsCollected: number;
  lastActivity: string; // ISO date
}

export interface ExamModule {
  title: string;
  content: string;
}

export interface Exam {
  id: string;
  subject: string;
  /** YYYY-MM-DD */
  date: string;
  modules: ExamModule[];
}

export interface Journey {
  version: 1;
  deliveryMode: DeliveryMode;
  /** keyed by module title (same key the Question Sheet uses) */
  modules: Record<string, ModuleProgress>;
  /** YYYY-MM-DD days with any learning activity, for streaks */
  activeDays: string[];
  /** upcoming exams for the runway */
  exams: Exam[];
}

const KEY = "journey:v1";

const EMPTY: Journey = {
  version: 1,
  deliveryMode: "mentor",
  modules: {},
  activeDays: [],
  exams: [],
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadJourney(): Journey {
  if (!isBrowser()) return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return { ...EMPTY };
    return {
      ...EMPTY,
      ...parsed,
      modules: parsed.modules ?? {},
      exams: parsed.exams ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

function saveJourney(j: Journey): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(j));
}

/**
 * Local-calendar date as YYYY-MM-DD. Never use toISOString() for day
 * bookkeeping: it converts to UTC, which shifts any time before 05:30
 * IST onto the previous day (wrong streaks, runway dates in the past).
 */
function localDate(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function today(): string {
  return localDate();
}

function touchModule(j: Journey, moduleTitle: string): ModuleProgress {
  const existing = j.modules[moduleTitle];
  const entry: ModuleProgress = existing ?? {
    status: "explored",
    brainstormSessions: 0,
    questionsCollected: 0,
    lastActivity: today(),
  };
  entry.lastActivity = today();
  j.modules[moduleTitle] = entry;
  if (!j.activeDays.includes(today())) j.activeDays.push(today());
  return entry;
}

export function recordBrainstormSession(moduleTitle: string): void {
  if (!moduleTitle) return;
  const j = loadJourney();
  const entry = touchModule(j, moduleTitle);
  entry.brainstormSessions += 1;
  saveJourney(j);
}

export function recordQuestionCollected(moduleTitle: string): void {
  if (!moduleTitle) return;
  const j = loadJourney();
  const entry = touchModule(j, moduleTitle);
  entry.questionsCollected += 1;
  saveJourney(j);
}

export function setModuleStatus(
  moduleTitle: string,
  status: ModuleStatus
): void {
  if (!moduleTitle) return;
  const j = loadJourney();
  const entry = touchModule(j, moduleTitle);
  entry.status = status;
  saveJourney(j);
}

export function getModuleStatus(moduleTitle: string): ModuleStatus | null {
  const j = loadJourney();
  return j.modules[moduleTitle]?.status ?? null;
}

export function setDeliveryMode(mode: DeliveryMode): void {
  const j = loadJourney();
  j.deliveryMode = mode;
  saveJourney(j);
}

export function getDeliveryMode(): DeliveryMode {
  return loadJourney().deliveryMode;
}

export function addExam(subject: string, date: string, modules: ExamModule[]): Exam {
  const j = loadJourney();
  const exam: Exam = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    subject,
    date,
    modules,
  };
  // One exam per subject: replacing beats duplicating
  j.exams = [...j.exams.filter((e) => e.subject !== subject), exam];
  saveJourney(j);
  return exam;
}

export function removeExam(id: string): void {
  const j = loadJourney();
  j.exams = j.exams.filter((e) => e.id !== id);
  saveJourney(j);
}

export function getExamForSubject(subject: string): Exam | null {
  return loadJourney().exams.find((e) => e.subject === subject) ?? null;
}

export function daysUntil(dateISO: string): number {
  const target = new Date(`${dateISO}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

export interface RunwayItem {
  module: ExamModule;
  status: ModuleStatus | null;
  /** YYYY-MM-DD suggested study date */
  suggestedDate: string;
  action: "brainstorm" | "revisit" | "light-review";
}

/**
 * The revision plan: weakest modules first, spread across the days left,
 * with the final day reserved for a light pass over everything.
 */
export function buildRunwayPlan(exam: Exam): RunwayItem[] {
  const j = loadJourney();
  const priority = (s: ModuleStatus | null): number =>
    s === "shaky" ? 0 : s === null ? 1 : s === "explored" ? 2 : 3;

  const ordered = [...exam.modules].sort(
    (a, b) =>
      priority(j.modules[a.title]?.status ?? null) -
      priority(j.modules[b.title]?.status ?? null)
  );

  const totalDays = Math.max(daysUntil(exam.date), 1);
  // Study days exclude the exam day itself and reserve the eve for review
  const studyDays = Math.max(totalDays - 1, 1);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return ordered.map((module, i) => {
    const status = j.modules[module.title]?.status ?? null;
    const offset =
      ordered.length <= 1
        ? 0
        : Math.min(
            Math.floor((i * studyDays) / ordered.length),
            studyDays - 1
          );
    const d = new Date(start);
    d.setDate(d.getDate() + offset);
    return {
      module,
      status,
      suggestedDate: localDate(d),
      action:
        status === "solid"
          ? "light-review"
          : status === null
            ? "brainstorm"
            : "revisit",
    };
  });
}

/** Consecutive active days ending today or yesterday */
export function getStreak(): number {
  const days = new Set(loadJourney().activeDays);
  if (!days.size) return 0;
  const d = new Date();
  // A streak survives if yesterday was active even when today isn't yet
  if (!days.has(localDate(d))) {
    d.setDate(d.getDate() - 1);
    if (!days.has(localDate(d))) return 0;
  }
  let streak = 0;
  while (days.has(localDate(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Everything Beyond Syllabus keeps on this device, as portable JSON */
export function exportAllData(): string {
  const dump: Record<string, unknown> = {};
  if (isBrowser()) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key === KEY || key.startsWith("question-sheet:")) {
        try {
          dump[key] = JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          dump[key] = localStorage.getItem(key);
        }
      }
    }
  }
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), app: "beyond-syllabus", data: dump },
    null,
    2
  );
}

/** Merge an exported dump back in (imported device wins on conflicts) */
export function importAllData(raw: string): { imported: number } {
  const parsed = JSON.parse(raw);
  const data = parsed?.data;
  if (!data || typeof data !== "object") {
    throw new Error("Not a Beyond Syllabus export file");
  }
  let imported = 0;
  for (const [key, value] of Object.entries(data)) {
    if (key === KEY || key.startsWith("question-sheet:")) {
      localStorage.setItem(key, JSON.stringify(value));
      imported += 1;
    }
  }
  return { imported };
}

/**
 * Last course selection: remembered so returning students skip the wizard.
 * Same local-first rules as the journey itself.
 */
export interface LastSelection {
  university: string;
  program: string;
  scheme: string;
  semester: string;
}

const SELECTION_KEY = "journey:last-selection";

export function saveLastSelection(sel: LastSelection): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(sel));
  } catch {
    // storage full or blocked: losing the shortcut is acceptable
  }
}

export function getLastSelection(): LastSelection | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    if (!raw) return null;
    const sel = JSON.parse(raw) as LastSelection;
    if (sel.university && sel.program && sel.scheme && sel.semester) return sel;
    return null;
  } catch {
    return null;
  }
}
