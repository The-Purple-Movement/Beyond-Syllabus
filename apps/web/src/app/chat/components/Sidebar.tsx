import Link from "next/link";
import Image from "next/image";
import { LogOut, MessageSquare, User, Search } from "lucide-react";
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

export default function Navbar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const chatHistory = [
    { id: 1, title: "Math Chat" },
    { id: 2, title: "Science Chat" },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props} className="dark:bg-[#1b1b1b]">
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
              className="w-full pl-10 pr-3 py-2 rounded-lg dark:bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant={"default"} className="w-full text-white rounded-lg">
            View Syllabus
          </Button>
        </div>

        <h2 className="pt-4 pb-2 text-xl font-semibold flex items-center gap-2 border-b border-gray-700">
          <MessageSquare className="w-5 h-5" /> Chat History
        </h2>

        <SidebarMenu className="flex flex-col gap-2 mt-2">
          {chatHistory.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton asChild>
                <p className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                  {chat.title}
                </p>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="mt-auto mb-6 px-4">
        <SidebarGroup>
          <SidebarGroupContent className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-colors hover:bg-gray-700">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-medium">User</span>
            </div>
            <Button variant="ghost" size="icon">
              <LogOut className="w-5 h-5" />
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
