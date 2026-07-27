import { Redis } from "@upstash/redis";
import { ORPCError } from "@orpc/client";
import { randomBytes } from "node:crypto";
import { publicProcedure } from "../../lib/orpc";
import { env } from "../../config/env";

/**
 * Classrooms: the flipped classroom's teacher half.
 *
 * A teacher creates a classroom and shares its code. Students submit the
 * questions from their Question Sheets anonymously: no names, no ids,
 * questions only. The teacher sees the aggregate per module.
 *
 * Storage: Upstash Redis when real credentials are configured (same infra
 * as share links), otherwise an in-process memory store so local dev and
 * credential-less self-hosting still work (single process, non-durable).
 */

const TTL_SECONDS = 60 * 60 * 24 * 60; // 60 days, refreshed on activity
const MAX_SUBMISSIONS = 500;
const MAX_QUESTIONS_PER_SUBMISSION = 20;
const MAX_QUESTION_LENGTH = 300;

interface ClassroomMeta {
  name: string;
  createdAt: number;
}

export interface Submission {
  module: string;
  questions: string[];
  at: number;
}

interface ClassroomStore {
  getMeta(code: string): Promise<ClassroomMeta | null>;
  setMeta(code: string, meta: ClassroomMeta): Promise<void>;
  addSubmission(code: string, sub: Submission): Promise<number>;
  getSubmissions(code: string): Promise<Submission[]>;
}

class RedisStore implements ClassroomStore {
  private redis = new Redis({
    url: env.UPSTASH_REDIS_URL,
    token: env.UPSTASH_REDIS_TOKEN,
  });

  async getMeta(code: string) {
    return (await this.redis.get<ClassroomMeta>(`class:${code}`)) ?? null;
  }
  async setMeta(code: string, meta: ClassroomMeta) {
    await this.redis.set(`class:${code}`, meta, { ex: TTL_SECONDS });
  }
  async addSubmission(code: string, sub: Submission) {
    const key = `class:${code}:subs`;
    const len = await this.redis.rpush(key, JSON.stringify(sub));
    await this.redis.ltrim(key, -MAX_SUBMISSIONS, -1);
    await this.redis.expire(key, TTL_SECONDS);
    await this.redis.expire(`class:${code}`, TTL_SECONDS);
    return Math.min(len, MAX_SUBMISSIONS);
  }
  async getSubmissions(code: string) {
    const raw = await this.redis.lrange(`class:${code}:subs`, 0, -1);
    return raw
      .map((r) => {
        try {
          return typeof r === "string" ? (JSON.parse(r) as Submission) : (r as Submission);
        } catch {
          return null;
        }
      })
      .filter((s): s is Submission => !!s);
  }
}

class MemoryStore implements ClassroomStore {
  private meta = new Map<string, { v: ClassroomMeta; exp: number }>();
  private subs = new Map<string, { v: Submission[]; exp: number }>();

  private alive<T>(entry: { v: T; exp: number } | undefined): T | null {
    if (!entry) return null;
    if (Date.now() > entry.exp) return null;
    return entry.v;
  }
  async getMeta(code: string) {
    return this.alive(this.meta.get(code));
  }
  async setMeta(code: string, meta: ClassroomMeta) {
    this.meta.set(code, { v: meta, exp: Date.now() + TTL_SECONDS * 1000 });
  }
  async addSubmission(code: string, sub: Submission) {
    const entry = this.subs.get(code);
    const list = this.alive(entry) ?? [];
    list.push(sub);
    while (list.length > MAX_SUBMISSIONS) list.shift();
    this.subs.set(code, { v: list, exp: Date.now() + TTL_SECONDS * 1000 });
    return list.length;
  }
  async getSubmissions(code: string) {
    return this.alive(this.subs.get(code)) ?? [];
  }
}

// Real Upstash tokens are long; placeholders and empty configs are not.
const store: ClassroomStore =
  env.UPSTASH_REDIS_TOKEN && env.UPSTASH_REDIS_TOKEN.length > 30
    ? new RedisStore()
    : new MemoryStore();

function generateCode(): string {
  // 6 chars, unambiguous alphabet, uppercase for easy dictation in a room
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

const sanitizeQuestions = (questions: unknown): string[] => {
  if (!Array.isArray(questions)) return [];
  return questions
    .filter((q): q is string => typeof q === "string")
    .map((q) => q.trim())
    .filter((q) => q.length > 3 && q.length <= MAX_QUESTION_LENGTH)
    .slice(0, MAX_QUESTIONS_PER_SUBMISSION);
};

export const classroomRoutes = {
  create: publicProcedure.handler(async ({ input }) => {
    const { name } = (input ?? {}) as { name?: string };
    const trimmed = (name ?? "").trim();
    if (!trimmed || trimmed.length > 80) {
      throw new ORPCError("Invalid Input", {
        message: "Classroom name is required (max 80 characters)",
      });
    }
    let code = generateCode();
    // Regenerate on the (unlikely) collision
    while (await store.getMeta(code)) code = generateCode();
    await store.setMeta(code, { name: trimmed, createdAt: Date.now() });
    return { code, name: trimmed };
  }),

  submit: publicProcedure.handler(async ({ input }) => {
    const { code, module, questions } = (input ?? {}) as {
      code?: string;
      module?: string;
      questions?: unknown;
    };
    const normalizedCode = (code ?? "").trim().toUpperCase();
    const meta = normalizedCode ? await store.getMeta(normalizedCode) : null;
    if (!meta) {
      throw new ORPCError("Not Found", {
        message: "That classroom code doesn't exist (or has expired)",
      });
    }
    const clean = sanitizeQuestions(questions);
    if (!clean.length) {
      throw new ORPCError("Invalid Input", {
        message: "Nothing to send: the sheet has no valid questions",
      });
    }
    const count = await store.addSubmission(normalizedCode, {
      module: (module ?? "General").trim().slice(0, 200) || "General",
      questions: clean,
      at: Date.now(),
    });
    return { ok: true, submissions: count };
  }),

  get: publicProcedure.handler(async ({ input }) => {
    const { code } = (input ?? {}) as { code?: string };
    const normalizedCode = (code ?? "").trim().toUpperCase();
    const meta = normalizedCode ? await store.getMeta(normalizedCode) : null;
    if (!meta) {
      throw new ORPCError("Not Found", {
        message: "That classroom code doesn't exist (or has expired)",
      });
    }
    const submissions = await store.getSubmissions(normalizedCode);
    return { name: meta.name, createdAt: meta.createdAt, submissions };
  }),
};
