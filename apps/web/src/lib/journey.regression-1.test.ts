// Regression: ISSUE-005 — journey day bookkeeping used toISOString() (UTC),
// so runway plans started "yesterday" and streaks credited pre-05:30 IST
// activity to the wrong day for every user east of UTC.
// Found by /qa on 2026-07-28
// Report: .gstack/qa-reports/qa-report-beyond-syllabus-web-beta-2026-07-28.md
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import {
  addExam,
  buildRunwayPlan,
  getStreak,
  recordBrainstormSession,
  setModuleStatus,
  getModuleStatus,
} from "./journey";

// The local-calendar date the app should always use for "today"
function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("local-calendar day bookkeeping (ISSUE-005)", () => {
  it("records activity on the local date, even just after local midnight", () => {
    // 00:30 local time: toISOString() would put this on the previous
    // day for any timezone east of UTC. The local calendar must win.
    const now = new Date();
    vi.useFakeTimers();
    vi.setSystemTime(
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 30)
    );

    recordBrainstormSession("Test Module");
    expect(getStreak()).toBe(1);
  });

  it("runway plan never schedules a session in the past", () => {
    const exam = addExam("Test Subject", futureDate(10), [
      { title: "Module A", content: "a" },
      { title: "Module B", content: "b" },
      { title: "Module C", content: "c" },
    ]);
    const plan = buildRunwayPlan(exam);

    const today = localToday();
    for (const item of plan) {
      expect(item.suggestedDate >= today).toBe(true);
    }
    // First session is today: the plan starts where the student stands
    expect(plan[0].suggestedDate).toBe(today);
  });

  it("runway leaves the exam eve free (no session on or after the eve)", () => {
    const examDate = futureDate(5);
    const exam = addExam("Eve Subject", examDate, [
      { title: "M1", content: "x" },
      { title: "M2", content: "y" },
      { title: "M3", content: "z" },
      { title: "M4", content: "w" },
    ]);
    const plan = buildRunwayPlan(exam);
    for (const item of plan) {
      expect(item.suggestedDate < examDate).toBe(true);
    }
  });
});

describe("runway prioritization", () => {
  it("shaky modules come before untouched, untouched before solid", () => {
    setModuleStatus("Solid One", "solid");
    setModuleStatus("Shaky One", "shaky");
    // "Fresh One" stays untouched

    const exam = addExam("Priority Subject", futureDate(12), [
      { title: "Solid One", content: "s" },
      { title: "Fresh One", content: "f" },
      { title: "Shaky One", content: "k" },
    ]);
    const titles = buildRunwayPlan(exam).map((i) => i.module.title);
    expect(titles).toEqual(["Shaky One", "Fresh One", "Solid One"]);
  });
});

describe("module status store", () => {
  it("round-trips a status through localStorage", () => {
    setModuleStatus("Round Trip", "explored");
    expect(getModuleStatus("Round Trip")).toBe("explored");
    expect(getModuleStatus("Never Touched")).toBeNull();
  });
});

/** A YYYY-MM-DD local date N days from now */
function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
