"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/dataContext";
import ErrorDisplay from "@/components/ErrorDisplay";
import { Spinner } from "@/components/ui/spinner";

const cap = (s?: string) => (s ? s.replace(/-/g, " ").toUpperCase() : "");
const semName = (id: string) => `Semester ${id.replace("s", "").replace(/^0+/, "")}`;
const semNum = (id: string) => Number(id.replace(/\D/g, "")) || 999;

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const MotionDiv = motion.div;

export function SelectionForm() {
  const router = useRouter();
  const { data: directory, isFetching, isError, error } = useData();

  const [step, setStep] = useState(1);
  const [u, setU] = useState<string | null>(null);
  const [p, setP] = useState<string | null>(null);
  const [sch, setSch] = useState<string | null>(null);
  const [sem, setSem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const steps = ["University", "Program", "Scheme", "Semester"];

  const uniData = u ? directory[u] : null;
  const progData = u && p ? directory[u][p] : null;
  const schemeData = u && p && sch ? directory[u][p][sch] : null;

  const loadStep = async (message: string, nextStep: number, fn: () => void) => {
    setIsLoading(true);
    setLoadingMessage(message);
    await new Promise((r) => setTimeout(r, 600));
    fn();
    setIsLoading(false);
    setStep(nextStep);
  };

  const reset = (level: number) => {
    if (level <= 1) setU(null);
    if (level <= 2) setP(null);
    if (level <= 3) setSch(null);
    if (level <= 4) setSem(null);
    setStep(level);
  };

  const submit = async () => {
    if (!u || !p || !sch || !sem) return;
    setIsLoading(true);
    setLoadingMessage("Loading syllabus modules...");
    await new Promise((r) => setTimeout(r, 800));
    router.push(`/${u}/${p}/${sch}/${sem}`);
  };

  if (isFetching) return null;
  if (isError) return <ErrorDisplay errorMessage={error?.message || "Error fetching data"} />;
  if (!directory || !Object.keys(directory).length)
    return <ErrorDisplay errorMessage="No directory data available." />;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 mt-[5vh]">
      <div className="flex items-center justify-center p-3 border-b border-muted">
        {steps.map((label, i) => {
          const num = i + 1;
          const active = step === num;
          const done = step > num;
          return (
            <div key={label} className="flex items-center">
              <Button
                disabled={!active && !done}
                variant={"ghost"}
                onClick={() => reset(num)}
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium transition-all",
                  active
                    ? "bg-primary text-white"
                    : done
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {label}
              </Button>
              {num < steps.length && <span className="mx-1 text-muted-foreground text-xs">›</span>}
            </div>
          );
        })}
      </div>

      <CardHeader>
        <CardTitle className="text-center text-xl font-bold">Find Your Syllabus</CardTitle>
        <CardDescription className="text-center">
          Follow the steps to find the curriculum for your course.
        </CardDescription>
      </CardHeader>

        <CardContent className="space-y-4 flex items-center justify-center min-h-[300px] px-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <MotionDiv
              key="loading"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full text-center space-y-4"
            >
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary" />
                  <Spinner className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <h3 className="text-lg font-semibold text-primary">{loadingMessage}</h3>
                  <p className="text-muted-foreground text-sm">
                    Please wait while we prepare your content...
                  </p>
                </motion.div>
              </div>
            </MotionDiv>
          ) : (
            <>
              {step === 1 && (
                <MotionDiv key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="flex justify-center">
                  <div className="space-y-4 flex flex-col items-center">
                    <Label className="text-lg font-bold">1. Select Your University</Label>
                    <Select onValueChange={(v) => loadStep("Loading programs...", 2, () => setU(v))}>
                      <SelectTrigger className="w-[280px] py-3 px-3 rounded-xl border border-purple-300 bg-white dark:bg-gray-900 shadow-sm">
                        <SelectValue placeholder="Choose a university" />
                      </SelectTrigger>
                      <SelectContent className="w-[280px] rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg max-h-[200px] overflow-y-auto">
                        {Object.keys(directory)
                          .sort((a, b) => cap(a).localeCompare(cap(b)))
                          .map((id) => (
                            <SelectItem key={id} value={id} className="capitalize px-3 py-2 text-sm hover:bg-purple-100 dark:hover:bg-purple-800 rounded-lg cursor-pointer">
                              {cap(id)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </MotionDiv>
              )}

              {step === 2 && uniData && (
                <MotionDiv key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="flex justify-center">
                  <div className="space-y-4 flex flex-col items-center">
                    <Label className="text-lg font-bold">2. Choose Your Program</Label>
                    <Select value={p ?? ""} onValueChange={(v) => loadStep("Loading schemes...", 3, () => setP(v))}>
                      <SelectTrigger className="w-[280px] py-3 px-3 rounded-xl border border-purple-300 bg-white dark:bg-gray-900 shadow-sm">
                        <SelectValue placeholder="Select Program" />
                      </SelectTrigger>
                      <SelectContent className="w-[280px] rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg max-h-[200px] overflow-y-auto">
                        {Object.keys(uniData)
                          .sort((a, b) => cap(a).localeCompare(cap(b)))
                          .map((id) => (
                            <SelectItem key={id} value={id} className="capitalize px-3 py-2 text-sm hover:bg-purple-100 dark:hover:bg-purple-500 rounded-lg cursor-pointer">
                              {cap(id)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </MotionDiv>
              )}

              {step === 3 && progData && (
                <MotionDiv key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3 w-full">
                  <div className="flex items-center gap-2 justify-center">
                    <Label className="text-base font-semibold">3. Select Scheme</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Your syllabus depends on your scheme.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(progData)
                      .sort()
                      .map((id) => (
                        <button
                          key={id}
                          type="button"
                          className={cn(
                            "p-4 rounded-lg border-2 transition hover:shadow-lg hover:bg-purple-500 cursor-pointer",
                            sch === id ? "border-primary bg-primary/10" : "border-purple-700"
                          )}
                          onClick={() => loadStep("Loading semesters...", 4, () => setSch(id))}
                        >
                          <BookOpen className="h-7 w-7 mx-auto mb-2" />
                          <p className="font-semibold capitalize text-sm">{id.replace(/-/g, " ")}</p>
                        </button>
                      ))}
                  </div>
                </MotionDiv>
              )}

              {step === 4 && schemeData && (
                <MotionDiv key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3 w-full">
                  <Label className="text-center block font-semibold">4. Pick Semester</Label>
                    <RadioGroup value={sem ?? ""} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.keys(schemeData)
                        .sort((a, b) => semNum(a) - semNum(b))
                        .map((id) => (
                          <div
                            key={id}
                            className={cn(
                              "rounded-lg p-4 border-2 hover:shadow-lg hover:bg-purple-500 transition cursor-pointer",
                              sem === id ? "border-primary bg-primary/10" : "border-purple-700"
                            )}
                            onClick={() => {
                              setSem(id);
                              submit();
                            }}
                          >
                            <RadioGroupItem value={id} className="sr-only" />
                            <BookOpen className="h-5 w-5 mb-1 mx-auto" />
                            <p className="text-xs font-semibold text-center">{semName(id)}</p>
                          </div>
                        ))}
                    </RadioGroup>

                </MotionDiv>
              )}
            </>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="p-3 flex justify-between">
        <Button
          variant="default"
          size="sm"
          onClick={() => (step === 1 ? router.push("/") : reset(step - 1))}
        >
          Back
        </Button>
      </CardFooter>
    </Card>
  );
}
