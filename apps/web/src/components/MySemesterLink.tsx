"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Map } from "lucide-react";
import { getLastSelection, LastSelection } from "@/lib/journey";
import { titleCase } from "@/lib/utils";

/**
 * Header shortcut to the student's own semester. Renders nothing until a
 * course has been chosen once (local-first: the selection lives on the
 * device, no account involved).
 */
export function MySemesterLink() {
  const [sel, setSel] = useState<LastSelection | null>(null);

  useEffect(() => {
    setSel(getLastSelection());
  }, []);

  if (!sel) return null;

  return (
    <Link
      href={`/${sel.university}/${sel.program}/${sel.scheme}/${sel.semester}`}
      className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      title={`${titleCase(sel.program)} · Semester ${sel.semester.replace(/\D/g, "")}`}
    >
      <Map className="h-4 w-4" />
      My semester
    </Link>
  );
}
