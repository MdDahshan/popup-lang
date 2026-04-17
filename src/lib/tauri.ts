import { invoke } from "@tauri-apps/api/core";
import type {
  User,
  DailyWordEntry,
  Word,
  WordExplanation,
  QuizQuestion,
  AnswerFeedback,
  DashboardStats,
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

// ─── AI Commands ───

export async function generateDailyWords(): Promise<WordExplanation[]> {
  return invoke<WordExplanation[]>("generate_daily_words");
}

// ─── Quiz Commands ───

export async function generateQuiz(): Promise<QuizQuestion[]> {
  return invoke<QuizQuestion[]>("generate_quiz");
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
