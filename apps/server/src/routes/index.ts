import { publicProcedure } from "../lib/orpc";
import type { RouterClient } from "@orpc/server";
import path from "node:path";
import { file } from "bun";
import { shareRoutes } from "./share";
import { classroomRoutes } from "./classroom";

// Parse the syllabus dataset once per process instead of on every request.
let syllabusCache: Record<string, unknown> | null = null;

async function loadSyllabus(): Promise<Record<string, unknown>> {
  if (!syllabusCache) {
    syllabusCache = await file(
      path.join(process.cwd(), "src/routes/syllabus/syllabus.json")
    ).json();
  }
  return syllabusCache as Record<string, unknown>;
}

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  syllabus: publicProcedure.handler(async () => {
    return loadSyllabus();
  }),
  // Per-university slice so clients on slow connections don't have to pull
  // the full multi-megabyte dataset to browse one university.
  syllabusUniversities: publicProcedure.handler(async () => {
    return Object.keys(await loadSyllabus());
  }),
  syllabusForUniversity: publicProcedure.handler(async ({ input }) => {
    const { university } = (input ?? {}) as { university?: string };
    if (!university || typeof university !== "string") {
      throw new Error("university is required");
    }
    const data = await loadSyllabus();
    const slice = data[university];
    if (!slice) {
      throw new Error(`Unknown university: ${university}`);
    }
    return { [university]: slice };
  }),
  share: shareRoutes,
  classroom: classroomRoutes,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
