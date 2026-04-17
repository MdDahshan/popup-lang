import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/tauri";
import type { DashboardStats } from "@/types";
import {
  BarChart3,
  Flame,
  Target,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-warning-400 mx-auto mb-3" />
          <p className="text-surface-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxActivity = Math.max(...stats.weekly_activity, 1);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-surface-400">Your learning progress</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8 stagger-children">
        {[
          {
            icon: BookOpen,
            label: "Words Learned",
            value: stats.total_words_learned,
            color: "primary",
            gradient: "gradient-primary",
          },
          {
            icon: Target,
            label: "Accuracy",
            value: `${Math.round(stats.accuracy_rate)}%`,
            color: "accent",
            gradient: "bg-gradient-to-br from-accent-500 to-primary-500",
          },
          {
            icon: Flame,
            label: "Streak",
            value: `${stats.streak_count} days`,
            color: "warning",
            gradient: "bg-gradient-to-br from-orange-500 to-red-500",
          },
          {
            icon: TrendingUp,
            label: "Today",
            value: `${stats.today_completed}/${stats.today_total}`,
            color: "success",
            gradient: "gradient-success",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-2xl p-5 hover-lift"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.gradient} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-surface-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Activity */}
      <div className="glass rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <h3 className="font-semibold text-white mb-4">Weekly Activity</h3>
        <div className="flex items-end gap-3 h-40">
          {stats.weekly_activity.map((count, i) => {
            const height = maxActivity > 0 ? (count / maxActivity) * 100 : 0;
            const today = new Date().getDay();
            const dayIndex = (today + i - 6 + 7) % 7;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-surface-400">{count}</span>
                <div className="w-full rounded-t-lg relative" style={{ height: "100%", minHeight: 8 }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-lg transition-all duration-700 ${
                      i === 6 ? "gradient-primary" : "bg-surface-700/60"
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                </div>
                <span className={`text-xs ${i === 6 ? "text-primary-400" : "text-surface-500"}`}>
                  {dayLabels[dayIndex]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hardest Words */}
      {stats.hardest_words.length > 0 && (
        <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning-400" />
            Words to Review
          </h3>
          <div className="space-y-2">
            {stats.hardest_words.map((word) => (
              <div
                key={word.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-800/30"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white">{word.word_text}</span>
                  <span className="text-sm text-surface-400">{word.translation}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs bg-warning-500/15 text-warning-400">
                  needs review
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.total_words_learned === 0 && (
        <div className="glass rounded-2xl p-12 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-surface-800/60 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-surface-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No data yet</h3>
          <p className="text-surface-400 text-sm">
            Generate your first set of daily words and complete a quiz to see your stats here.
          </p>
        </div>
      )}
    </div>
  );
}
