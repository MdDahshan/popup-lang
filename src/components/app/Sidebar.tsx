import type { LucideIcon } from "lucide-react";
import { Moon, Pencil, Plus, Sparkles, Sun, Trash2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, type View } from "./config";
import { useContextMenu } from "./ContextMenuContext";

type Session = {
  id: number;
  title: string | null;
  updated_at: string;
  message_count: number;
};

export function Sidebar({
  isCollapsed,
  activeView,
  sessions,
  sessionId,
  completion,
  isDark,
  learnerLabel,
  onToggleTheme,
  onCreateSession,
  onSelectView,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
}: {
  isCollapsed: boolean;
  activeView: View;
  sessions: Session[];
  sessionId: number | null;
  completion: number;
  isDark: boolean;
  learnerLabel: string;
  onToggleTheme: () => void;
  onCreateSession: () => void;
  onSelectView: (view: View) => void;
  onSelectSession: (id: number) => void;
  onRenameSession: (id: number, currentTitle: string) => void;
  onDeleteSession: (id: number) => void;
}) {
  const { showMenu } = useContextMenu();

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col overflow-hidden transition-[width,opacity,margin] duration-300 ease-out",
        isCollapsed
          ? "w-0 -ml-2 opacity-0 pointer-events-none"
          : "mr-3 w-[256px] rounded-lg border border-[#2a2a2a] bg-background"
      )}
    >
      <div className="flex items-center px-4 pb-3 pt-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Sparkles size={14} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground/90">Popup Lang</span>
        </div>
      </div>

      <div className="px-3">
        <SidebarActionButton icon={Plus} label="New Chat" shortcut="⌘N" onClick={onCreateSession} />
        <div className="mt-3 border-t border-border/40" />
      </div>

      <nav className="mt-3 space-y-1 px-3">
        {[navItems[0], navItems[1], navItems[3], navItems[4]].map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                active ? "text-foreground font-medium [outline:1px_dashed_var(--primary)] [outline-offset:-1px]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={15} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 px-3 pb-2 pt-4">
        <div className="mb-2 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Chats</div>
          <div className="space-y-0.5 overflow-auto pr-1" role="listbox" aria-label="Chat sessions">
            {(() => {
              const visibleSessions = sessions.filter(s => s.message_count > 0 || s.id === sessionId);
              if (visibleSessions.length === 0) {
                return <div className="px-3 py-2 text-xs text-muted-foreground">No conversations yet</div>;
              }
              return visibleSessions.map((item) => {
                const isActive = sessionId === item.id;
                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={isActive}
                    onContextMenu={(e) => {
                      showMenu(e, [
                        {
                          id: "rename",
                          label: "Rename",
                          icon: <Pencil size={14} />,
                          onClick: () => onRenameSession(item.id, item.title || "New Chat")
                        },
                        {
                          id: "sep-1",
                          label: "",
                          separator: true,
                        },
                        {
                          id: "delete",
                          label: "Delete",
                          icon: <Trash2 size={14} />,
                          danger: true,
                          shortcut: "⌘⌫",
                          onClick: () => onDeleteSession(item.id)
                        }
                      ]);
                    }}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-muted"
                    )}
                  >
                    <button onClick={() => onSelectSession(item.id)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-left">
                      <span className={cn("line-clamp-1 text-[12.5px] font-medium leading-5 flex-1", isActive ? "text-foreground" : "text-foreground/80")}>
                        {item.title || "New Chat"}
                      </span>
                      <span className="text-[10px] leading-4 text-muted-foreground shrink-0">{formatSidebarTime(item.updated_at)}</span>
                    </button>
                    {isActive && (
                      <div className="size-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    <div className="hidden items-center gap-1 group-hover:flex">
                      <button onClick={() => onRenameSession(item.id, item.title || "New Chat")} className="rounded-md p-1 text-muted-foreground transition hover:bg-background/80 hover:text-foreground">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => onDeleteSession(item.id)} className="rounded-md p-1 text-destructive/70 transition hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            })()}
          </div>
      </div>

      <div className="p-3">
        <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <UserRound size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{learnerLabel}</p>
              <p className="truncate text-[11px] text-muted-foreground capitalize">{completion}% today</p>
            </div>
            <button onClick={onToggleTheme} className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarActionButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  shortcut: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-muted"
    >
      <Icon size={16} className="shrink-0" />
      <span className="truncate font-medium">{label}</span>
      <span className="ml-auto rounded border border-border/40 bg-background/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">{shortcut}</span>
    </button>
  );
}

function formatSidebarTime(value: string) {
  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
