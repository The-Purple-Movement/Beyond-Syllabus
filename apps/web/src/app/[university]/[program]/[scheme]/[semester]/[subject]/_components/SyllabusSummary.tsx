"use client";

import { useState, useEffect } from "react";
import { BookText, Sparkles } from "lucide-react";
import { summarizeSyllabus } from "@/ai/flows/summarize-syllabus";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SyllabusSummaryProps } from "@/lib/types";

/**
 * On-demand course overview.
 *
 * Deliberately NOT auto-generated on mount: that made an AI call on every
 * page view (cost, latency) and pushed the real syllabus content below a
 * wall of generated text. The student asks for it; the result is cached on
 * the device so asking is a one-time cost per subject.
 */

const CACHE_PREFIX = "syllabus-summary:v2:";

// Stable tiny hash so the cache key survives whitespace-level data edits
function contentKey(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return CACHE_PREFIX + (h >>> 0).toString(36);
}

export function SyllabusSummary({ fullSyllabus }: SyllabusSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show a cached summary instantly if this subject was summarized before
  useEffect(() => {
    if (!fullSyllabus.trim()) return;
    try {
      const cached = localStorage.getItem(contentKey(fullSyllabus));
      if (cached) setSummary(cached);
    } catch {
      // no storage, no cache: the button still works
    }
  }, [fullSyllabus]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await summarizeSyllabus({ syllabusText: fullSyllabus });
      setSummary(result.summary);
      try {
        localStorage.setItem(contentKey(fullSyllabus), result.summary);
      } catch {
        // cache write is best-effort
      }
    } catch (e) {
      console.error("Error summarizing syllabus:", e);
      setError("Could not generate the overview. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  if (!fullSyllabus.trim()) return null;

  return (
    <div className="space-y-4 bg-white dark:bg-black/50 backdrop-blur-sm p-6 rounded-2xl shadow-md border max-h-[500px] overflow-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold">This course, in short</h3>
        </div>
        {summary && !loading && (
          <Button size="sm" variant="ghost" onClick={generate}>
            Regenerate
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!summary && !loading && !error && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground">
              A plain-language overview of what this course is about and what
              you will be able to do after it. Generated once, then saved on
              your device.
            </p>
            <Button onClick={generate} variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Summarize this course
            </Button>
          </motion.div>
        )}

        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-2 text-muted-foreground py-4"
          >
            <Spinner className="h-5 w-5" />
            <span>Reading the syllabus...</span>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4 space-y-2"
          >
            <p className="text-destructive text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={generate}>
              Try again
            </Button>
          </motion.div>
        )}

        {summary && !loading && !error && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm leading-relaxed"
          >
            <Streamdown>{summary}</Streamdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
