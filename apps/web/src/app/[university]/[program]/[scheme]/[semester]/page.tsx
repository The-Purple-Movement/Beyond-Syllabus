"use client";

import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, use } from "react";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
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
  Code,
  FlaskConical,
  Sigma,
  Loader2,
} from "lucide-react";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { AnimatedDiv } from "@/components/common/AnimatedDiv";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { useData } from "@/contexts";

interface SubjectsPageProps {
  params: Promise<{
    university: string;
    program: string;
    scheme: string;
    semester: string;
  }>;
}

interface DirectoryStructure {
  [key: string]: any;
}

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
  if (!str) return "";
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  const { data, isFetching, isError, error } = useData();

  const handleViewSyllabus = async (subjectId: string, subjectName: string) => {
    setLoadingSubject(subjectId);

    await new Promise((resolve) => setTimeout(resolve, 700));

    router.push(
      `/${resolvedParams.university}/${resolvedParams.program}/${resolvedParams.scheme}/${resolvedParams.semester}/${subjectId}`
    );
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-mint-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
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
    if (!str) return "";
    return str
      .replace(/-/g, " ")
      .split(" ")
      .map((word) =>
        word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ""
      )
      .join(" ");
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
    { label: semester.name }, // Current page - no href
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
            </div>

            {semester.subjects.length > 0 ? (
              <div className="grid justify-center grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch max-w-[288px] mx-auto md:max-w-none md:mx-0">
                {semester.subjects.map((subject: any) => {
                  const category = getSubjectCategory(subject.code);
                  const isLoading = loadingSubject === subject.id;
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
                      </CardHeader>
                      <CardFooter>
                        <Button
                          onClick={() =>
                            handleViewSyllabus(subject.id, subject.name)
                          }
                          disabled={isLoading}
                          variant="ghost"
                          className={`flex items-center text-sm font-medium text-primary group p-0 h-auto w-full justify-start transition-all duration-200 hover:bg-transparent ${
                            isLoading
                              ? "opacity-70 cursor-not-allowed animate-pulse"
                              : "hover:text-primary/80"
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
