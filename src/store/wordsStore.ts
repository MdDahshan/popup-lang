import { create } from "zustand";
import type { DailyWordEntry, WordExplanation, WordContext } from "@/types";
import * as api from "@/lib/tauri";

interface WordsState {
  dailyWords: DailyWordEntry[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  fetchDailyWords: () => Promise<void>;
  generateDailyWords: (forceNew?: boolean) => Promise<WordExplanation[]>;
  markLearned: (dailyWordId: number) => Promise<void>;
  explainWordWithAI: (wordId: number, navigate: (path: string, options?: { state?: any }) => void) => void;
}

export const useWordsStore = create<WordsState>((set, get) => ({
  dailyWords: [],
  loading: false,
  generating: false,
  error: null,

  fetchDailyWords: async () => {
    set({ loading: true, error: null });
    try {
      const words = await api.getDailyWords();
      set({ dailyWords: words, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  generateDailyWords: async (forceNew: boolean = false) => {
    set({ generating: true, error: null });
    try {
      const words = await api.generateDailyWords(forceNew);
      // Refetch daily words to get DB IDs
      await get().fetchDailyWords();
      set({ generating: false });
      return words;
    } catch (err) {
      set({ error: String(err), generating: false });
      throw err;
    }
  },

  markLearned: async (dailyWordId: number) => {
    try {
      await api.markWordLearned(dailyWordId);
      set((state) => ({
        dailyWords: state.dailyWords.map((entry) =>
          entry.daily_word.id === dailyWordId
            ? { ...entry, daily_word: { ...entry.daily_word, learned: true } }
            : entry
        ),
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  explainWordWithAI: (wordId: number, navigate: (path: string, options?: { state?: any }) => void) => {
    const state = get();
    const wordEntry = state.dailyWords.find((entry) => entry.word.id === wordId);
    
    if (!wordEntry) {
      console.error(`Word with id ${wordId} not found in daily words`);
      return;
    }

    const wordContext: WordContext = {
      word_id: wordEntry.word.id,
      word_text: wordEntry.word.word_text,
      translation: wordEntry.word.translation,
      pronunciation: wordEntry.word.pronunciation,
    };

    // Navigate to ChatPage with word context
    navigate("/", {
      state: { wordContext },
    });
  },
}));
