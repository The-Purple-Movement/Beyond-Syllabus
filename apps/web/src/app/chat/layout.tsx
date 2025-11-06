import "../globals.css";
import Navbar from "@/app/chat/components/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="dashboard-layout">
      <SidebarProvider>
        <Navbar variant="sidebar" />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </section>
  );
}