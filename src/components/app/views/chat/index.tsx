import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Menu, Settings, DatabaseBackup, Loader2, PlayCircle, LogOut, ArrowRight, ShieldAlert, FileText, Swords, Sparkles, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import * as api from "@/lib/tauri";
import { MessageBubble } from "./MessageBubble";
import { QuickPromptButton } from "./QuickPrompts";

const MAX_CHARS = 2000;

export function ChatView({
  title,
  messages,
  loading,
  error: storeError,
  targetLanguage,
  onToggleSidebar,
  onSend,
  onRetry,
  onClearHistory,
  onDeleteSession,
  onCancel,
}: {
  title: string;
  messages: Awaited<ReturnType<typeof api.getChatMessages>>;
  loading: boolean;
  error: string | null;
  targetLanguage: string | null;
  onToggleSidebar: () => void;
  onSend: (content: string) => Promise<void>;
  onRetry: () => Promise<void>;
  onClearHistory?: () => void;
  onDeleteSession?: () => void;
  onCancel?: () => void;
}) {
  const [input, setInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const langMatch = targetLanguage ? targetLanguage.toLowerCase() : "a new language";
  const isArabic = langMatch.includes("ar");

  const isQuestionMode = useMemo(() => {
    if (messages.length === 0) return false;
    const lastMsg = messages[messages.length - 1];
    return lastMsg.role === "assistant" && (lastMsg.content.includes("```input") || lastMsg.content.includes("```mcq") || lastMsg.content.includes("```matching"));
  }, [messages]);

  const quickPrompts = useMemo(() => [
    `Explain the difference between two similar words in ${targetLanguage || "this language"}`,
    "Give me 5 example sentences using common idioms",
    "How to conjugate the most common irregular verbs?",
    "Test my vocabulary with a short multiple choice quiz"
  ], [targetLanguage]);

  const sendCurrentMessage = async () => {
    if (!input.trim() || loading) return;
    if (input.length > MAX_CHARS) {
      setLocalError(`Maximum ${MAX_CHARS} characters allowed`);
      return;
    }
    setLocalError(null);
    let value = input;
    if (isQuestionMode) {
      value = `[[ANSWER]] ${value}`;
    }
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    try {
      await onSend(value);
    } catch {
      setLocalError("Failed to send message. Please try again.");
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length, loading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 50;
    setShowScrollBottom(!isAtBottom);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, typeof messages>();
    messages.forEach((m) => {
      const d = new Date(m.created_at).toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      });
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(m);
    });
    return Array.from(map.entries()).map(([date, msgs]) => ({ date, msgs }));
  }, [messages]);

  return (
    <div className="flex h-full w-full flex-col bg-background/95 relative animate-in fade-in duration-300">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card/40 px-4 backdrop-blur-md sticky top-0 z-10 transition-colors">
        <button
          onClick={onToggleSidebar}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted md:hidden"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>
        
        <div className="flex flex-col flex-1 min-w-0">
          <h2 className={cn(
            "text-[15px] font-semibold tracking-tight text-foreground truncate",
            isArabic && "font-arabic rtl"
          )}>
            {title}
          </h2>
          {targetLanguage && (
            <p className="text-[11px] font-medium text-muted-foreground capitalize flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse"></span>
              {targetLanguage}
            </p>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Chat options"
          >
            <Settings size={16} />
          </button>
          
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-card p-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b mb-1">
                  <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Chat Options</p>
                </div>
                
                <button 
                  onClick={() => { setMenuOpen(false); /* Export Logic */ }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-foreground/90 rounded-md hover:bg-muted transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  <FileText size={15} /> Export Chat
                </button>
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    onClearHistory?.();
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-foreground/90 rounded-md hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                >
                  <DatabaseBackup size={15} /> Clear History
                </button>
                <div className="h-px bg-border my-1" />
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteSession?.();
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={15} /> Delete Session
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6 custom-scrollbar"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-8 pb-4">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 pb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-primary/5 p-4 rounded-full mb-5 ring-1 ring-primary/10">
                <Bot size={40} className="text-primary/80" />
              </div>
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 mb-2">
                Start a New Lesson
              </h3>
              <p className="max-w-xs text-sm text-muted-foreground/80 mb-8 leading-relaxed">
                Choose a prompt below to kick off your conversation, or type your own question below.
              </p>
              
              <div className="w-full max-w-md space-y-2.5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-backwards">
                {quickPrompts.map((prompt, i) => (
                  <QuickPromptButton key={i} prompt={prompt} onClick={() => handleQuickPrompt(prompt)} />
                ))}
              </div>
            </div>
          ) : (
            groups.map((group, groupIdx) => (
              <div key={group.date} className="flex flex-col gap-6 relative">
                <div className="sticky top-0 z-10 flex justify-center pb-2">
                  <span className="rounded-full border bg-background/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                    {group.date}
                  </span>
                </div>
                {group.msgs.map((message: any, idx: number) => {
                  const isLatestMsg = groupIdx === groups.length - 1 && idx === group.msgs.length - 1;
                  return (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      isLatest={isLatestMsg}
                      onSendAnswer={async (ans) => {
                        try { await onSend(ans); } catch { setLocalError("Failed to send answer"); }
                      }}
                    />
                  );
                })}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Bot size={15} className="text-primary" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-card border px-4 py-3 min-w-[60px] shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}

          {(storeError || localError) && (
            <div className="flex flex-col items-center gap-3 my-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex gap-3 w-full max-w-[85%] mx-auto items-start p-3.5 rounded-xl border-l-4 border-l-destructive bg-destructive/5 text-destructive/90 text-[14px]">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                <div className="flex flex-col gap-2">
                  <span className="font-medium">{storeError || localError}</span>
                  {storeError && (
                    <button 
                      onClick={onRetry}
                      className="w-fit text-xs font-semibold uppercase tracking-wider bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-1.5 rounded transition-colors"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-px w-full" />
        </div>
      </div>

      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 flex size-10 items-center justify-center rounded-full border bg-card/80 text-foreground shadow-xl backdrop-blur-sm transition-all hover:bg-muted"
        >
          ↓
        </button>
      )}

      <div className="px-4 pb-4 pt-1 bg-gradient-to-t from-background via-background to-transparent z-10 w-full relative">
        <div className="mx-auto max-w-3xl relative">
          {isQuestionMode && (
            <div className="absolute -top-3.5 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-widest z-20">
              <Sparkles size={12} className="opacity-90" />
              Quiz Mode
            </div>
          )}
          <div className={cn(
            "flex flex-col gap-2 rounded-3xl border bg-card px-4 py-3 shadow-sm transition-shadow focus-within:ring-1",
            input.length > MAX_CHARS - 100 
              ? "border-amber-500/40 focus-within:border-amber-500/60 focus-within:ring-amber-500/20" 
              : isQuestionMode 
                ? "border-primary/40 focus-within:border-primary/60 focus-within:ring-primary/20 bg-primary/[0.02]"
                : "border-border focus-within:border-primary/40 focus-within:ring-primary/20"
          )}>
            <textarea
              ref={textareaRef}
              value={input}
              autoFocus
              aria-label="Chat message input"
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                setLocalError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendCurrentMessage();
                }
              }}
              rows={1}
              placeholder={isQuestionMode ? "Type your answer..." : "Ask me anything..."}
              className="max-h-[200px] min-h-[1.5rem] w-full resize-none overflow-auto bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70 mt-0.5"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-medium transition-colors select-none",
                  input.length > MAX_CHARS - 100 ? "text-amber-500 font-bold" : "text-muted-foreground/50",
                  input.length > MAX_CHARS && "text-red-500"
                )}>
                  {input.length}/{MAX_CHARS}
                </span>
                {isQuestionMode && (
                  <span className="text-[10px] text-primary/70 animate-pulse hidden sm:inline">
                    Interactive Context Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {loading && onCancel && (
                   <button
                    onClick={onCancel}
                    className="flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-transform hover:scale-105"
                    title="Stop Generating"
                    aria-label="Cancel Response"
                  >
                    <div className="w-2.5 h-2.5 bg-current rounded-[2px]" />
                  </button>
                )}
                <button
                  onClick={sendCurrentMessage}
                  disabled={!input.trim() || loading || input.length > MAX_CHARS}
                  className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground disabled:opacity-50 disabled:hover:bg-primary/10 disabled:hover:text-primary"
                  title="Send message (Enter)"
                  aria-label="Send Message"
                >
                  <Send size={15} className="ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
