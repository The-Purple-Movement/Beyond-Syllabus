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

export interface Journey {
  version: 1;
  deliveryMode: DeliveryMode;
  /** keyed by module title (same key the Question Sheet uses) */
  modules: Record<string, ModuleProgress>;
  /** YYYY-MM-DD days with any learning activity, for streaks */
  activeDays: string[];
}

const KEY = "journey:v1";

const EMPTY: Journey = {
  version: 1,
  deliveryMode: "mentor",
  modules: {},
  activeDays: [],
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
    return { ...EMPTY, ...parsed, modules: parsed.modules ?? {} };
  } catch {
    return { ...EMPTY };
  }
}

function saveJourney(j: Journey): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(j));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
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

/** Consecutive active days ending today or yesterday */
export function getStreak(): number {
  const days = new Set(loadJourney().activeDays);
  if (!days.size) return 0;
  const d = new Date();
  // A streak survives if yesterday was active even when today isn't yet
  if (!days.has(d.toISOString().slice(0, 10))) {
    d.setDate(d.getDate() - 1);
    if (!days.has(d.toISOString().slice(0, 10))) return 0;
  }
  let streak = 0;
  while (days.has(d.toISOString().slice(0, 10))) {
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
