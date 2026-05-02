import { Volume2 } from "lucide-react";
import { getContentDirection } from "@/lib/rtl";
import { LearnedButton, ChatButton } from "./ActionButtons";
import type * as api from "@/lib/tauri";

type DailyWordEntry = Awaited<ReturnType<typeof api.getDailyWords>>[0];

export function WordCard({
  entry,
  idx,
  onMarkLearned,
  onAskAi,
}: {
  entry: DailyWordEntry;
  idx: number;
  onMarkLearned: (id: number) => void;
  onAskAi: (wordId: number) => void;
}) {
  const wordDir = getContentDirection(entry.word.word_text);
  const transDir = getContentDirection(entry.word.translation);
  const explDir = getContentDirection(entry.word.explanation);
  const example0 = entry.word.examples[0] || "";
  const exDir = getContentDirection(example0);
  const isWordRtl = wordDir === "rtl";

  return (
    <div 
      className={`group flex flex-col overflow-hidden rounded-3xl border-2 transition-all duration-300 hover:shadow-xl hover:shadow-black/[0.04] ${
        entry.daily_word.learned 
          ? "border-emerald-500/25 bg-emerald-500/[0.02]" 
          : "border-border/50 bg-card/40 backdrop-blur-sm hover:border-primary/30"
      }`}
      style={{ animationDelay: `${idx * 40}ms` }}
    >
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Word Header — fully RTL-aware */}
        <div className="mb-3" dir={wordDir}>
          <div className={`flex items-center gap-2 ${isWordRtl ? "flex-row-reverse justify-end" : ""}`}>
            <h4 className="truncate text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
              {entry.word.word_text}
            </h4>
            <button 
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="Listen to pronunciation"
              title="Listen"
            >
              <Volume2 size={11} />
            </button>
          </div>
          <p className="mt-0.5 text-[11px] font-bold text-muted-foreground/50 uppercase tracking-wide">
            {entry.word.word_type} • <span className="lowercase font-medium">{entry.word.pronunciation}</span>
          </p>
        </div>

        {/* Body Content */}
        <div className="mb-4 flex-1 space-y-3">
          <div>
            <p dir={transDir} className="text-[14px] font-bold text-foreground/90 sm:text-[15px]">
              {entry.word.translation}
            </p>
            <p dir={explDir} className="mt-1 text-[12px] leading-relaxed text-muted-foreground/80 line-clamp-2">
              {entry.word.explanation}
            </p>
          </div>

          {example0 && (
            <div className="rounded-xl bg-secondary/25 p-3 border border-border/20">
              <p 
                dir={exDir}
                className="text-[11px] leading-relaxed italic text-muted-foreground/80 line-clamp-2 sm:text-[12px]"
              >
                &ldquo;{example0}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons — always LTR */}
        <div className="mt-auto flex items-center gap-2" dir="ltr">
          <LearnedButton 
            isLearned={entry.daily_word.learned} 
            onClick={() => onMarkLearned(entry.daily_word.id)}
            disabled={false}
          />
          <ChatButton onClick={() => onAskAi(entry.word.id)} />
        </div>
      </div>
    </div>
  );
}
