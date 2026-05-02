import { BookOpen, CheckCircle2, Sparkles, Trophy } from "lucide-react";
import type { DashboardStats, User } from "@/types";

export function DashboardView({
  user,
  stats,
  statsLoading,
  wordsCount,
  generating,
  onGenerate,
}: {
  user: User;
  stats: DashboardStats | null;
  statsLoading: boolean;
  wordsCount: number;
  generating: boolean;
  onGenerate: () => void;
}) {
  const cards = [
    { label: "Words learned", value: stats?.total_words_learned ?? "—", icon: BookOpen },
    { label: "Today completed", value: `${stats?.today_completed ?? 0}/${stats?.today_total ?? 0}`, icon: CheckCircle2 },
    { label: "Accuracy", value: `${stats?.accuracy_rate ?? 0}%`, icon: Trophy },
    { label: "Current streak", value: stats?.streak_count ?? "—", icon: Sparkles },
  ];

  return (
    <div className="space-y-5 px-5 py-4 md:px-6 md:py-5">
      <div className="rounded-[28px] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.05),transparent_45%)] px-6 py-6 md:px-7 md:py-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Dashboard</p>
            <h3 className="mt-3 text-[30px] font-semibold tracking-tight md:text-[34px]">
              Ready for your next {user.target_language.toUpperCase()} session?
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-[15px]">
              Review your words, track your progress, and jump back into AI chat from a cleaner workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={onGenerate} className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
                {generating ? "Generating..." : "Generate today’s words"}
              </button>
              <div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                {wordsCount} words loaded
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-card/80 p-5 shadow-sm ring-1 ring-border/60 backdrop-blur">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Profile</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Languages</p>
                <p className="mt-1 text-[15px] font-medium">
                  {user.native_language.toUpperCase()} → {user.target_language.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Level</p>
                <p className="mt-1 text-[15px] font-medium capitalize">{user.level}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily goal</p>
                <p className="mt-1 text-[15px] font-medium">{user.daily_word_count} words</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[24px] border border-border/70 bg-card px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-3 text-[30px] font-semibold tracking-tight">{statsLoading ? "..." : card.value}</p>
                </div>
                <div className="rounded-2xl bg-secondary p-2 text-muted-foreground">
                  <Icon size={17} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Weekly activity</p>
              <h4 className="mt-2 text-[18px] font-medium tracking-tight">Your learning rhythm</h4>
            </div>
          </div>

          <div className="mt-6 flex h-52 items-end gap-3">
            {(stats?.weekly_activity ?? [0, 0, 0, 0, 0, 0, 0]).map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-[16px] bg-primary/85" style={{ height: `${Math.max(12, value * 18)}px` }} />
                <span className="text-[11px] text-muted-foreground">D{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Hardest words</p>
          <h4 className="mt-2 text-[18px] font-medium tracking-tight">Needs more practice</h4>

          <div className="mt-6 space-y-2.5">
            {(stats?.hardest_words ?? []).slice(0, 5).map((word) => (
              <div key={word.id} className="flex items-center justify-between rounded-2xl bg-secondary/80 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium">{word.word_text}</p>
                  <p className="truncate text-xs text-muted-foreground">{word.translation}</p>
                </div>
                <span className="ml-3 rounded-full bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
                  Difficulty {word.difficulty_score}
                </span>
              </div>
            ))}
            {!stats?.hardest_words?.length && <p className="text-sm text-muted-foreground">No difficult words yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
