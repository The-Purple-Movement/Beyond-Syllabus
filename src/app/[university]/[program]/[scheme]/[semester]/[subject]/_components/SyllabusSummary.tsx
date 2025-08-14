"use client";

import { useState, useEffect } from "react";
import { Loader2, BookText } from "lucide-react";
import { summarizeSyllabus } from "@/ai/flows/summarize-syllabus";
import { motion, AnimatePresence } from "framer-motion";

interface SyllabusSummaryProps {
  fullSyllabus: string;
}

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
        
        // Check if the response contains configuration error messages
        if (result.summary.includes("API key") || result.summary.includes("unavailable")) {
          setError(result.summary);
          setSummary(null);
        } else {
          setSummary(result.summary);
          setError(null);
        }
      } catch (e: any) {
        console.error("Error summarizing syllabus:", e);
        setError("Failed to generate summary. Please try again later.");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [fullSyllabus]);

  return (
    <div className="space-y-4 bg-white dark:bg-black/50 backdrop-blur-sm p-6 rounded-2xl shadow-md border">
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
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generating summary...</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-destructive py-4"
          >
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="font-medium text-sm">Unable to Generate Summary</p>
              <p className="text-sm mt-1 opacity-90">{error}</p>
            </div>
          </motion.div>
        )}

        {summary && !loading && !error && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {summary}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
