import { memo } from 'react';
import { ArrowRight, Lightbulb } from "lucide-react";

export const QuickPromptButton = memo(({ prompt, onClick }: { prompt: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 w-full p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-muted/50 hover:border-border transition-all text-left group"
  >
    <div className="bg-primary/10 p-2 rounded-lg text-primary">
      <Lightbulb size={16} />
    </div>
    <span className="text-[13px] text-foreground/80 font-medium group-hover:text-foreground transition-colors flex-1">
      {prompt}
    </span>
    <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
  </button>
));

QuickPromptButton.displayName = "QuickPromptButton";
