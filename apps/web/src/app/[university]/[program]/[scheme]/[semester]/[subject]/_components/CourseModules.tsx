"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Sparkles, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { Module, CourseModulesProps } from "@/lib/types";
import {
  getModuleStatus,
  setModuleStatus,
  ModuleStatus,
} from "@/lib/journey";

const STATUS_OPTIONS: { id: ModuleStatus; label: string; active: string }[] = [
  {
    id: "shaky",
    label: "Shaky",
    active:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40",
  },
  {
    id: "explored",
    label: "Getting there",
    active: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40",
  },
  {
    id: "solid",
    label: "Solid",
    active:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  },
];

export function CourseModules({ modules }: CourseModulesProps) {
  const router = useRouter();
  const [loadingModuleIndex, setLoadingModuleIndex] = useState<number | null>(
    null
  );
  const [statuses, setStatuses] = useState<Record<string, ModuleStatus | null>>(
    {}
  );

  useEffect(() => {
    const initial: Record<string, ModuleStatus | null> = {};
    for (const m of modules) {
      if (m.title) initial[m.title] = getModuleStatus(m.title);
    }
    setStatuses(initial);
  }, [modules]);

  const updateStatus = (title: string, status: ModuleStatus) => {
    setModuleStatus(title, status);
    setStatuses((prev) => ({ ...prev, [title]: status }));
  };

  const handleChatRedirect = async (module: Module, index: number) => {
    if (!module.content.trim()) {
      // Consider using a toast notification for a better UX
      alert("No content available for this module.");
      return;
    }

    setLoadingModuleIndex(index);

    // Add aesthetic delay for smooth UX
    await new Promise((resolve) => setTimeout(resolve, 600));

    const title = module.title || "Selected Module";
    const syllabusUrl = window.location.pathname;
    const content = module.content;

    router.push(
      `/chat?title=${encodeURIComponent(title)}&content=${encodeURIComponent(
        content
      )}&syllabus=${encodeURIComponent(syllabusUrl)}`
    );
  };

  return (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <div className="text-center py-10 px-6 bg-muted rounded-2xl">
          <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            No modules found for this syllabus.
          </p>
          <p className="text-sm text-muted-foreground/80">
            The content might be under preparation.
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-3">
          {modules.map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <AccordionItem
                value={`item-${index}`}
                className="border-b-0 rounded-2xl bg-white dark:bg-black/50 backdrop-blur-sm shadow-md overflow-hidden"
              >
                <AccordionTrigger className="flex justify-between items-center w-full text-left p-6 font-semibold text-lg hover:no-underline">
                  <span className="flex-1 mr-4">{module.title}</span>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-6 px-6">
                  <div className="mb-6 border-l-2 border-primary pl-4">
                    <h4 className="text-lg font-semibold mb-2">
                      Module Content
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {module.content.trim() ||
                        "No detailed content available."}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleChatRedirect(module, index)}
                    disabled={loadingModuleIndex === index}
                    className="flex items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{
                      background:
                        loadingModuleIndex === index
                          ? "linear-gradient(90deg, rgba(120,119,198,0.3) 0%, rgba(255,255,255,0.3) 50%, rgba(120,119,198,0.3) 100%)"
                          : undefined,
                      backgroundSize:
                        loadingModuleIndex === index
                          ? "1000px 100%"
                          : undefined,
                      animation:
                        loadingModuleIndex === index
                          ? "shimmer 2s infinite linear"
                          : undefined,
                    }}
                  >
                    {loadingModuleIndex === index ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-amber-300 transition-transform group-hover:scale-125" />
                    )}
                    Chat with AI about this Module
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/brainstorm?title=${encodeURIComponent(
                          module.title || "Selected Module"
                        )}&content=${encodeURIComponent(module.content)}`
                      )
                    }
                    className="flex items-center gap-2 mt-2 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <BrainCircuit className="h-4 w-4" />
                    Brainstorm before class
                  </Button>
                  {module.title && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Where do you stand on this module?
                      </span>
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateStatus(module.title!, opt.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                            statuses[module.title!] === opt.id
                              ? opt.active
                              : "border-border/60 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      )}
    </div>
  );
}
