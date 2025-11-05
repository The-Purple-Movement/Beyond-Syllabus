import type { Metadata } from "next";
import { Suspense } from "react";
import { Montserrat, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { QueryProvider } from "@/lib/rQuery";
import { DataProvider } from "@/contexts";
import { GridLoader } from "react-spinners"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const monteserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-monteserrat",
  display: "swap",
});


export const metadata: Metadata = {
  title: "BeyondSyllabus",
  description:
    "Explore your university subjects, syllabus, and study resources in a click.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans antialiased ${monteserrat.variable} ${poppins.variable} dark:bg-[#030013] bg-white`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <DataProvider>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center w-screen h-screen">
                    <GridLoader color="#D900FF" size={100} />
                  </div>
                }
              >
                {children}
              </Suspense>
            </DataProvider>
          </QueryProvider>
          <Toaster closeButton richColors/>
        </ThemeProvider>
      </body>
    </html>
  );
}
