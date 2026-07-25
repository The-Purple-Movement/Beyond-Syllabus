"use server";

import { ai } from "@/ai/ai";
import { Message } from "@/lib/types";

export type BrainstormStage = "prime" | "explore" | "question";

export interface GuidedBrainstormInput {
  stage: BrainstormStage;
  moduleTitle: string;
  moduleContent: string;
  history: Message[];
  /** Empty string on stage entry: the flow produces the stage's opening move */
  message: string;
  model?: string;
  /** Student's preferred voice, from their Journey settings */
  deliveryMode?: "peer" | "mentor" | "example-first";
}

export interface GuidedBrainstormOutput {
  response: string;
  /** Classroom-ready candidate questions distilled from this exchange */
  suggestedQuestions: string[];
}

const STAGE_GOALS: Record<BrainstormStage, string> = {
  prime: `STAGE: PRIME (activate prior knowledge).
Your job is to find out what the student already knows and hook this module onto it.
- Open by asking what they already know, have heard about, or have used related to this module. Everyday experience counts.
- Affirm partial knowledge; never quiz-shame. Wrong guesses are raw material, treat them warmly and note what the guess got right.
- Connect what they say to the module's foundations in one or two sentences at a time.
- Keep every turn under 120 words. One question per turn, never more.`,
  explore: `STAGE: EXPLORE (why this matters, where it lives in the real world).
Your job is to make the module feel worth learning before class covers it.
- Give the why behind topics: what problem did this solve, who uses it today, one concrete and locally relatable example.
- Prefer vivid, specific examples over coverage. One idea per turn.
- Keep every turn under 150 words, and end each turn with one forward question that invites the student to predict, guess, or connect.`,
  question: `STAGE: QUESTION (turn confusion into classroom-ready questions).
Your job is to help the student leave with sharp questions to ask in class, NOT to answer everything yourself.
- When the student voices a confusion or half-formed thought, reflect it back as one or two well-formed, specific questions they could ask their teacher.
- A good question names the concept, states what is understood, and pinpoints where understanding breaks.
- Resist answering deep questions fully: sharpen them instead, and say why it is a good question to bring to class.
- Keep every turn under 120 words.`,
};

const DELIVERY_VOICES: Record<
  NonNullable<GuidedBrainstormInput["deliveryMode"]>,
  string
> = {
  peer: "VOICE: talk like a sharp classmate. Casual, direct, zero jargon, humor welcome.",
  mentor:
    "VOICE: talk like a warm mentor. Encouraging, clear, guiding without lecturing.",
  "example-first":
    "VOICE: open every idea with a concrete, relatable example before naming the concept.",
};

function buildSystemPrompt(input: GuidedBrainstormInput): string {
  return `You are the Guided Brainstorm companion in Beyond Syllabus, an open-source tool of The Purple Movement. The student is preparing BEFORE class (flipped classroom). Success is NOT that you explained well; success is that the student leaves with better questions than they came with.

${DELIVERY_VOICES[input.deliveryMode || "mentor"]}

MODULE: ${input.moduleTitle}
MODULE CONTENT (your only syllabus scope):
${input.moduleContent}

${STAGE_GOALS[input.stage]}

RULES FOR EVERY TURN:
- Warm, direct, peer-mentor voice. No lecturing, no walls of text.
- Stay anchored to this module; if the student drifts far off, steer back kindly using the module content.
- After your reply, on new lines, output exactly:
QUESTIONS:
- <up to 3 short, classroom-ready questions that capture the student's current live confusions or curiosities, written in the student's voice>
If nothing new emerged this turn, repeat the single best open question so far. Never omit the QUESTIONS block.`;
}

function parseOutput(raw: string): GuidedBrainstormOutput {
  const marker = /\nQUESTIONS:\s*\n/i;
  const match = raw.split(marker);
  if (match.length >= 2) {
    const response = match[0].trim();
    const questions = match[match.length - 1]
      .split("\n")
      .map((l) => l.replace(/^[-*]\s*/, "").trim())
      .filter((l) => l.length > 5 && l.length < 240)
      .slice(0, 3);
    if (response) return { response, suggestedQuestions: questions };
  }
  return { response: raw.trim(), suggestedQuestions: [] };
}

const STAGE_OPENERS: Record<BrainstormStage, string> = {
  prime:
    "Begin the PRIME stage now: greet the student in one short line and ask your opening prior-knowledge question about this module.",
  explore:
    "Begin the EXPLORE stage now: in one short move, give the most compelling real-world reason this module exists, then ask your forward question.",
  question:
    "Begin the QUESTION stage now: briefly recap (one line) the most interesting thread so far if any, then invite the student to voice what still feels foggy so you can shape it into questions for class.",
};

export async function guidedBrainstorm(
  input: GuidedBrainstormInput
): Promise<GuidedBrainstormOutput> {
  try {
    const history = input.history
      .filter((m) => m.role !== "system")
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    const userContent =
      input.message.trim() || STAGE_OPENERS[input.stage];

    const completion = await ai.chat.completions.create({
      messages: [
        { role: "system", content: buildSystemPrompt(input) },
        ...history,
        { role: "user", content: userContent },
      ],
      model: input.model || "llama-3.1-8b-instant",
      temperature: 0.6,
      max_completion_tokens: 700,
      top_p: 0.9,
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    if (!raw) {
      throw new Error("Empty model response");
    }
    return parseOutput(raw);
  } catch (e) {
    console.error("Error in guided brainstorm flow:", e);
    return {
      response:
        "Something went wrong on my side. Give it another try, or rephrase your last thought.",
      suggestedQuestions: [],
    };
  }
}
