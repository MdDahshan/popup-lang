import { useState, memo } from 'react';
import { Bot, UserRound, Copy, Sparkles } from "lucide-react";
import { cn, formatTime, getContentDirection } from "@/lib/utils";
import * as api from "@/lib/tauri";
import { MarkdownRenderer } from './MarkdownRenderer';
import { useContextMenu } from "@/components/app/ContextMenuContext";

export const MessageBubble = memo(({
  message,
  isLatest,
  onSendAnswer
}: {
  message: Awaited<ReturnType<typeof api.getChatMessages>>[number];
  isLatest?: boolean;
  onSendAnswer?: (ans: string) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { showMenu } = useContextMenu();

  return (
    <div 
      onContextMenu={(e) => {
        e.stopPropagation();
        showMenu(e, [
          {
            id: "copy-message",
            label: "Copy Message",
            icon: <Copy size={14} />,
            shortcut: "⌘C",
            onClick: handleCopy
          }
        ]);
      }}
      className="flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 zoom-in-[0.98] duration-300 ease-out"
    >
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Bot size={15} className="text-primary" />
        </div>
      )}

      <div className={cn("min-w-0 flex-1 flex flex-col", isUser ? "items-end" : "items-start")}>
        {isUser ? (
          message.content.startsWith("[[ANSWER]] ") ? (
            <div dir={getContentDirection(message.content)} className="flex items-center gap-2.5 max-w-[85%] rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-[15px] font-medium text-foreground shadow-sm animate-in fade-in zoom-in-95">
              <Sparkles size={16} className="text-primary shrink-0" />
              <span>{message.content.replace("[[ANSWER]] ", "")}</span>
            </div>
          ) : (
            <div 
              dir={getContentDirection(message.content)}
              className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ring-1 ring-border/50 text-foreground"
            >
              {message.content}
            </div>
          )
        ) : (
          <div 
            dir={getContentDirection(message.content)}
            className="text-[15px] leading-relaxed w-full max-w-none break-words"
          >
            <MarkdownRenderer content={message.content} isLatest={isLatest} onSendAnswer={onSendAnswer} />
          </div>
        )}

        <div className={cn("mt-1.5 flex items-center gap-2 text-xs text-muted-foreground", isUser && "justify-end", getContentDirection(message.content) === 'rtl' ? "flex-row-reverse" : "flex-row")}>
          <span>{formatTime(message.created_at)}</span>
          <button
            onClick={handleCopy}
            className={cn("rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground", copied && "text-primary bg-primary/10")}
            aria-label="Copy message"
            title="Copy message"
          >
            {copied ? <span className="text-[10px] font-bold tracking-widest px-0.5">COPIED</span> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card">
          <UserRound size={14} className="text-foreground/70" />
        </div>
      )}
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";
