"use client";

import { notFound } from "next/navigation";
import { titleCase } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import {
  saveLastSelection,
  loadJourney,
  getStreak,
  daysUntil,
  Journey,
} from "@/lib/journey";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookText,
  CalendarClock,
  Code,
  Flame,
  FlaskConical,
  ListChecks,
  Sigma,
} from "lucide-react";
import ErrorDisplay from "@/components/ErrorDisplay";
import { AnimatedDiv } from "@/components/AnimatedDiv";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useUniversityData } from "@/contexts";
import { Spinner } from "@/components/ui/spinner";
import { DirectoryStructure, SubjectsPageProps } from "@/lib/types";


function findSemesterData(
  directoryStructure: DirectoryStructure,
  resolvedParams: {
    university: string;
    program: string;
    scheme: string;
    semester: string;
  }
): { university: any; program: any; scheme: any; semester: any } | null {
  const {
    university: universityId,
    program: programId,
    scheme: schemeId,
    semester: semesterId,
  } = resolvedParams;

  const university = { id: universityId, name: capitalizeWords(universityId) };
  const universityData = directoryStructure[universityId];
  if (!universityData) return null;

  const program = { id: programId, name: capitalizeWords(programId) };
  const programData = universityData[programId];
  if (!programData) return null;

  const scheme = { id: schemeId, name: capitalizeWords(schemeId) };
  const schemeData = programData[schemeId];
  if (!schemeData) return null;

  const semester = {
    id: semesterId,
    name: formatSemesterName(semesterId),
    subjects: Array.isArray(schemeData[semesterId]?.subjects)
      ? schemeData[semesterId].subjects
      : [],
  };
  if (!schemeData[semesterId]) return null;

  return { university, program, scheme, semester };
}

function capitalizeWords(str: string | undefined): string {
  return titleCase(str);
}

function formatSemesterName(semesterId: string): string {
  if (!semesterId) return "";
  return `Semester ${semesterId.replace("s", "").replace(/^0+/, "")}`;
}

const getSubjectCategory = (subjectCode: string) => {
  const code = subjectCode.toUpperCase();
  if (code.startsWith("CS") || code.startsWith("IT"))
    return { name: "Code", icon: <Code className="h-4 w-4" /> };
  if (code.startsWith("MA"))
    return { name: "Math", icon: <Sigma className="h-4 w-4" /> };
  if (code.startsWith("PH") || code.startsWith("CY"))
    return { name: "Science", icon: <FlaskConical className="h-4 w-4" /> };
  return { name: "Core", icon: <BookText className="h-4 w-4" /> };
};

