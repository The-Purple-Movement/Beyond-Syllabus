import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="fixed top-0 w-full bg-white/10 dark:bg-black/30 backdrop-blur-sm z-50">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className=" sm:inline-block font-semibold text-xl">
            Beyond Syllabus
          </span>
        </Link>

        <div className="flex items-center gap-2 ">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
