import "../globals.css";
import ChatSidebar from "@/app/chat/_components/ChatSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="dashboard-layout">
      <SidebarProvider>
        <ChatSidebar variant="sidebar" />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </section>
  );
}