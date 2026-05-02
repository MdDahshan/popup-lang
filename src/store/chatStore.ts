import { create } from "zustand";
import type { ChatMessage, ChatSession, WordContext } from "@/types";
import * as api from "@/lib/tauri";

interface ChatState {
  messages: ChatMessage[];
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
  sessionId: number | null;

  // Actions
  fetchMessages: (sessionId?: number) => Promise<void>;
  fetchSessions: () => Promise<void>;
  createSession: () => Promise<void>;
  selectSession: (sessionId: number) => Promise<void>;
  renameSession: (sessionId: number, title: string) => Promise<void>;
  deleteSession: (sessionId: number) => Promise<void>;
  sendMessage: (content: string, wordContext?: WordContext) => Promise<void>;
  clearHistory: () => Promise<void>;
  retryLastMessage: () => Promise<void>;
  cancelRequest: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessions: [],
  loading: false,
  error: null,
  sessionId: null,

  fetchMessages: async (targetSessionId) => {
    set({ loading: true, error: null });
    try {
      const sessionId = await api.getOrCreateSession(targetSessionId);
      const [messages, sessions] = await Promise.all([
        api.getChatMessages(sessionId),
        api.getChatSessions(),
      ]);
      set({ messages, sessions, sessionId, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  fetchSessions: async () => {
    try {
      const sessions = await api.getChatSessions();
      set({ sessions });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  createSession: async () => {
    set({ loading: true, error: null });
    try {
      const session = await api.createChatSession("New Chat");
      const sessions = await api.getChatSessions();
      set({ sessionId: session.id, sessions, messages: [], loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  selectSession: async (sessionId) => {
    set({ loading: true, error: null, sessionId });
    try {
      await api.setActiveChatSession(sessionId);
      const [messages, sessions] = await Promise.all([
        api.getChatMessages(sessionId),
        api.getChatSessions(),
      ]);
      set({ messages, sessions, sessionId, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  renameSession: async (sessionId, title) => {
    try {
      await api.renameChatSession(sessionId, title);
      const sessions = await api.getChatSessions();
      set({ sessions });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  deleteSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const nextSessionId = await api.deleteChatSession(sessionId);
      const sessions = await api.getChatSessions();
      if (nextSessionId) {
        const messages = await api.getChatMessages(nextSessionId);
        set({ sessions, messages, sessionId: nextSessionId, loading: false });
      } else {
        const created = await api.createChatSession("New Chat");
        set({ sessions: [...sessions, created], messages: [], sessionId: created.id, loading: false });
      }
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  sendMessage: async (content: string, wordContext?: WordContext) => {
    const { messages } = get();
    
    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      session_id: get().sessionId || 0,
      role: "user",
      content,
      word_context_id: wordContext?.word_id || null,
      created_at: new Date().toISOString(),
    };
    
    set({ 
      messages: [...messages, tempUserMessage],
      loading: true,
      error: null,
    });

    try {
      // Send message to backend
      await api.sendChatMessage(
        content,
        wordContext?.word_id,
        get().sessionId || undefined
      );

      const [updatedMessages, sessions] = await Promise.all([
        api.getChatMessages(get().sessionId || undefined),
        api.getChatSessions(),
      ]);
      set({ messages: updatedMessages, sessions, loading: false });
    } catch (err) {
      // Remove optimistic message on error
      set({ 
        messages: messages,
        error: String(err),
        loading: false,
      });
    }
  },

  clearHistory: async () => {
    set({ loading: true, error: null });
    try {
      await api.clearChatHistory(get().sessionId || undefined);
      const sessions = await api.getChatSessions();
      set({ messages: [], sessions, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  retryLastMessage: async () => {
    const { messages } = get();
    
    // Find the last user message
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    if (lastUserMessageIndex === -1) {
      set({ error: "No message to retry" });
      return;
    }
    
    const lastUserMessage = messages[lastUserMessageIndex];
    
    // Remove all messages after the last user message (including failed AI response)
    const messagesBeforeRetry = messages.slice(0, lastUserMessageIndex + 1);
    set({ messages: messagesBeforeRetry, loading: true, error: null });
    
    try {
      // Resend the last user message
      await api.sendChatMessage(
        lastUserMessage.content,
        lastUserMessage.word_context_id || undefined,
        get().sessionId || undefined
      );

      const [updatedMessages, sessions] = await Promise.all([
        api.getChatMessages(get().sessionId || undefined),
        api.getChatSessions(),
      ]);
      set({ messages: updatedMessages, sessions, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  cancelRequest: () => {
    // If we're loading, we artificially reset it.
    // Real abort requires backend changes (AbortSignal support over IPC).
    if (get().loading) {
      set({ loading: false, error: "Request cancelled by user." });
    }
  },
}));
