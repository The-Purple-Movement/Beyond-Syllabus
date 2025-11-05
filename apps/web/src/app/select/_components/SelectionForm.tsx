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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/dataContext";
import { Footer } from "@/components/common/Footer";

import ErrorDisplay from "@/components/common/ErrorDisplay";

function capitalizeWords(str: string | undefined): string {
  if (!str) return "";
  return str.replace(/-/g, " ").toUpperCase();
}

function formatSemesterName(semesterId: string): string {
  if (!semesterId) return "";
  return `Semester ${semesterId.replace("s", "").replace(/^0+/, "")}`;
}

// Function to extract numeric value from semester ID for sorting
function getSemesterNumber(semesterId: string): number {
  // Remove all non-numeric characters and convert to number
  const numericPart = semesterId.replace(/[^0-9]/g, "");
  const num = Number.parseInt(numericPart, 10);
  return Number.isNaN(num) ? 999 : num; // Put invalid entries at the end
}

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const MotionDiv = motion.div;

export function SelectionForm() {
  const router = useRouter();
  const { data: directoryStructure, isFetching, isError, error } = useData();
  const [selectedUniversityId, setSelectedUniversityId] = useState<
    string | null
  >(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null
  );
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(
    null
  );
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const stepsConfig = [
    { step: 1, label: "University" },
    { step: 2, label: "Program" },
    { step: 3, label: "Scheme" },
    { step: 4, label: "Semester" },
  ];

  const handleUniversitySelect = async (universityId: string) => {
    setIsLoading(true);
    setLoadingMessage("Loading programs...");
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSelectedUniversityId(universityId);
    setIsLoading(false);
    setStep(2);
  };

  const handleProgramSelect = async (programId: string) => {
    setIsLoading(true);
    setLoadingMessage("Loading schemes...");
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSelectedProgramId(programId);
    setIsLoading(false);
    setStep(3);
  };

  const handleSchemeSelect = async (schemeId: string) => {
    setIsLoading(true);
    setLoadingMessage("Loading semesters...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSelectedSchemeId(schemeId);
    setIsLoading(false);
    setStep(4);
  };

  const handleSemesterSelect = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
  };

  const resetToLevel = (level: number) => {
    if (level <= 1) {
      setSelectedUniversityId(null);
      setSelectedProgramId(null);
      setSelectedSchemeId(null);
      setSelectedSemesterId(null);
    } else if (level === 2) {
      setSelectedProgramId(null);
      setSelectedSchemeId(null);
      setSelectedSemesterId(null);
    } else if (level === 3) {
      setSelectedSchemeId(null);
      setSelectedSemesterId(null);
    } else if (level === 4) {
      setSelectedSemesterId(null);
    }
    setStep(level);
  };

  if (isFetching) return;
  if (isError)
    return (
      <ErrorDisplay
        errorMessage={error?.message || "An error occurred while fetching data"}
      />
    );

  if (!directoryStructure || Object.keys(directoryStructure).length === 0) {
    return (
      <>
        <main className="container mx-auto px-4 py-12 md:py-20 flex justify-center items-center flex-1">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">No Syllabus Data Found</h1>
            <p className="text-muted-foreground">
              Please ensure your 'universities' folder and its subdirectories
              contain valid syllabus data.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const selectedUniversityData = selectedUniversityId
    ? directoryStructure[selectedUniversityId]
    : null;
  const selectedProgramData =
    selectedUniversityData && selectedProgramId
      ? selectedUniversityData[selectedProgramId]
      : null;
  const selectedSchemeData =
    selectedProgramData && selectedSchemeId
      ? selectedProgramData[selectedSchemeId]
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      selectedUniversityId &&
      selectedProgramId &&
      selectedSchemeId &&
      selectedSemesterId
    ) {
      setIsLoading(true);
      setLoadingMessage("Loading syllabus modules...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push(
        `/${selectedUniversityId}/${selectedProgramId}/${selectedSchemeId}/${selectedSemesterId}`
      );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 backdrop-blur-sm mt-[5vh]">
      <div className="flex items-center justify-center flex-wrap gap-2 p-3 border-b border-muted">
        {stepsConfig.map(({ step: stepNumber, label }, index) => {
          const isActive = step === stepNumber;
          const isCompleted = step > stepNumber;
          return (
            <div key={label} className="flex items-center">
              <button
                type="button"
                disabled={!isCompleted && !isActive}
                onClick={() => resetToLevel(stepNumber)}
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium transition-all",
                  isActive
                    ? "bg-primary text-white"
                    : isCompleted
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {label}
              </button>
              {index < stepsConfig.length - 1 && (
                <span className="mx-1 text-muted-foreground text-xs">›</span>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl md:text-2xl text-center font-bold">
            Find Your Syllabus
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Follow the steps to find the curriculum for your course.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 flex items-center justify-center min-h-[350px] px-4">
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
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                    <Loader2 className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-primary">
                      {loadingMessage}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Please wait while we prepare your content...
                    </p>
                  </motion.div>
                </div>
              </MotionDiv>
            ) : (
              <>
                {step === 1 && (
                  <MotionDiv
                    key="step1"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full flex items-start justify-center"
                  >
                    <div className="space-y-4 flex flex-col items-center justify-center rounded-2xl p-4">
                      <Label className="text-lg font-bold text-center text-purple-900 dark:text-purple-200">
                        1. Select Your University
                      </Label>

                      <Select onValueChange={handleUniversitySelect}>
                        <SelectTrigger className="w-[280px] py-3 px-3 text-base font-medium rounded-xl border border-purple-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all">
                          <SelectValue placeholder="Choose a university" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          side="bottom"
                          align="center"
                          sideOffset={4}
                          alignOffset={0}
                          avoidCollisions={false}
                          className="w-[280px] rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-[200px] overflow-y-auto"
                        >
                          {Object.keys(directoryStructure)
                            .sort((a, b) =>
                              capitalizeWords(a).localeCompare(
                                capitalizeWords(b)
                              )
                            )
                            .map((universityId) => (
                              <SelectItem
                                key={universityId}
                                value={universityId}
                                className="capitalize px-3 py-2 text-sm hover:bg-purple-100 dark:hover:bg-purple-800 rounded-lg cursor-pointer transition-colors"
                              >
                                {capitalizeWords(universityId)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </MotionDiv>
                )}

                {step === 2 && selectedUniversityData && (
                  <MotionDiv
                    key="step2"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full"
                  >
                    <div className="space-y-4 flex flex-col items-center justify-center rounded-2xl p-4">
                      <Label className="text-lg font-bold text-center text-purple-900 dark:text-purple-200">
                        2. Choose Your Program
                      </Label>

                      <Select
                        onValueChange={handleProgramSelect}
                        value={selectedProgramId ?? ""}
                      >
                        <SelectTrigger className="w-[280px] py-3 px-3 text-base font-medium rounded-xl border border-purple-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all">
                          <SelectValue placeholder="Select Program" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          side="bottom"
                          align="center"
                          sideOffset={4}
                          alignOffset={0}
                          avoidCollisions={false}
                          className="w-[280px] rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-[200px] overflow-y-auto"
                        >
                          {Object.keys(selectedUniversityData)
                            .sort((a, b) =>
                              capitalizeWords(a).localeCompare(
                                capitalizeWords(b)
                              )
                            )
                            .map((programId) => (
                              <SelectItem
                                key={programId}
                                value={programId}
                                className="capitalize px-3 py-2 text-sm hover:bg-purple-100 dark:hover:bg-purple-800 rounded-lg cursor-pointer transition-colors"
                              >
                                {capitalizeWords(programId)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </MotionDiv>
                )}

                {step === 3 && selectedProgramData && (
                  <MotionDiv
                    key="step3"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 justify-center">
                        <Label
                          htmlFor="scheme"
                          className="text-base font-semibold"
                        >
                          3. Select Your Scheme
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center"
                                aria-label="Scheme information"
                              >
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Your syllabus depends on the academic scheme you
                                follow.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.keys(selectedProgramData)
                          .sort((a, b) => a.localeCompare(b))
                          .map((schemeId) => (
                            <motion.div
                              key={schemeId}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <button
                                type="button"
                                className={cn(
                                  "w-full cursor-pointer border-transparent bg-transparent border-2 border-purple-700 hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/30 hover:bg-gradient-to-br hover:from-purple-900 hover:to-purple-700 dark:hover:from-purple-800 dark:hover:to-purple-600 transition-all rounded-lg p-4 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                                  selectedSchemeId === schemeId &&
                                    "border-primary bg-primary/10"
                                )}
                                onClick={() => handleSchemeSelect(schemeId)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleSchemeSelect(schemeId);
                                  }
                                }}
                                aria-pressed={selectedSchemeId === schemeId}
                                aria-label={`Select ${schemeId.replace(
                                  /-/g,
                                  " "
                                )} scheme`}
                              >
                                <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                                <p className="font-semibold capitalize text-sm">
                                  {schemeId.replace(/-/g, " ")}
                                </p>
                              </button>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  </MotionDiv>
                )}

                {step === 4 && selectedSchemeData && (
                  <MotionDiv
                    key="step4"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full"
                  >
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-center block">
                        4. Pick Your Semester
                      </Label>
                      <RadioGroup
                        value={selectedSemesterId ?? ""}
                        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                      >
                        {Object.keys(selectedSchemeData)
                          .sort(
                            (a, b) =>
                              getSemesterNumber(a) - getSemesterNumber(b)
                          )
                          .map((semesterId) => {
                            const handleSemesterClick = () => {
                              handleSemesterSelect(semesterId);
                              handleSubmit(
                                new Event(
                                  "submit"
                                ) as unknown as React.FormEvent
                              );
                            };

                            const handleKeyDown = (e: React.KeyboardEvent) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleSemesterClick();
                              }
                            };

                            return (
                              <button
                                key={semesterId}
                                type="button"
                                className={cn(
                                  "flex flex-col items-center justify-center hover:border-primary cursor-pointer border-2 border-purple-700 hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/30 hover:bg-gradient-to-br hover:from-purple-900 hover:to-purple-700 dark:hover:from-purple-800 dark:hover:to-purple-600 transition-all rounded-lg p-4 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                                  selectedSemesterId === semesterId &&
                                    "border-primary bg-primary/10"
                                )}
                                onClick={handleSemesterClick}
                                onKeyDown={handleKeyDown}
                                aria-pressed={selectedSemesterId === semesterId}
                                aria-label={`Select ${formatSemesterName(
                                  semesterId
                                )}`}
                              >
                                <RadioGroupItem
                                  value={semesterId}
                                  id={semesterId}
                                  className="sr-only"
                                />
                                <BookOpen className="h-5 w-5 mb-1 text-primary" />
                                <p className="font-semibold text-xs">
                                  {formatSemesterName(semesterId)}
                                </p>
                              </button>
                            );
                          })}
                      </RadioGroup>
                    </div>
                  </MotionDiv>
                )}
              </>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between items-center bg-muted/50 p-3 rounded-b-2xl">
          <Button
            variant="ghost"
            type="button"
            size="sm"
            onClick={() => {
              if (step === 1) {
                router.push("/");
              } else {
                resetToLevel(step - 1);
              }
            }}
          >
            Back
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
