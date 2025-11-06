"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Sparkles, BrainCircuit, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

interface Module {
  title: string;
  content: string;
}

interface CourseModulesProps {
  subjectId: string;
  modules: Module[];
}

export function CourseModules({ modules }: CourseModulesProps) {
  const router = useRouter();
  const [loadingModuleIndex, setLoadingModuleIndex] = useState<number | null>(
    null
  );

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
    const content = module.content;
    router.push(
      `/chat?title=${encodeURIComponent(title)}&content=${encodeURIComponent(
        content
      )}`
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
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      )}
    </div>
  );
}
