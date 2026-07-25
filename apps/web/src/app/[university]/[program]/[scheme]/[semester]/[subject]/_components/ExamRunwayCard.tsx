"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  addExam,
  daysUntil,
  Exam,
  ExamModule,
  getExamForSubject,
  removeExam,
} from "@/lib/journey";
import { CalendarClock, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

export function ExamRunwayCard({
  subjectName,
  modules,
}: {
  subjectName: string;
  modules: ExamModule[];
}) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [date, setDate] = useState("");

  useEffect(() => {
    setExam(getExamForSubject(subjectName));
  }, [subjectName]);

  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const save = () => {
    if (!date) return;
    const saved = addExam(subjectName, date, modules);
    setExam(saved);
    toast.success("Exam added to your runway");
  };

  const remove = () => {
    if (!exam) return;
    removeExam(exam.id);
    setExam(null);
    toast("Removed from runway");
  };

  return (
    <div className="flex w-full flex-col gap-3 dark:bg-black/50 bg-white rounded-xl shadow-lg p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Exam Runway</h3>
      </div>

      {exam ? (
        <>
          <p className="text-sm">
            Exam on <span className="font-medium">{exam.date}</span>:{" "}
            <span className="font-bold text-primary">
              {daysUntil(exam.date)} day{daysUntil(exam.date) === 1 ? "" : "s"}
            </span>{" "}
            to go.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" className="flex-1">
              <Link href="/journey">View my plan</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={remove}
              aria-label="Remove exam"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Add your exam date and get a revision plan built from where you
            actually stand, module by module.
          </p>
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button size="sm" disabled={!date} onClick={save}>
            Add to my runway
          </Button>
        </>
      )}
    </div>
  );
}
