import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getWordDetail, markWordLearned } from "@/lib/tauri";
import type { Word } from "@/types";
import { useWordsStore } from "@/store/wordsStore";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Volume2,
  MessageSquareText,
  Lightbulb,
  Loader2,
  Sparkles,
} from "lucide-react";

export function WordDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const dailyWordId = searchParams.get("dw");

  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const { markLearned, dailyWords } = useWordsStore();

  const isLearned = dailyWords.find(
    (d) => d.daily_word.id === Number(dailyWordId)
  )?.daily_word.learned;

  useEffect(() => {
    if (id) {
      getWordDetail(Number(id))
        .then(setWord)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleMarkLearned = async () => {
    if (!dailyWordId) return;
    setMarking(true);
    try {
      await markLearned(Number(dailyWordId));
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!word) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-surface-400">Word not found</p>
        <button onClick={() => navigate("/")} className="text-primary-400 hover:text-primary-300">
          ← Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to words
      </button>

      {/* Word Header */}
      <div className="glass rounded-2xl p-8 mb-6 animate-slide-up">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold gradient-text">{word.word_text}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/15 text-primary-300 border border-primary-500/20">
                {word.word_type}
              </span>
            </div>
            <p className="text-xl text-surface-300 mb-1">{word.translation}</p>
            <div className="flex items-center gap-2 text-surface-400">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm italic">{word.pronunciation}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* Difficulty badge */}
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-medium text-center ${
                word.difficulty_score < 0.4
                  ? "bg-success-500/15 text-success-400"
                  : word.difficulty_score < 0.7
                  ? "bg-warning-500/15 text-warning-400"
                  : "bg-error-500/15 text-error-400"
              }`}
            >
              {word.difficulty_score < 0.4 ? "Easy" : word.difficulty_score < 0.7 ? "Medium" : "Hard"}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="glass rounded-2xl p-6 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary-400" />
          </div>
          <h3 className="font-semibold text-white">Explanation</h3>
        </div>
        <p className="text-surface-300 leading-relaxed">{word.explanation}</p>
      </div>

      {/* Examples */}
      <div className="glass rounded-2xl p-6 mb-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 flex items-center justify-center">
            <MessageSquareText className="w-4 h-4 text-accent-400" />
          </div>
          <h3 className="font-semibold text-white">Examples</h3>
        </div>
        <div className="space-y-3">
          {word.examples.map((example, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-surface-800/30"
            >
              <span className="w-6 h-6 rounded-full bg-surface-700/50 flex items-center justify-center text-xs text-surface-400 shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-surface-300 text-sm leading-relaxed">{example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        {dailyWordId && (
          <button
            onClick={handleMarkLearned}
            disabled={isLearned || marking}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all ${
              isLearned
                ? "bg-success-500/15 text-success-400 border border-success-500/20 cursor-default"
                : "gradient-primary text-white hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
            }`}
          >
            {marking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLearned ? (
              <>
                <Check className="w-5 h-5" /> Learned!
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Mark as Learned
              </>
            )}
          </button>
        )}

        <button
          onClick={() => navigate("/")}
          className="px-6 py-3.5 rounded-xl bg-surface-800/60 text-surface-300 hover:text-white hover:bg-surface-700/60 transition-all border border-surface-700/30"
        >
          <BookOpen className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
