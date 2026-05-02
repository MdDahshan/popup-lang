import type { DashboardStats, User } from "@/types";
import { ArrowRight, Zap } from "lucide-react";

import { LearnedWordsTable } from "./LearnedWordsTable";

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
  const greeting = getGreeting();
  const rawActivity = stats?.weekly_activity ?? [0, 0, 0, 0, 0, 0, 0];
  const todayDayIndex = new Date().getDay();

  const activity = [0, 0, 0, 0, 0, 0, 0];
  rawActivity.forEach((value, i) => {
    const dayIndex = ((todayDayIndex - (6 - i)) % 7 + 7) % 7;
    activity[dayIndex] = value;
  });

  const maxActivity = Math.max(...activity, 1);
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex h-full min-h-0 w-full flex-col p-6 sm:p-8 overflow-y-auto overflow-x-hidden bg-background">
      <div className="flex w-full min-h-max flex-col gap-8 pb-8">
        
        {/* TOP: Hero Area */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-8 justify-between items-start sm:items-center rounded-[32px] border border-border/60 bg-transparent p-6 sm:p-10">
          <div className="flex flex-col gap-3 w-full">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary/80">
              {greeting}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
              Ready for <span className="text-primary">{user.target_language}</span>?
            </h1>
            <p className="text-[14px] text-muted-foreground font-medium mt-1">
              {wordsCount > 0 
                ? `You have ${wordsCount} words loaded for today.` 
                : `Let's generate your ${user.daily_word_count} daily words.`}
            </p>
          </div>

          <button
            onClick={onGenerate}
            disabled={generating}
            className="group flex flex-shrink-0 items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 text-[15px] font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {generating ? (
              <>
                <Zap size={18} className="animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                {wordsCount > 0 ? "Generate Words" : "Start Learning"}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>

        {/* MIDDLE: Advanced Weekly Chart */}
        <div className="relative flex flex-1 flex-col justify-between border-l-2 border-b-2 border-border/80 bg-transparent p-6 sm:p-10 z-0">
          <div className="absolute inset-x-6 sm:inset-x-10 bottom-[80px] top-[100px] pointer-events-none flex flex-col justify-between -z-10">
            <div className="w-full border-t-2 border-dashed border-border/30" />
            <div className="w-full border-t-2 border-dashed border-border/30" />
            <div className="w-full border-t-2 border-dashed border-border/30" />
          </div>

          <div className="mb-10 text-center relative z-10 flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Weekly Rhythm</h3>
            <p className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] bg-primary/10 px-4 py-1.5 rounded-full">Activity</p>
          </div>

          <div className="flex h-56 w-full items-end gap-3 sm:gap-6 relative z-10">
            {activity.map((value, idx) => {
              const heightStr = `${Math.max(10, (value / maxActivity) * 100)}%`;
              const isToday = idx === todayDayIndex;

              return (
                <div key={idx} className="group relative flex flex-1 flex-col items-center gap-4 h-full justify-end">
                  <div className="absolute top-0 bottom-10 border-l-2 border-dashed border-border/30 -z-10" />

                  <span className="text-[12px] font-black text-foreground opacity-0 transition-opacity group-hover:opacity-100 mb-2 z-10 bg-background/80 px-2 py-1 rounded-md backdrop-blur-sm border border-border/50">
                    {value}
                  </span>
                  
                  <div
                    className={`relative w-8 sm:w-12 rounded-t-[12px] transition-all duration-700 ease-out z-10 overflow-hidden ${
                      isToday 
                        ? "shadow-[0_0_30px_rgba(var(--color-primary),0.4)]" 
                        : "hover:brightness-125"
                    }`}
                    style={{ height: heightStr }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-t ${isToday ? 'from-primary/20 to-primary' : 'from-primary/5 to-primary/40'}`} />
                    {isToday && (
                      <div className="absolute top-0 inset-x-0 h-2 bg-white/40 shadow-[0_0_10px_#fff]" />
                    )}
                  </div>

                  <span
                    className={`text-[12px] md:text-[14px] font-black uppercase tracking-widest ${
                      isToday ? "text-primary scale-110 shadow-primary/20" : "text-muted-foreground/60"
                    } transition-transform`}
                  >
                    {DAY_LABELS[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* MIDDLE TABLE: Learned Words (Limited view) */}
        <LearnedWordsTable limit={8} />

        {/* BOTTOM: Minimal Radial Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
          <CircularChart 
            value={stats?.today_completed ?? 0} 
            max={user.daily_word_count} 
            label="Daily Goal" 
            centerText={`${stats?.today_completed ?? 0}/${user.daily_word_count}`}
            colorClass="text-primary"
          />

          <CircularChart 
            value={stats?.accuracy_rate ?? 0} 
            max={100} 
            label="Accuracy" 
            centerText={`${Math.round(stats?.accuracy_rate ?? 0)}%`}
            colorClass="text-amber-500"
          />

          <CircularChart 
            value={activity.filter(v => v > 0).length} 
            max={7} 
            label="Weekly Flow" 
            centerText={`${activity.filter(v => v > 0).length}/7`}
            colorClass="text-emerald-500"
          />
        </div>

      </div>
    </div>
  );
}

function CircularChart({ value, max, label, centerText, colorClass }: { value: number; max: number; label: string; centerText: string; colorClass: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(Math.max(value / safeMax, 0), 1);
  const strokeDashoffset = circumference - percent * circumference;

  return (
    <div className="rounded-[28px] border border-border/60 bg-transparent p-6 flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        
        <svg className="w-24 h-24 sm:w-28 sm:h-28 transform -rotate-90">
          {/* Background Track */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            className="text-border/40"
          />
          {/* Progress Path */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
            style={{ strokeDasharray: circumference, strokeDashoffset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{centerText}</span>
        </div>
      </div>
      <p className="text-[11px] sm:text-[12px] font-bold text-muted-foreground uppercase tracking-[0.1em] text-center w-full">{label}</p>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
