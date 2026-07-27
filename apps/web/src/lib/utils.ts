import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Words that stay lowercase mid-title; acronyms that stay uppercase anywhere.
const MINOR_WORDS = new Set([
  "a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with",
]);
const ACRONYMS = new Set([
  "ai", "aiml", "ml", "iot", "it", "cse", "ece", "eee", "vlsi", "ktu", "apj",
  "ii", "iii", "iv", "vi", "vii", "viii",
]);

/**
 * Turn a data-derived slug or ALL CAPS name into a human title.
 * "artificial-intelligence-and-data-science" -> "Artificial Intelligence and Data Science"
 */
export function titleCase(input?: string): string {
  if (!input) return "";
  return input
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((raw, i) => {
      const word = raw.toLowerCase();
      if (ACRONYMS.has(word)) return word.toUpperCase();
      if (i > 0 && MINOR_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
