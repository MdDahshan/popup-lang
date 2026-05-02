import { CheckCircle2, MessageSquare } from "lucide-react";

export function LearnedButton({ 
  isLearned, 
  onClick, 
  disabled 
}: { 
  isLearned: boolean; 
  onClick: () => void; 
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLearned}
      className={`group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl py-2.5 text-[12px] font-bold transition-all duration-300 active:scale-[0.96] sm:rounded-2xl sm:py-3 sm:text-[13px] ${
        isLearned
          ? "bg-emerald-500/15 text-emerald-600 cursor-default ring-1 ring-emerald-500/20"
          : "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:brightness-110"
      }`}
    >
      {isLearned ? (
        <CheckCircle2 size={14} className="animate-in zoom-in duration-300" />
      ) : (
        <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      <span className="relative z-10">{isLearned ? "Mastered ✓" : "Mark as Learned"}</span>
    </button>
  );
}

export function ChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl border-2 border-border/60 bg-secondary/50 text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground active:scale-90 shadow-sm sm:h-[46px] sm:w-[46px] sm:rounded-2xl"
      title="Ask AI about this word"
      aria-label="Ask AI"
    >
      <MessageSquare size={16} className="transition-transform duration-300 group-hover:scale-110 sm:[&]:w-[19px] sm:[&]:h-[19px]" />
    </button>
  );
}
