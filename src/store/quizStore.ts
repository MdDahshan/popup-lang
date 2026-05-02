import { create } from "zustand";
import type { QuizQuestion, AnswerFeedback } from "@/types";
import * as api from "@/lib/tauri";

interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: { question: QuizQuestion; feedback: AnswerFeedback }[];
  isOpen: boolean;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  startQuiz: (singleQuestion?: boolean) => Promise<void>;
  submitAnswer: (userAnswer: string) => Promise<AnswerFeedback>;
  nextQuestion: () => void;
  closeQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: [],
  isOpen: false,
  loading: false,
  submitting: false,
  error: null,

  startQuiz: async (singleQuestion: boolean = false) => {
    set({ loading: true, error: null });
    try {
      const questions = await api.generateQuiz(singleQuestion);
      set({
        questions,
        currentIndex: 0,
        answers: [],
        isOpen: true,
        loading: false,
      });
    } catch (err) {
      set({ error: String(err), loading: false });
      throw err;
    }
  },

  submitAnswer: async (userAnswer: string) => {
    const state = get();
    const question = state.questions[state.currentIndex];
    if (!question) throw new Error("No current question");

    set({ submitting: true });
    try {
      const feedback = await api.submitQuizAnswer(
        question.word_id,
        question.question_type,
        userAnswer,
        question.correct_answer
      );
      set((s) => ({
        answers: [...s.answers, { question, feedback }],
        submitting: false,
      }));
      return feedback;
    } catch (err) {
      set({ error: String(err), submitting: false });
      throw err;
    }
  },

  nextQuestion: () => {
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.questions.length),
    }));
  },

  closeQuiz: () => {
    set({
      isOpen: false,
      questions: [],
      currentIndex: 0,
      answers: [],
    });
  },
}));
