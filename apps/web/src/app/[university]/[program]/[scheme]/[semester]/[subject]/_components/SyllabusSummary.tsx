"use client";

import { useState, useEffect } from "react";
import { BookText } from "lucide-react";
import { summarizeSyllabus } from "@/ai/flows/summarize-syllabus";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import { Spinner } from "@/components/ui/spinner";
import { SyllabusSummaryProps } from "@/lib/types";

export function SyllabusSummary({ fullSyllabus }: SyllabusSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate summary on mount
  useEffect(() => {
    const generateSummary = async () => {
      if (!fullSyllabus.trim()) {
        setSummary("No syllabus content available to summarize.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await summarizeSyllabus({ syllabusText: fullSyllabus });
        setSummary(result.summary);
      } catch (e: any) {
        console.error("Error summarizing syllabus:", e);
        setError("Failed to generate summary.");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [fullSyllabus]);

  return (
    <div className="space-y-4 bg-white dark:bg-black/50 backdrop-blur-sm p-6 rounded-2xl shadow-md border h-[500px] overflow-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BookText className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Syllabus Summary</h3>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-2 text-muted-foreground py-4"
          >
            <Spinner className="h-5 w-5" />
            <span>Generating summary...</span>
          </motion.div>
        )}

        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-destructive text-center py-4"
          >
            {error}
          </motion.p>
        )}

        {summary && !loading && !error && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Streamdown>{summary}</Streamdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
