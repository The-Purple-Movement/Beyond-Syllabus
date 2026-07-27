import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * Every dead end still needs a door (DESIGN.md: never fail silently).
 * The default bare 404 stranded people with no navigation at all.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 mt-20">
        <div className="text-center space-y-4 max-w-md">
          <BookOpen className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">This page does not exist</h1>
          <p className="text-muted-foreground">
            The link may be old, or the syllabus it pointed to may have moved.
            Your Journey and Question Sheets are safe on your device.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild>
              <Link href="/select">Find your syllabus</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
