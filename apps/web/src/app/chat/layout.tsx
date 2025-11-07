import "../globals.css";
import { Inter } from "next/font/google";
import ChatSidebar from "@/app/chat/_components/ChatSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function ChatRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className={`antialiased ${inter.variable} dashboard-layout`}>
      <SidebarProvider>
        <ChatSidebar variant="sidebar" />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </section>
  );
}