"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileQuestion, MessageSquareText } from "lucide-react";

export interface Pyq {
  examYear: string;
  session: string | null;
  content: string;
}

function label(p: Pyq): string {
  const session = p.session
    ? ` (${p.session[0].toUpperCase()}${p.session.slice(1)})`
    : "";
  return `${p.examYear}${session}`;
}

export function PyqCard({
  subjectName,
  pyqs,
}: {
  subjectName: string;
  pyqs: Pyq[];
}) {
  const router = useRouter();

  const discuss = (p: Pyq) => {
    router.push(
      `/chat?title=${encodeURIComponent(
        `${subjectName} — PYQ ${label(p)}`
      )}&content=${encodeURIComponent(
        `Previous year question paper (${label(p)}) for ${subjectName}:\n\n${p.content}`
      )}`
    );
  };

  return (
    <div className="flex w-full flex-col gap-3 dark:bg-black/50 bg-white rounded-xl shadow-lg p-5">
      <div className="flex items-center gap-2">
        <FileQuestion className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Previous Year Questions</h3>
      </div>

      {pyqs.length ? (
        <ul className="space-y-2">
          {pyqs.map((p) => (
            <li key={label(p)}>
              <details className="rounded-lg border border-border/50 px-3 py-2">
                <summary className="text-sm font-medium cursor-pointer flex items-center justify-between gap-2">
                  <span>{label(p)}</span>
                </summary>
                <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs text-muted-foreground font-sans">
                  {p.content}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full border-primary/40 text-primary hover:bg-primary/10"
                  onClick={() => discuss(p)}
                >
                  <MessageSquareText className="h-3.5 w-3.5 mr-1" />
                  Work through it with AI
                </Button>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            No papers for this subject yet. If you have a past paper your
            university circulated, contributing it takes one markdown file,
            and it lights up here for every student of this course.
          </p>
          <Button asChild size="sm" variant="outline">
            <a
              href="https://github.com/The-Purple-Movement/WikiSyllabus/blob/main/CONTRIBUTION.md"
              target="_blank"
              rel="noreferrer"
            >
              Contribute a paper
            </a>
          </Button>
        </>
      )}
    </div>
  );
}
