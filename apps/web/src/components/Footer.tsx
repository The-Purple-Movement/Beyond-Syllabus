import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer
      className={`relative w-full shrink-0  bg-transparent bg-no-repeat bg-cover`}
    >
      <div className="absolute inset-0 "/>

      <div className="container relative z-10 mx-auto px-4 md:px-6 py-8">
        <div className="flex md:hidden flex-col gap-2 mb-5">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="font-semibold">BeyondSyllabus</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Your AI-powered guide to the university curriculum.
          </p>
          <Link
            href="https://github.com/The-Purple-Movement/Beyond-Syllabus"
            target="_blank"
            className="w-fit p-2 rounded-full flex hover:shadow-md"
          >
            <Github />
          </Link>
        </div>

        <div className="flex">
          <div className="md:flex md:visible hidden flex-col gap-2 mb-5">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg"
            >
              <span className="font-semibold">BeyondSyllabus</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your AI-powered guide to the university curriculum.
            </p>
            <Link
              href="https://github.com/The-Purple-Movement/Beyond-Syllabus"
              target="_blank"
              className="w-fit rounded-full flex p-3 hover:shadow-md"
            >
              <Github />
            </Link>
          </div>

          <div className="flex gap-5 flex-row w-full md:justify-evenly">
            <div>
              <h3 className="text-sm font-semibold mb-3">Navigation</h3>
              <nav className="flex flex-col gap-2">
                <Link href="/">Home</Link>
                <Link href="/select">Select Course</Link>
                <Link href="/chat">AI Chat</Link>
              </nav>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Resources</h3>
              <nav className="flex flex-col gap-2">
                <Link href="https://github.com/The-Purple-Movement/Beyond-Syllabus/blob/main/CONTRIBUTION.md">Contribution Guide</Link>
                <Link href="https://github.com/The-Purple-Movement/Beyond-Syllabus/blob/main/CODE_OF_CONDUCT.md">Code of Conduct</Link>
                <Link href="https://github.com/The-Purple-Movement/Beyond-Syllabus/blob/main/LICENSE">License</Link>
              </nav>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Legal</h3>
              <nav className="flex flex-col gap-2">
                <Link href="https://github.com/The-Purple-Movement/Beyond-Syllabus">Terms of Service</Link>
                <Link href="https://github.com/The-Purple-Movement/Beyond-Syllabus">Privacy Policy</Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>
            {new Date().getFullYear()} BeyondSyllabus. All rights reserved. An
            open-source project.
          </p>
        </div>
      </div>
    </footer>
  );
}