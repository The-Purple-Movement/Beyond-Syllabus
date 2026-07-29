// Shaped from the real KTU 2024 directory (verified against WikiSyllabus on
// 2026-07-29): branches publish s03-s08, the common first year is published
// as group-a..group-d with s01/s02, and semester ids are inconsistently
// padded (`s3` under one branch, `s03` under another).
import { describe, expect, it } from "vitest";
import {
  findSharedYearPrograms,
  semesterLabel,
  semesterNumber,
} from "./semesters";

const KTU_2024 = {
  "computer-science-and-design": {
    "2024": { s03: {}, s04: {}, s05: {}, s06: {}, s07: {}, s08: {} },
  },
  "electronics-and-communication-engineering": {
    // deliberately unpadded, exactly as the repo has it today
    "2024": { s3: {}, s4: {}, s5: {}, s6: {}, s7: {}, s8: {} },
  },
  "group-a": { "2024": { s01: {}, s02: {} } },
  "group-b": { "2024": { s01: {} } },
  "group-c": { "2024": { s01: {}, s02: {} } },
  "group-d": { "2024": { s01: {}, s02: {} } },
  // An unrelated program that also runs a first semester but overlaps the
  // branch range: it must NOT be offered as a shared first year.
  mca: { "2024": { s01: {}, s02: {}, s03: {}, s04: {} } },
};

describe("semesterNumber / semesterLabel", () => {
  it("normalizes padded, unpadded, and uppercase ids", () => {
    expect(semesterNumber("s01")).toBe(1);
    expect(semesterNumber("s3")).toBe(3);
    expect(semesterNumber("S05")).toBe(5);
    expect(semesterLabel("s03")).toBe("Semester 3");
    expect(semesterLabel("s3")).toBe("Semester 3");
  });

  it("does not crash on junk", () => {
    expect(semesterNumber("")).toBe(0);
    expect(semesterLabel("nonsense")).toBe("nonsense");
  });
});

describe("findSharedYearPrograms", () => {
  it("surfaces the common first year for a branch that starts at semester 3", () => {
    const found = findSharedYearPrograms({
      programs: KTU_2024,
      currentProgramId: "computer-science-and-design",
      schemeId: "2024",
      currentSemesterIds: ["s03", "s04", "s05", "s06", "s07", "s08"],
    });
    expect(found.map((f) => f.id)).toEqual([
      "group-a",
      "group-b",
      "group-c",
      "group-d",
    ]);
    expect(found[0].semesters).toEqual([1, 2]);
  });

  it("excludes overlapping programs like MCA", () => {
    const found = findSharedYearPrograms({
      programs: KTU_2024,
      currentProgramId: "computer-science-and-design",
      schemeId: "2024",
      currentSemesterIds: ["s03", "s04", "s05", "s06", "s07", "s08"],
    });
    expect(found.map((f) => f.id)).not.toContain("mca");
  });

  it("works when the current program uses unpadded semester ids", () => {
    const found = findSharedYearPrograms({
      programs: KTU_2024,
      currentProgramId: "electronics-and-communication-engineering",
      schemeId: "2024",
      currentSemesterIds: ["s3", "s4", "s5", "s6", "s7", "s8"],
    });
    expect(found.map((f) => f.id)).toContain("group-c");
  });

  it("returns nothing when the program already starts at semester 1", () => {
    expect(
      findSharedYearPrograms({
        programs: KTU_2024,
        currentProgramId: "group-a",
        schemeId: "2024",
        currentSemesterIds: ["s01", "s02"],
      })
    ).toEqual([]);
  });

  it("returns nothing when no sibling covers the gap", () => {
    expect(
      findSharedYearPrograms({
        programs: { solo: { "2024": { s03: {}, s04: {} } } },
        currentProgramId: "solo",
        schemeId: "2024",
        currentSemesterIds: ["s03", "s04"],
      })
    ).toEqual([]);
  });

  it("is safe on missing or empty input", () => {
    expect(
      findSharedYearPrograms({
        programs: null,
        currentProgramId: "x",
        schemeId: "2024",
        currentSemesterIds: ["s03"],
      })
    ).toEqual([]);
    expect(
      findSharedYearPrograms({
        programs: KTU_2024,
        currentProgramId: "x",
        schemeId: "2024",
        currentSemesterIds: [],
      })
    ).toEqual([]);
  });
});
