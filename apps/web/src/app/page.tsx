import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  BookOpenCheck,
  BarChart3,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AuroraText } from "@/components/ui/aurora-text";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FeatureCardProps } from "@/lib/types";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300">
      <Header />
      <main className="flex-grow relative">
        <section
          className={`w-full h-screen flex flex-col justify-center items-center px-4 text-center relative z-10`}
        >
          <div className="absolute inset-0">
            <div
              className="w-full h-full bg-no-repeat bg-contain bg-bottom"
              style={{
                backgroundImage: `url("/hero.webp")`,
                opacity: 0.5,
              }}
            />
          </div>

          <div className="relative z-20 text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="block text-2xl font-light text-black dark:text-white mb-2">
                Welcome to
              </span>
              <AuroraText colors={["#8800ff", "#7928CA", "#0070F3", "#38bdf8"]}>
                Beyond Syllabus
              </AuroraText>
            </h1>
            <p className="max-w-2xl text-lg md:text-xl text-black dark:text-white mt-4">
              Your modern, AI-powered guide to the university curriculum.
              Explore subjects, understand modules, and unlock your potential.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-full md:w-auto flex items-center justify-center gap-2 h-[44px]"
              >
                <Link href="/chat">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  AI Chat
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="w-full md:w-auto flex items-center justify-center gap-2 h-[44px] bg-[#8800ff] text-white"
              >
                <Link href="/select" prefetch={true}>
                  Explore Your Syllabus
                  <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full py-20 md:py-28 lg:py-32 transition-colors duration-300">
          <div className="container mx-auto px-4 md:px-6 text-center mb-16">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-purple-900/20 px-4 py-2 text-sm font-medium text-purple-700">
                Key Features
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white">
                Learn Smarter, Not Harder
              </h2>
              <p className="max-w-[900px] mx-auto text-gray-700 dark:text-gray-300 md:text-xl leading-relaxed">
                Our platform is designed to streamline your learning process,
                from understanding complex topics to finding the best study
                materials.
              </p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto px-4 md:px-6">
            <FeatureCard
              icon={<BookOpenCheck className="h-8 w-8 text-purple-700" />}
              title="Structured Syllabus"
              description="Access your complete university syllabus, broken down by program, semester, and subject."
            />
            <FeatureCard
              icon={<GraduationCap className="h-8 w-8 text-purple-700" />}
              title="AI-Powered Insights"
              description="Get concise summaries of your syllabus modules and chat with an AI to grasp key concepts quickly."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-purple-700" />}
              title="Learning Tools"
              description="Generate learning tasks and discover real-world applications for each module."
            />
          </div>
        </section>

        <section className="relative w-full h-[400px] md:h-[600px] mt-16 md:mt-0">
          <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
            <div
              className="w-full h-full bg-no-repeat bg-contain bg-bottom rotate-180"
              style={{
                backgroundImage: `url(${"/hero.webp"})`,
                opacity: 0.5,
              }}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-purple-100 dark:bg-purple-800/30 p-4 rounded-full flex justify-center w-[70px] h-[70px] items-center mb-4">
        {icon}
      </div>
      <Card className="text-center rounded-2xl bg-white dark:bg-gray-800 shadow-md p-4 h-full transition-colors duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-black dark:text-white">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
