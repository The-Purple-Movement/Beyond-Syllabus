import type { Metadata } from "next";
import { Suspense } from "react";
import { Montserrat, Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryProvider } from "@/lib/rQuery";
import { DataProvider } from "@/contexts";
import { ScaleLoader } from "react-spinners"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});


export const metadata: Metadata = {
  title: "BeyondSyllabus",
  description:
    "Your modern, AI-powered guide to the university curriculum. Explore subjects, understand modules, and unlock your potential.",
  authors: [{ name: "µLearn" }],
  openGraph: {
    title: "BeyondSyllabus",
    description:
      "Your modern, AI-powered guide to the university curriculum. Explore subjects, understand modules, and unlock your potential. Our platform is designed to streamline your learning process, from understanding complex topics to finding the best study materials.",
    siteName: "BeyondSyllabus",
    url: "https://beyondsyllabus.in/",
    type: "website",
    images: ["/favicon.ico"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL("https://beyondsyllabus.in/"),
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans antialiased ${montserrat.variable} ${poppins.variable} dark:bg-[#030013] bg-white`}
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
                    <ScaleLoader color="#D900FF" />
                  </div>
                }
              >
                {children}
              </Suspense>
            </DataProvider>
          </QueryProvider>
          <Toaster reverseOrder={true} position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
