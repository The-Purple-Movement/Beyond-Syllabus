"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

/**
 * The sidebar only shows what actually exists. The old version rendered a
 * fake search box, a hardcoded "No chat history yet", and a "User" avatar
 * with a logout icon in an app that has no accounts (DESIGN.md principle 1:
 * the surface tells the truth). Chat persistence is a tracked follow-up;
 * until it ships, the sidebar says so honestly.
 */
export default function ChatSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParams();
  const syllabusUrl = searchParams.get("syllabus");
  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      className="dark:bg-[#1b1b1b] bg-[#DEDEDF]"
    >
      <SidebarHeader className="px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="!p-1 rounded-lg cursor-pointer transition-colors hover:bg-transparent">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/favicon.ico"
                  alt="BeyondSyllabus Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="mt-6 px-4 flex flex-col gap-4">
        <Link href={syllabusUrl || "#"} passHref>
          <Button
            variant="default"
            className={`w-full text-white font-light rounded-sm ${
              syllabusUrl
                ? "bg-gradient-to-r from-[#8362F9] to-[#7B39FF]"
                : "opacity-50 cursor-not-allowed"
            }`}
            disabled={!syllabusUrl}
          >
            View Syllabus
          </Button>
        </Link>

        <div className="p-4 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Chats are not saved yet</p>
          <p className="text-xs">
            Use Share to keep a link to this conversation. Your Question
            Sheets and Journey are saved on this device.
          </p>
        </div>
      </SidebarContent>

      <SidebarFooter className="mt-auto mb-6 px-4">
        <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
          <Link href="/journey" className="hover:text-primary transition-colors">
            My Journey
          </Link>
          <Link href="/select" className="hover:text-primary transition-colors">
            Find a syllabus
          </Link>
        </nav>
      </SidebarFooter>
    </Sidebar>
  );
}
