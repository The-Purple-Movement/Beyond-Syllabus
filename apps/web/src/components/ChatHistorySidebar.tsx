"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  History,
  MoreVertical,
  Edit,
  Check,
  X,
} from "lucide-react";
import { deleteChatSession } from "@/lib/chat-history";
import { ChatSession } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onEditTitle: (id: string, newTitle: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ChatHistorySidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onEditTitle,
  isCollapsed,
  onToggleCollapse,
}: ChatHistorySidebarProps) {
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null
  );

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDeletingSessionId(sessionId);

    // Add a small delay for visual feedback
    setTimeout(() => {
      deleteChatSession(sessionId);
      onDeleteSession(sessionId);
      setDeletingSessionId(null);
    }, 150);
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 60 : 320 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-background/60 backdrop-blur-sm border-r flex flex-col h-full relative z-40"
    >
      {/* New Chat Button */}
      <div className="p-3 border-b">
        <Button
          onClick={onNewChat}
          className="w-full"
          size={isCollapsed ? "icon" : "default"}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">New Chat</span>}
        </Button>
      </div>

      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Chat History</h2>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sessions List */}
      <div
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "hsl(var(--muted-foreground) / 0.2) transparent",
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background-color: hsl(var(--muted-foreground) / 0.2);
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background-color: hsl(var(--muted-foreground) / 0.4);
          }
        `}</style>
        <AnimatePresence>
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <SessionCard
                session={session}
                isActive={session.id === currentSessionId}
                isDeleting={deletingSessionId === session.id}
                isCollapsed={isCollapsed}
                onClick={() => onSessionSelect(session.id)}
                onDelete={(e) => handleDeleteSession(session.id, e)}
                onEditTitle={(newTitle) => onEditTitle(session.id, newTitle)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {sessions.length === 0 && !isCollapsed && (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chat history yet</p>
            <p className="text-xs">Start a new chat to begin</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface SessionCardProps {
  session: ChatSession;
  isActive: boolean;
  isDeleting: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onEditTitle: (newTitle: string) => void;
}

function SessionCard({
  session,
  isActive,
  isDeleting,
  isCollapsed,
  onClick,
  onDelete,
  onEditTitle,
}: SessionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(session.title);

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditedTitle(session.title);
  };

  const handleEditSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedTitle.trim() && editedTitle.trim() !== session.title) {
      onEditTitle(editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditedTitle(session.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      handleEditSave(e as any);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      handleEditCancel(e as any);
    }
  };

  return (
    <Card
      className={`m-2 cursor-pointer transition-all duration-200 hover:shadow-md group ${
        isActive
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-background/50 hover:bg-accent/50"
      } ${isDeleting ? "opacity-50 scale-95" : ""}`}
      onClick={onClick}
    >
      <div className="p-3">
        {isCollapsed ? (
          <div className="flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              {isEditing ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-sm h-6 px-2 py-1"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                    onClick={handleEditSave}
                    title="Save"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    onClick={handleEditCancel}
                    title="Cancel"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="font-medium text-sm line-clamp-2 flex-1">
                    {session.title}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                        title="More options"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={handleEditStart}
                        className="cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Title
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={onDelete}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {session.messages.filter((m) => m.role !== "system").length}{" "}
                messages
              </span>
              <span>
                {formatDistanceToNow(session.lastModified, { addSuffix: true })}
              </span>
            </div>

            {session.messages.length > 0 && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {session.messages
                  .filter((m) => m.role !== "system")
                  .slice(-1)[0]
                  ?.content.substring(0, 100)}
                ...
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
