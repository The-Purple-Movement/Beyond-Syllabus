import { SelectionForm } from "./_components/SelectionForm";
import { AnimatedDiv } from "@/components/common/AnimatedDiv";

export default async function SelectPage() {
  return (
    <div className="flex flex-col min-h-screen">
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
