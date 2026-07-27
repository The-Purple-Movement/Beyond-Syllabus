import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SelectionForm } from "./_components/SelectionForm";
import { AnimatedDiv } from "@/components/AnimatedDiv";

export const metadata: Metadata = {
  title: "Find your syllabus",
  description:
    "Pick your university, program, and semester to open your syllabus on Beyond Syllabus.",
};

export default async function SelectPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
        <AnimatedDiv>
          <div className="max-w-3xl mx-auto">
            <SelectionForm />
          </div>
        </AnimatedDiv>
      </main>
    </div>
  );
}