export default function SubjectsPage({ params }: SubjectsPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [loadingSubject, setLoadingSubject] = useState<string | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [streak, setStreak] = useState(0);
  const { data, isFetching, isError, error } = useUniversityData(
    resolvedParams.university
  );

  // This page IS the returning student's home. Landing here (wizard or
  // deep link alike) makes it the remembered semester, and the journey
  // data enriches the subject cards.
  useEffect(() => {
    if (!data) return;
    const ok =
      data[resolvedParams.university]?.[resolvedParams.program]?.[
        resolvedParams.scheme
      ]?.[resolvedParams.semester];
    if (!ok) return;
    saveLastSelection({
      university: resolvedParams.university,
      program: resolvedParams.program,
      scheme: resolvedParams.scheme,
      semester: resolvedParams.semester,
    });
    setJourney(loadJourney());
    setStreak(getStreak());
    document.title = `${formatSemesterName(resolvedParams.semester)} · ${titleCase(
      resolvedParams.program
    )} | Beyond Syllabus`;
  }, [data, resolvedParams]);

  const handleViewSyllabus = (subjectId: string, subjectName: string) => {
    setLoadingSubject(subjectId);
    router.push(
      `/${resolvedParams.university}/${resolvedParams.program}/${resolvedParams.scheme}/${resolvedParams.semester}/${subjectId}`
    );
  };

  // Cross-reference a subject's modules with the local journey
  const subjectProgress = (subject: any) => {
    if (!journey) return null;
    const titles: string[] = (subject.modules || [])
      .map((m: any) => m.title)
      .filter(Boolean);
    if (!titles.length) return null;
    let touched = 0;
    let solid = 0;
    let shaky = 0;
    for (const t of titles) {
      const prog = journey.modules[t];
      if (prog) {
        touched += 1;
        if (prog.status === "solid") solid += 1;
        if (prog.status === "shaky") shaky += 1;
      }
    }
    const exam = journey.exams.find(
      (e) => e.subject === titleCase(subject.name)
    );
    const examDays = exam ? daysUntil(exam.date) : null;
    return { total: titles.length, touched, solid, shaky, examDays };
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-mint-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Spinner className="h-8 w-8 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading syllabus data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorDisplay
        errorMessage={error?.message || "Could not fetch directory structure."}
      />
    );
  }

  const dataPath = findSemesterData(data, resolvedParams);
  if (!dataPath) {
    notFound();
  }

  function capitalizeWords(str: string | undefined): string {
    return titleCase(str);
  }

  const { university, program, scheme, semester } = dataPath;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Select", href: "/select" },
    {
      label: university.name,
      href: `/select?step=2&university=${resolvedParams.university}`,
    },
    {
      label: program.name,
      href: `/select?step=3&university=${resolvedParams.university}&program=${resolvedParams.program}`,
    },
    {
      label: scheme.name,
      href: `/select?step=4&university=${resolvedParams.university}&program=${resolvedParams.program}&scheme=${resolvedParams.scheme}`,
    },
    { label: semester.name },
  ];

  return (
    <div className="flex flex-col min-h-screen mt-[10vh]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <AnimatedDiv>
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mt-8 mb-12 text-center md:text-left">
              <h1 className="text-3xl font-bold md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {semester.name} Subjects
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {program.name} ({scheme.name}) &middot; {university.name}
              </p>
              {journey && Object.keys(journey.modules).length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Flame className="h-4 w-4" /> {streak} day streak
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary">
                    <ListChecks className="h-4 w-4" />{" "}
                    {Object.keys(journey.modules).length} modules touched
                  </span>
                  <Link
                    href="/journey"
                    className="text-muted-foreground underline hover:text-primary"
                  >
                    Full journey
                  </Link>
                </div>
              )}
            </div>

            {semester.subjects.length > 0 ? (
              <div className="grid justify-center grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch max-w-[288px] mx-auto md:max-w-none md:mx-0">
                {semester.subjects.map((subject: any) => {
                  const category = getSubjectCategory(subject.code);
                  const isLoading = loadingSubject === subject.id;
                  const progress = subjectProgress(subject);
                  return (
                    <Card
                      key={subject.id}
                      className="h-full w-72 overflow-hidden flex flex-col justify-between rounded-2xl hover:border-primary hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-white/10 backdrop-blur-sm"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl pr-4 break-words w-44">
                            {capitalizeWords(subject.name)}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1.5"
                          >
                            {category.icon}
                            {category.name}
                          </Badge>
                        </div>
                        <CardDescription>{subject.code}</CardDescription>
                        {progress && (
                          <div className="pt-1 space-y-1.5">
                            {progress.examDays !== null && progress.examDays >= 0 && (
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                  progress.examDays <= 3
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                <CalendarClock className="h-3 w-3" /> exam{" "}
                                {progress.examDays === 0
                                  ? "today"
                                  : `in ${progress.examDays}d`}
                              </span>
                            )}
                            {progress.touched > 0 ? (
                              <p className="text-[11px] text-muted-foreground">
                                {progress.touched}/{progress.total} modules
                                touched
                                {progress.solid > 0 && ` · ${progress.solid} solid`}
                                {progress.shaky > 0 && ` · ${progress.shaky} shaky`}
                              </p>
                            ) : (
                              <p className="text-[11px] text-muted-foreground/70">
                                Untouched. Brainstorm a module to start.
                              </p>
                            )}
                          </div>
                        )}
                      </CardHeader>
                      <CardFooter>
                        <Button
                          onClick={() =>
                            handleViewSyllabus(subject.id, subject.name)
                          }
                          disabled={isLoading}
                          variant="link"
                          className={`flex items-center text-sm font-medium text-primary group p-0 h-auto w-full justify-start transition-all duration-200 ${isLoading
                            ? "opacity-70 cursor-not-allowed"
                            : "hover:bg-transparent"
                            }`}
                        >
                          {isLoading ? (
                            <>
                              <Spinner className="mr-2 h-4 w-4" />
                              Loading...
                            </>
                          ) : (
                            <>
                              View Syllabus
                              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  No subjects found for this semester.
                </p>
              </div>
            )}
          </div>
        </AnimatedDiv>
      </main>
      <Footer />
    </div>
  );
}
