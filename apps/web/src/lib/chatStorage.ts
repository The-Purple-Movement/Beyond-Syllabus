// Simple localStorage-backed chat persistence stuff

export type StoredChatMessage = {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
};

export type StoredChat = {
  id: string;
  title: string;
  messages: StoredChatMessage[];
  createdAt: string;
  updatedAt: string;
  moduleTitle?: string;
};

const USER_ID_KEY = "bs_user_id";
const CHATS_KEY_PREFIX = "bs_chats_";
const ACTIVE_CHAT_PREFIX = "bs_active_chat_";

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function loadChats(userId: string): StoredChat[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CHATS_KEY_PREFIX + userId);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChats(userId: string, chats: StoredChat[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHATS_KEY_PREFIX + userId, JSON.stringify(chats));
}

export function getActiveChatId(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_CHAT_PREFIX + userId);
}

export function setActiveChatId(userId: string, chatId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_CHAT_PREFIX + userId, chatId);
}

export function createNewChat(
  moduleTitle?: string,
  firstTitle?: string
): StoredChat {
  const now = new Date().toISOString();
  const title = firstTitle && firstTitle.trim().length > 0
    ? firstTitle
    : moduleTitle
    ? `${moduleTitle} - New Chat`
    : "New Chat";
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
    moduleTitle,
  };
}

export function upsertChat(
  chats: StoredChat[],
  chat: StoredChat
): StoredChat[] {
  const idx = chats.findIndex((c) => c.id === chat.id);
  if (idx === -1) return [chat, ...chats];
  const updated = [...chats];
  updated[idx] = chat;
  return updated;
}

export function deleteChatById(chats: StoredChat[], id: string): StoredChat[] {
  return chats.filter((c) => c.id !== id);
}


