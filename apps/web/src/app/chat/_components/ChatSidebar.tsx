import Link from "next/link";
import Image from "next/image";
import { LogOut, MessageSquare, Search, CircleUserRound } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      className="dark:bg-[#1b1b1b] bg-[#DEDEDF]"
    >
      <SidebarHeader className="px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="!p-2 rounded-lg cursor-pointer transition-colors">
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
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-3 py-2 rounded-lg dark:bg-[#181818] text-white placeholder-gray-400"
            />
          </div>
          <Link href="/select">
          <Button variant={"default"} className="w-full text-white rounded-lg">
            Select another Syllabus
            </Button>
          </Link>
        </div>

        <h2 className="pt-4 pb-2 text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Chat History
        </h2>
        <div className="p-4 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No chat history yet</p>
          <p className="text-xs">Start a new chat to begin</p>
        </div>
      </SidebarContent>

      <SidebarFooter className="mt-auto mb-6 px-4">
        <SidebarGroup>
          <SidebarGroupContent className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-colors hover:bg-gray-700">
            <div className="flex items-center gap-2">
              <CircleUserRound className="w-8 h-8" />
              <span className="text-xl font-semibold text-[#B56DFC]">User</span>
            </div>
              <LogOut className="w-6 h-6" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}