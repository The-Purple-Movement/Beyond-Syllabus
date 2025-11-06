import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 transition-all">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h2
          className="text-lg font-semibold bg-[radial-gradient(50%_335.34%_at_50%_50%,#B56DFC_0%,#7B39FF_100%)] bg-clip-text text-transparent"
        >
          Beyond Syllabus
        </h2>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
