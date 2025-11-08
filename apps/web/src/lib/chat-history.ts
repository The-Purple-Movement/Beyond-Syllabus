import { ChatSession } from "@/types";


export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const extractTitleFromMarkdown = (markdown: string): string => {
  if (!markdown.trim()) return "New Chat";
  
  // Try to find a title from markdown headers
  const lines = markdown.split('\n');
  const titleLine = lines.find(line => line.startsWith('#'));
  if (titleLine) {
    return titleLine.replace(/#/g, '').trim().substring(0, 50);
  }
  
  // Fallback to first few words
  const firstLine = lines.find(line => line.trim().length > 0);
  if (firstLine) {
    const words = firstLine.trim().split(' ').slice(0, 6);
    return words.join(' ').substring(0, 50);
  }
  
  return "Untitled Chat";
};

export const saveChatSession = (session: ChatSession): void => {
  try {
    const sessions = getChatSessions();
    sessions[session.id] = {
      ...session,
      lastModified: new Date(),
    };
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save chat session:', error);
  }
};

export const getChatSessions = (): Record<string, ChatSession> => {
  try {
    const stored = localStorage.getItem('chatSessions');
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    // Convert date strings back to Date objects
    Object.values(parsed).forEach((session: any) => {
      session.createdAt = new Date(session.createdAt);
      session.lastModified = new Date(session.lastModified);
    });
    
    return parsed;
  } catch (error) {
    console.error('Failed to load chat sessions:', error);
    return {};
  }
};

export const getChatSessionsList = (): ChatSession[] => {
  const sessions = getChatSessions();
  return Object.values(sessions).sort((a, b) => 
    new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );
};

export const getChatSession = (id: string): ChatSession | null => {
  const sessions = getChatSessions();
  return sessions[id] || null;
};

export const deleteChatSession = (id: string): void => {
  try {
    const sessions = getChatSessions();
    delete sessions[id];
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to delete chat session:', error);
  }
};

export const createNewChatSession = (): ChatSession => {
  return {
    id: generateSessionId(),
    title: "New Chat",
    createdAt: new Date(),
    lastModified: new Date(),
    markdown: "",
    messages: [],
    suggestions: []
  };
};
