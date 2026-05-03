import { invoke } from "@tauri-apps/api/core";
import type {
  User,
  DailyWordEntry,
  Word,
  WordExplanation,
  QuizQuestion,
  AnswerFeedback,
  DashboardStats,
  ChatMessage,
  ChatSession,
} from "@/types";

// ─── User Commands ───

export async function getUser(): Promise<User | null> {
  return invoke<User | null>("get_user");
}

export async function saveUser(user: User): Promise<number> {
  return invoke<number>("save_user", { user });
}

// ─── Word Commands ───

export async function getDailyWords(): Promise<DailyWordEntry[]> {
  return invoke<DailyWordEntry[]>("get_daily_words");
}

export async function getWordDetail(wordId: number): Promise<Word | null> {
  return invoke<Word | null>("get_word_detail", { wordId });
}

export async function markWordLearned(dailyWordId: number): Promise<void> {
  return invoke<void>("mark_word_learned", { dailyWordId });
}

export async function getLearnedWords(): Promise<Word[]> {
  return invoke<Word[]>("get_learned_words");
}

// ─── AI Commands ───

export async function generateDailyWords(forceNew: boolean = false): Promise<WordExplanation[]> {
  return invoke<WordExplanation[]>("generate_daily_words", { forceNew });
}

// ─── Quiz Commands ───

export async function generateQuiz(singleQuestion: boolean = false): Promise<QuizQuestion[]> {
  return invoke<QuizQuestion[]>("generate_quiz", { singleQuestion });
}

export async function submitQuizAnswer(
  wordId: number,
  questionType: string,
  userAnswer: string,
  correctAnswer: string
): Promise<AnswerFeedback> {
  return invoke<AnswerFeedback>("submit_quiz_answer", {
    wordId,
    questionType,
    userAnswer,
    correctAnswer,
  });
}

// ─── Settings Commands ───

export async function saveApiKey(apiKey: string): Promise<void> {
  return invoke<void>("save_api_key", { apiKey });
}

export async function getApiKey(): Promise<string | null> {
  return invoke<string | null>("get_api_key");
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return invoke<DashboardStats>("get_dashboard_stats");
}

export async function getSetting(key: string): Promise<string | null> {
  return invoke<string | null>("get_setting", { key });
}

export async function setSetting(key: string, value: string): Promise<void> {
  return invoke<void>("set_setting", { key, value });
}

// ─── Chat Commands ───

export async function getChatMessages(sessionId?: number): Promise<ChatMessage[]> {
  return invoke<ChatMessage[]>("get_chat_messages", { sessionId });
}

export async function sendChatMessage(
  content: string,
  wordContextId?: number,
  sessionId?: number
): Promise<ChatMessage> {
  return invoke<ChatMessage>("send_chat_message", {
    content,
    wordContextId,
    sessionId,
  });
}

export async function clearChatHistory(sessionId?: number): Promise<void> {
  return invoke<void>("clear_chat_history", { sessionId });
}

export async function getOrCreateSession(sessionId?: number): Promise<number> {
  return invoke<number>("get_or_create_session", { sessionId });
}

export async function getChatSessions(): Promise<ChatSession[]> {
  return invoke<ChatSession[]>("get_chat_sessions");
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  return invoke<ChatSession>("create_chat_session", { title });
}

export async function setActiveChatSession(sessionId: number): Promise<void> {
  return invoke<void>("set_active_chat_session", { sessionId });
}

export async function renameChatSession(sessionId: number, title: string): Promise<void> {
  return invoke<void>("rename_chat_session", { sessionId, title });
}

export async function deleteChatSession(sessionId: number): Promise<number | null> {
  return invoke<number | null>("delete_chat_session", { sessionId });
}

export interface ModelOption {
  id: string;
  label: string;
}

export interface AgentDetection {
  id: string;
  display_name: string;
  executable_path?: string;
  available: boolean;
  models: ModelOption[];
}

export async function getAvailableProviders(): Promise<AgentDetection[]> {
  return invoke<AgentDetection[]>("get_available_providers");
}

export async function setPreferredProvider(providerId: string): Promise<void> {
  return invoke<void>("set_preferred_provider", { providerId });
}
