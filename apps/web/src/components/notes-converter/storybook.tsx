"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface StorybookProps {
  pages: string[];
  onClose?: () => void;
}

export function Storybook({ pages, onClose }: StorybookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [narratorVisible, setNarratorVisible] = useState(false);

  const sentences = useMemo(() => {
    const pageText = pages[currentPage] || "";
    // Split into sentences reasonably; keep punctuation
    const parts = pageText
      .replace(/\n+/g, " ")
      .match(/[^.!?\n]+[.!?]?\s*/g) || [pageText];
    return parts.map((s) => s.trim()).filter(Boolean);
  }, [pages, currentPage]);

  // Cute animal narrator character
  const AnimalNarrator = () => (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-500 ${narratorVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
      <div className="bg-white rounded-full p-4 shadow-lg border-2 border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">🐱</span>
            </div>
            {isSpeaking && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="max-w-xs">
            <div className="text-sm font-medium text-gray-800">Professor Whiskers</div>
            <div className="text-xs text-gray-600">
              {isSpeaking ? "Speaking..." : "Ready to explain!"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const navigate = useCallback(
    (newDirection: number) => {
      const newPage = currentPage + newDirection;
      if (newPage >= 0 && newPage < pages.length) {
        setDirection(newDirection);
        setCurrentPage(newPage);
      }
    },
    [currentPage, pages.length]
  );

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  // Keyboard navigation and controls (no UI changes)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate(1);
      } else if (e.key.toLowerCase() === "r") {
        // Toggle read-aloud for current page
        e.preventDefault();
        setTtsEnabled((v) => !v);
      } else if (e.key.toLowerCase() === "a") {
        // Toggle auto-advance on page end
        e.preventDefault();
        setAutoAdvance((v) => !v);
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentPage(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentPage(pages.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Touch swipe navigation
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current == null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      const threshold = 40;
      if (deltaX > threshold) navigate(-1);
      else if (deltaX < -threshold) navigate(1);
    },
    [navigate]
  );

  // Per-page TTS playback with optional auto-advance
  useEffect(() => {
    // stop previous
    window.speechSynthesis?.cancel();
    if (!ttsEnabled) return;
    if (sentences.length === 0) return;
    setSentenceIndex(0);
    setNarratorVisible(true);
    setIsSpeaking(true);
    const speakSentence = (idx: number) => {
      if (idx >= sentences.length) {
        if (autoAdvance) navigate(1);
        setIsSpeaking(false);
        setTimeout(() => setNarratorVisible(false), 2000);
        return;
      }
      const s = sentences[idx];
      const u = new SpeechSynthesisUtterance(s);
      utteranceRef.current = u;
      u.onend = () => {
        setSentenceIndex(idx + 1);
        setProgress(((idx + 1) / sentences.length) * 100);
        speakSentence(idx + 1);
      };
      window.speechSynthesis?.speak(u);
    };
    setProgress(0);
    speakSentence(0);
    return () => {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setNarratorVisible(false);
    };
  }, [ttsEnabled, autoAdvance, currentPage, sentences, navigate]);

  const toggleNarrator = () => {
    setTtsEnabled(!ttsEnabled);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
      <AnimalNarrator />
      <div className="h-[60vh] relative overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute w-full h-full flex items-center justify-center p-8"
          >
            <div className="prose max-w-none">
              {sentences.length > 0 ? (
                <p>
                  {sentences.map((s, i) => (
                    <span key={i} className={i === sentenceIndex ? "bg-yellow-200" : ""}>
                      {s + " "}
                    </span>
                  ))}
                </p>
              ) : (
                pages[currentPage].split("\n").map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-4">
        <div className="h-1 w-full bg-muted rounded overflow-hidden">
          <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border-t">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {pages.length}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleNarrator}
            className="flex items-center space-x-2"
          >
            {ttsEnabled ? (
              <>
                <VolumeX className="h-4 w-4" />
                <span>Stop Narrator</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                <span>Start Narrator</span>
              </>
            )}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(1)}
          disabled={currentPage === pages.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export class StorybookGenerator {
  private static readonly WORDS_PER_PAGE = 150;

  public static generatePages(text: string): string[] {
    const paragraphs = text.split(/\n\n+/);
    const pages: string[] = [];
    let currentPage = "";
    let wordCount = 0;

    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/).length;
      if (wordCount + words > this.WORDS_PER_PAGE) {
        if (currentPage) {
          pages.push(currentPage.trim());
          currentPage = paragraph;
          wordCount = words;
        } else {
          pages.push(paragraph);
          currentPage = "";
          wordCount = 0;
        }
      } else {
        currentPage += (currentPage ? "\n\n" : "") + paragraph;
        wordCount += words;
      }
    }

    if (currentPage) {
      pages.push(currentPage.trim());
    }

    return pages;
  }
}