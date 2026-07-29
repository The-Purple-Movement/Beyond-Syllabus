/**
 * Semester helpers.
 *
 * Some universities do not publish every semester under every branch. KTU's
 * 2024 scheme is the case that prompted this: semesters 3 to 8 are
 * branch-specific, but the first year is common across branches and
 * published separately (as Groups A to D). A student who picks their branch
 * sees a semester list starting at 3 and concludes their syllabus is
 * missing, when it is actually sitting under a sibling program whose name
 * means nothing to them.
 *
 * Nothing here hardcodes KTU or the word "group". The signal is structural:
 * a shared-year program covers the semesters this program is missing and
 * does not overlap the semesters it already has.
 */

/** `s01`, `s3`, `S05` all become the number. Returns 0 when unparseable. */
export function semesterNumber(id: string): number {
  return Number(String(id).replace(/\D/g, "")) || 0;
}

/** `s01` and `s3` both render as "Semester 3"-style labels. */
export function semesterLabel(id: string): string {
  const n = semesterNumber(id);
  return n ? `Semester ${n}` : String(id);
}

export interface SharedYearProgram {
  /** program id, as used in URLs */
  id: string;
  /** the semester ids this program publishes, lowest first */
  semesterIds: string[];
  /** those same semesters as numbers, lowest first */
  semesters: number[];
}

/**
 * Find sibling programs that publish the early semesters this program is
 * missing.
 *
 * A sibling qualifies only when it covers at least one missing semester
 * AND shares no semester with the current program. That complementary
 * shape is what distinguishes a shared first year (semesters 1 and 2 only)
 * from an unrelated program that merely also happens to run a semester 1.
 */
export function findSharedYearPrograms(args: {
  /** every program for this university, i.e. directory[universityId] */
  programs: Record<string, any> | undefined | null;
  currentProgramId: string;
  schemeId: string;
  /** semester ids the current program publishes for this scheme */
  currentSemesterIds: string[];
}): SharedYearProgram[] {
  const { programs, currentProgramId, schemeId, currentSemesterIds } = args;
  if (!programs) return [];

  const mine = currentSemesterIds.map(semesterNumber).filter(Boolean);
  if (!mine.length) return [];

  const lowest = Math.min(...mine);
  if (lowest <= 1) return []; // nothing missing before the start

  const missing: number[] = [];
  for (let n = 1; n < lowest; n++) missing.push(n);

  const found: SharedYearProgram[] = [];
  for (const id of Object.keys(programs)) {
    if (id === currentProgramId) continue;
    const scheme = programs[id]?.[schemeId];
    if (!scheme) continue;

    const semesterIds = Object.keys(scheme);
    const semesters = semesterIds.map(semesterNumber).filter(Boolean);
    if (!semesters.length) continue;

    const coversMissing = semesters.some((s) => missing.includes(s));
    const overlapsMine = semesters.some((s) => mine.includes(s));
    if (coversMissing && !overlapsMine) {
      found.push({
        id,
        semesterIds: [...semesterIds].sort(
          (a, b) => semesterNumber(a) - semesterNumber(b)
        ),
        semesters: [...semesters].sort((a, b) => a - b),
      });
    }
  }

  return found.sort((a, b) => a.id.localeCompare(b.id));
}
