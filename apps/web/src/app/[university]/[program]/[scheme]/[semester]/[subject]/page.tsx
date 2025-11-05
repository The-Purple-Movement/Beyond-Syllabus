"use client";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SyllabusSummary } from "./_components/SyllabusSummary";
import { CourseModules } from "./_components/CourseModules";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { AnimatedDiv } from "@/components/common/AnimatedDiv";

import { MindMap } from "@/app/mindMap/mindMap";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { useData } from "@/contexts";
import { use } from "react";

interface SubjectPageProps {
  params: Promise<{
    university: string;
    program: string;
    scheme: string;
    semester: string;
    subject: string;
  }>;
}

interface DirectoryStructure {
  [key: string]: any;
}

function findDataPath(
  directoryStructure: DirectoryStructure,
  resolvedParams: {
    university: string;
    program: string;
    scheme: string;
    semester: string;
    subject: string;
  }
): {
  university: any;
  program: any;
  scheme: any;
  semester: any;
  subject: any;
} | null {
  const {
    university: universityId,
    program: programId,
    scheme: schemeId,
    semester: semesterId,
    subject: subjectId,
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

  const subject = semester.subjects.find((sub: any) => sub.id === subjectId);
  if (!subject) return null;

  return { university, program, scheme, semester, subject };
}

function formatSemesterName(semesterId: string): string {
  if (!semesterId) return "";
  return `Semester ${semesterId.replace("s", "").replace(/^0+/, "")}`;
}
function capitalizeWords(str: string | undefined): string {
  if (!str) return "";
  return str
    .replace(/-/g, " ") // replace all "-" with spaces
    .split(" ")
    .map((word) =>
      word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ""
    )
    .join(" ");
}

export default function SubjectPage({ params }: SubjectPageProps) {
  const resolvedParams = use(params);
  const { error, isError, data: directoryStructure } = useData();

  if (isError || !directoryStructure) {
    return (
      <ErrorDisplay
        errorMessage={error || "Could not fetch directory structure."}
      />
    );
  }

  const dataPath = findDataPath(directoryStructure, resolvedParams);

  if (!dataPath) {
    notFound();
  }

  const { university, program, scheme, semester, subject } = dataPath;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: university.name, href: `/select?university=${university.id}` },
    {
      label: program.name,
      href: `/select?university=${university.id}&program=${program.id}`,
    },
    {
      label: scheme.name,
      href: `/select?university=${university.id}&program=${program.id}&scheme=${scheme.id}`,
    },
    {
      label: semester.name,
      href: `/${university.id}/${program.id}/${scheme.id}/${semester.id}`,
    },
    { label: subject.name },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 mt-[10vh]">
        <AnimatedDiv>
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs items={breadcrumbItems} />

            <div className="mt-8 mb-12">
              <h1 className="text-3xl font-bold md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {capitalizeWords(subject.name)}
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {subject.code}
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-[1fr_350px] ">
              <div className="space-y-8 ">
                <h2 className="text-2xl font-bold">Course Modules</h2>
                <CourseModules
                  subjectId={subject.id}
                  modules={subject.modules || []}
                />
              </div>
              <div className=" flex gap-5 w-full flex-col">
                <div className="flex w-full justify-center gap-5 text-[25px]  dark:bg-black/50 items-center text-center rounded-xl h-[150px] shadow-lg">
                  New feature <br /> Coming Soon
                </div>
                <div className="flex w-full justify-center gap-5 text-[25px]  dark:bg-black/50 items-center text-center rounded-xl h-[150px] shadow-lg">
                  New feature <br /> Coming Soon
                </div>
              </div>
            </div>
            <div className="flex w-full gap-5">
              <div className="space-y-8 flex-col flex mt-[20px]">
                <h2 className="text-2xl  font-bold ">AI-Powered Tools</h2>

                <SyllabusSummary fullSyllabus={subject.fullSyllabus || ""} />
              </div>
            </div>
          </div>
        </AnimatedDiv>
      </main>
    </div>
  );
}
