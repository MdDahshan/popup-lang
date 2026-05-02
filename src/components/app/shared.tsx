import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="surface rounded-3xl px-6 py-5">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin" size={18} />
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-secondary/80 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold capitalize">{value}</p>
    </div>
  );
}
