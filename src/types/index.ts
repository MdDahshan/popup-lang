// ─── User Types ───

export interface User {
  id: number;
  native_language: string;
  target_language: string;
  level: "beginner" | "intermediate" | "advanced";
  daily_word_count: number;
  reminder_enabled: boolean;
  interests: string[];
  created_at: string;
  updated_at: string;
}

// ─── Word Types ───

export interface Word {
  id: number;
  word_text: string;
  target_language: string;
  translation: string;
  pronunciation: string;
  explanation: string;
  examples: string[];
  word_type: string;
  difficulty_score: number;
  created_at: string;
}

export interface DailyWord {
  id: number;
  set_id: number;
  word_id: number;
  order_index: number;
  review_priority: number;
  learned: boolean;
}

export interface DailyWordEntry {
  word: Word;
  daily_word: DailyWord;
}

export interface WordExplanation {
  word_text: string;
  translation: string;
  pronunciation: string;
  explanation: string;
  examples: string[];
  word_type: string;
  difficulty_score: number;
}

// ─── Quiz Types ───

export interface QuizQuestion {
  word_id: number;
  question_type: "translate" | "multiple_choice" | "fill_blank";
  prompt: string;
  options?: string[];
  correct_answer: string;
}

export interface AnswerFeedback {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  extra_examples: string[];
  encouragement: string;
}

// ─── Dashboard Types ───

export interface DashboardStats {
  total_words_learned: number;
  today_completed: number;
  today_total: number;
  weekly_activity: number[];
  accuracy_rate: number;
  streak_count: number;
  hardest_words: Word[];
}

// ─── Chat Types ───

export interface ChatSession {
  id: number;
  user_id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  word_context_id: number | null;
  created_at: string;
}

export interface WordContext {
  word_id: number;
  word_text: string;
  translation: string;
  pronunciation: string;
  explanation?: string | null;
  word_type?: string | null;
  examples?: string[] | null;
}

// ─── Language ───

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
];

export const INTERESTS = [
  "travel",
  "work",
  "business",
  "daily conversation",
  "food & cooking",
  "culture & arts",
  "technology",
  "sports",
  "health",
  "education",
  "entertainment",
  "nature",
];
