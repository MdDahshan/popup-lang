import * as api from "@/lib/tauri";
import { FullScreenLoader } from "../../shared";
import { Sparkles, RefreshCw, BookOpen, CheckCircle2 } from "lucide-react";
import { WordCard } from "./WordCard";

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
  const learnedCount = dailyWords.filter((e) => e.daily_word.learned).length;
  const totalCount = dailyWords.length;
  const progress = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;

  return (
    <div className="relative h-full w-full overflow-y-auto px-3 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
        
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border/30 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest opacity-80">
              <Sparkles size={12} />
              <span>Daily Curation</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl md:text-3xl">Vocabulary Lab</h2>
          </div>
          
          <button 
            onClick={onGenerate} 
            disabled={generating}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary/80 px-5 py-2.5 text-[13px] font-bold text-foreground border-2 border-border/50 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 disabled:opacity-50 shadow-sm sm:w-auto"
          >
            <RefreshCw size={14} className={generating ? "animate-spin" : "transition-transform duration-500 group-hover:rotate-180"} />
            <span>{generating ? "Crafting..." : "New Set"}</span>
          </button>
        </div>

        {/* Progress Bar — only visible when words are loaded */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center gap-4 rounded-2xl bg-secondary/20 px-4 py-3 border border-border/30">
            <div className="flex-1 min-w-0">
              <div className="h-2 w-full rounded-full bg-border/30 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-muted-foreground">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>{learnedCount}/{totalCount}</span>
            </div>
          </div>
        )}

        {/* Content States */}
        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <FullScreenLoader label="Syncing your lexicon..." />
          </div>
        ) : dailyWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/40 bg-secondary/5 py-16 sm:py-20 md:py-24 text-center px-6">
            <BookOpen size={32} className="mb-3 text-muted-foreground opacity-20" />
            <h3 className="text-base font-bold sm:text-lg">Your library is empty</h3>
            <p className="mt-1 max-w-[260px] text-[12px] text-muted-foreground sm:text-[13px]">
              Tap <strong>"New Set"</strong> to generate your first batch of daily words.
            </p>
          </div>
        ) : (
          /* 
            Responsive Grid Breakdown:
            - Mobile (< 640px):       1 column
            - Small tablet (640-767):  2 columns  
            - Tablet (768-1023):       3 columns  ← fixed the gap here
            - Desktop (1024-1279):     3 columns
            - Large (1280+):           4 columns
          */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {dailyWords.map((entry, idx) => (
              <WordCard 
                key={entry.daily_word.id}
                entry={entry}
                idx={idx}
                onMarkLearned={onMarkLearned}
                onAskAi={onAskAi}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
