import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import { useWordsStore } from "@/store/wordsStore";
import { useQuizStore } from "@/store/quizStore";
import { QuizModal } from "@/components/learning/QuizModal";
import { SUPPORTED_LANGUAGES } from "@/types";
import {
  Sparkles,
  BookOpen,
  Flame,
  Target,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Circle,
  Zap,
} from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { dailyWords, loading, generating, fetchDailyWords, generateDailyWords, error } = useWordsStore();
  const { isOpen, startQuiz, loading: quizLoading } = useQuizStore();
  const [genError, setGenError] = useState("");

  useEffect(() => {
    fetchDailyWords();
  }, [fetchDailyWords]);

  const handleGenerate = async () => {
    setGenError("");
    try {
      await generateDailyWords();
    } catch (err) {
      setGenError(String(err));
    }
  };

  const handleStartQuiz = async () => {
    try {
      await startQuiz();
    } catch (err) {
      setGenError(String(err));
    }
  };

  const learnedCount = dailyWords.filter((d) => d.daily_word.learned).length;
  const totalCount = dailyWords.length;
  const progressPercent = totalCount > 0 ? (learnedCount / totalCount) * 100 : 0;

  const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === user?.target_language);

  // Progress ring
  const ringSize = 120;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} 👋
          </h1>
          <p className="text-surface-400">
            Learning {targetLang?.flag} {targetLang?.name} · {user?.level}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">0 streak</span>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="col-span-1 glass rounded-2xl p-6 flex flex-col items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="relative">
            <svg width={ringSize} height={ringSize} className="transform -rotate-90">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                strokeWidth={strokeWidth}
                stroke="rgba(99, 102, 241, 0.15)"
                fill="none"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                strokeWidth={strokeWidth}
                stroke="url(#progressGradient)"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{learnedCount}/{totalCount}</span>
              <span className="text-xs text-surface-400">words</span>
            </div>
          </div>
          <p className="text-sm text-surface-400">Today's Progress</p>
        </div>

        {/* Quick Actions */}
        <div className="col-span-2 flex flex-col gap-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {dailyWords.length === 0 && !loading ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 glass rounded-2xl p-6 flex items-center gap-4 hover-lift cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shrink-0 group-hover:shadow-lg group-hover:shadow-primary-500/25 transition-shadow">
                {generating ? (
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                ) : (
                  <Sparkles className="w-7 h-7 text-white" />
                )}
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold text-white">
                  {generating ? "Generating your words..." : "Generate Today's Words"}
                </p>
                <p className="text-sm text-surface-400">
                  {generating
                    ? "AI is preparing your personalized vocabulary"
                    : `Get ${user?.daily_word_count} new words to learn today`}
                </p>
              </div>
            </button>
          ) : (
            <>
              <button
                onClick={handleStartQuiz}
                disabled={quizLoading || dailyWords.length === 0}
                className="glass rounded-2xl p-5 flex items-center gap-4 hover-lift cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center shrink-0">
                  {quizLoading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Zap className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-white">Start Quiz</p>
                  <p className="text-sm text-surface-400">Test your knowledge</p>
                </div>
                <ChevronRight className="w-5 h-5 text-surface-500 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="glass rounded-2xl p-5 flex items-center gap-4 hover-lift cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center shrink-0">
                  {generating ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-white">
                    {generating ? "Generating..." : "Refresh Words"}
                  </p>
                  <p className="text-sm text-surface-400">Generate a new set</p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {(genError || error) && (
        <div className="mt-4 p-4 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm animate-fade-in">
          {genError || error}
        </div>
      )}

      {/* Word List */}
      {dailyWords.length > 0 && (
        <div className="mt-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-400" />
              Today's Words
            </h2>
            <span className="text-sm text-surface-400">
              {learnedCount} of {totalCount} completed
            </span>
          </div>

          <div className="grid gap-3 stagger-children">
            {dailyWords.map((entry) => (
              <button
                key={entry.word.id}
                onClick={() => navigate(`/word/${entry.word.id}?dw=${entry.daily_word.id}`)}
                className="glass rounded-xl p-4 flex items-center gap-4 hover-lift cursor-pointer group text-left w-full"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    entry.daily_word.learned
                      ? "bg-success-500/20"
                      : "bg-surface-700/50"
                  }`}
                >
                  {entry.daily_word.learned ? (
                    <CheckCircle2 className="w-5 h-5 text-success-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-surface-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{entry.word.word_text}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-surface-700/50 text-surface-400">
                      {entry.word.word_type}
                    </span>
                  </div>
                  <p className="text-sm text-surface-400 truncate">{entry.word.translation}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-surface-700 overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-primary transition-all"
                      style={{ width: entry.daily_word.learned ? "100%" : "0%" }}
                    />
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-500 group-hover:text-primary-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      )}

      {/* Quiz Modal */}
      {isOpen && <QuizModal />}
    </div>
  );
}
