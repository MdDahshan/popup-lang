import { getContentDirection } from "@/lib/rtl";
import * as api from "@/lib/tauri";
import { FullScreenLoader } from "../shared";

export function WordsView({
  loading,
  dailyWords,
  generating,
  onGenerate,
  onMarkLearned,
  onAskAi,
}: {
  loading: boolean;
  dailyWords: Awaited<ReturnType<typeof api.getDailyWords>>;
  generating: boolean;
  onGenerate: () => void;
  onMarkLearned: (id: number) => void;
  onAskAi: (wordId: number) => void;
}) {
  return (
    <div className="space-y-5 px-5 py-4 md:px-6 md:py-5">
      <div className="rounded-[28px] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.05),transparent_45%)] px-6 py-6 md:px-7 md:py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Words</p>
            <h3 className="mt-3 text-[30px] font-semibold tracking-tight">Daily words</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-[15px]">
              Review your generated set, mark progress, and send any word directly to chat.
            </p>
          </div>
          <button onClick={onGenerate} className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
            {generating ? "Generating..." : "Generate new set"}
          </button>
        </div>
      </div>

      {loading ? (
        <FullScreenLoader label="Loading words..." />
      ) : dailyWords.length === 0 ? (
        <div className="rounded-[28px] border border-border/70 bg-card p-8 text-center text-muted-foreground shadow-sm">
          No words yet. Generate your first set.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {dailyWords.map((entry) => (
            <div key={entry.daily_word.id} className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-[28px] font-semibold tracking-tight">{entry.word.word_text}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.word.pronunciation} • {entry.word.word_type}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-[10px] text-muted-foreground">
                  Difficulty {entry.word.difficulty_score}
                </span>
              </div>

              <p className="mb-2 text-[15px] font-medium">{entry.word.translation}</p>
              <p className="mb-4 text-sm leading-7 text-muted-foreground">{entry.word.explanation}</p>

              <div className="mb-4 space-y-2 rounded-2xl bg-secondary/80 p-4">
                {entry.word.examples.slice(0, 2).map((example, index) => (
                  <p key={index} dir={getContentDirection(example)} className="text-sm leading-7">
                    {example}
                  </p>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onMarkLearned(entry.daily_word.id)}
                  disabled={entry.daily_word.learned}
                  className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {entry.daily_word.learned ? "Learned" : "Mark learned"}
                </button>
                <button onClick={() => onAskAi(entry.word.id)} className="rounded-2xl bg-secondary px-4 py-2.5 text-sm text-foreground transition hover:bg-accent">
                  Ask AI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
