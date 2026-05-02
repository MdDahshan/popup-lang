import { useEffect, useMemo, useState } from "react";
import { PanelLeft, Settings, DatabaseBackup, LogOut, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import * as api from "@/lib/tauri";
import { Titlebar } from "@/components/app/Titlebar";
import { Sidebar } from "@/components/app/Sidebar";
import { navItems, type View } from "@/components/app/config";
import { FullScreenLoader } from "@/components/app/shared";
import { WelcomeSetup } from "@/components/app/views/WelcomeSetup";
import { DashboardView } from "@/components/app/views/dashboard";
import { WordsView } from "@/components/app/views/words";
import { ChatView } from "@/components/app/views/chat";
import { LetterCanvas } from "@/components/app/views/letters";
import { SettingsView } from "@/components/app/views/settings";
import type { DashboardStats } from "@/types";
import { useChatStore } from "@/store/chatStore";
// Quiz store kept for popup quiz system, not used in LetterCanvas view
import { useQuizStore } from "@/store/quizStore";
import { useUserStore } from "@/store/userStore";
import { useWordsStore } from "@/store/wordsStore";
import { useDialog } from "@/components/app/DialogContext";

const FRAMELESS_VIEWS: View[] = ["chat", "dashboard", "words", "quiz", "settings"];

export default function App() {
  const { confirm, prompt } = useDialog();
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [popupInterval, setPopupInterval] = useState(1);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);

  const { user, fetchUser, saveUser, loading: userLoading } = useUserStore();
  const {
    dailyWords,
    fetchDailyWords,
    generateDailyWords,
    generating,
    loading: wordsLoading,
    markLearned,
  } = useWordsStore();
  const {
    messages,
    sessions,
    sessionId,
    error: chatError,
    fetchMessages,
    createSession,
    selectSession,
    renameSession,
    deleteSession,
    sendMessage,
    retryLastMessage,
    clearHistory,
    cancelRequest,
    loading: chatLoading,
  } = useChatStore();
  const {
    questions,
    currentIndex,
    answers,
    isOpen,
    startQuiz,
    submitAnswer,
    nextQuestion,
    closeQuiz,
    loading: quizLoading,
    submitting,
  } = useQuizStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const loadAll = async () => {
    await fetchUser();
    await Promise.allSettled([fetchDailyWords(), fetchMessages()]);

    setStatsLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }

    try {
      const savedKey = await api.getApiKey();
      setApiKey(savedKey ?? "");
    } catch {
      setApiKey("");
    }

    try {
      const savedInterval = await api.getSetting("popup_interval");
      if (savedInterval) {
        setPopupInterval(parseInt(savedInterval, 10) || 1);
      }
    } catch {
      setPopupInterval(1);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  // Refresh dynamic data when switching to relevant views so the user sees real-time progress
  useEffect(() => {
    if (activeView === "dashboard") {
      void (async () => {
        try {
          const data = await api.getDashboardStats();
          setStats(data);
        } catch {
          // ignore error
        }
      })();
    } else if (activeView === "words") {
      void fetchDailyWords();
    }
  }, [activeView, fetchDailyWords]);

  const completion = useMemo(() => {
    if (!stats || stats.today_total === 0) return 0;
    return Math.round((stats.today_completed / stats.today_total) * 100);
  }, [stats]);

  const isChatView = activeView === "chat";
  const isFramelessView = FRAMELESS_VIEWS.includes(activeView);
  const currentChatSession = useMemo(
    () => sessions.find((session) => session.id === sessionId) ?? null,
    [sessions, sessionId]
  );

  if (userLoading && !user) {
    return <FullScreenLoader label="Loading your learning space..." />;
  }

  if (!user) {
    return (
      <WelcomeSetup
        isDark={isDark}
        onToggleTheme={() => setIsDark((value) => !value)}
        onSaved={async (form) => {
          const now = new Date().toISOString();
          await saveUser({
            id: 0,
            native_language: form.native_language,
            target_language: form.target_language,
            level: form.level,
            daily_word_count: form.daily_word_count,
            reminder_enabled: form.reminder_enabled,
            interests: form.interests
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            created_at: now,
            updated_at: now,
          });
          await loadAll();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden rounded-[var(--radius)] border border-border/20 shadow-2xl">
      <Titlebar />
      <div className="flex flex-1 min-h-0 p-0 md:p-2 gap-2">
        <Sidebar
        isCollapsed={isSidebarCollapsed}
        activeView={activeView}
        sessions={sessions}
        sessionId={sessionId}
        completion={completion}
        isDark={isDark}
        learnerLabel={`${user.target_language.toUpperCase()} learner`}
        onToggleTheme={() => setIsDark((value) => !value)}
        onCreateSession={() => {
          setActiveView("chat");
          void createSession();
        }}
        onSelectView={setActiveView}
        onSelectSession={(id) => {
          setActiveView("chat");
          void selectSession(id);
        }}
        onRenameSession={async (id, currentTitle) => {
          const title = await prompt({ title: "Rename chat", defaultValue: currentTitle });
          if (!title?.trim()) return;
          void renameSession(id, title.trim());
        }}
        onDeleteSession={async (id) => {
          const confirmed = await confirm({ title: "Delete this chat?", danger: true });
          if (!confirmed) return;
          void deleteSession(id);
        }}
      />

      <main
        className={cn(
          "flex min-w-0 flex-1 flex-col overflow-hidden transition-[border-radius,box-shadow] duration-300 ease-out",
          isFramelessView
            ? "bg-background"
            : "md:rounded-[24px] md:border md:border-border/70 md:bg-card md:shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
        )}
      >
        <header className="px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarCollapsed((value) => !value)}
                className="flex items-center justify-center rounded-xl p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                title="Toggle sidebar"
              >
                <PanelLeft size={16} className={cn("transition-transform", isSidebarCollapsed && "rotate-180")} />
              </button>
              <div className="h-4 w-px bg-border/40 mx-1 hidden md:block" />
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground/90">
                {activeView === "chat" ? (currentChatSession?.title || "New Chat") : (navItems.find((n) => n.id === activeView)?.label ?? activeView)}
              </h2>
            </div>

            {activeView === "chat" && (
              <div className="relative">
                <button
                  onClick={() => setChatMenuOpen(!chatMenuOpen)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                  aria-label="Chat options"
                >
                  <Settings size={18} />
                </button>
                
                {chatMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setChatMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-card p-1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-3 py-2 border-b mb-1">
                        <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Chat Options</p>
                      </div>
                      
                      <button 
                        className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-foreground/90 rounded-md hover:bg-muted transition-colors opacity-50 cursor-not-allowed"
                        disabled
                      >
                        <FileText size={15} /> Export Chat
                      </button>
                      <button 
                        onClick={async () => {
                          setChatMenuOpen(false);
                          const confirmed = await confirm({ title: "Clear all messages in this chat?", danger: true });
                          if (!confirmed) return;
                          void clearHistory();
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-foreground/90 rounded-md hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                      >
                        <DatabaseBackup size={15} /> Clear History
                      </button>
                      <div className="h-px bg-border my-1" />
                      <button 
                        onClick={async () => {
                          setChatMenuOpen(false);
                          const confirmed = await confirm({ title: "Delete this chat session?", danger: true });
                          if (!confirmed) return;
                          if (sessionId) void deleteSession(sessionId);
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={15} /> Delete Session
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        <section className={cn("min-h-0 flex-1 overflow-auto", isFramelessView ? "p-0" : "p-4 md:p-5")}>
          {activeView === "dashboard" && (
            <DashboardView
              user={user}
              stats={stats}
              statsLoading={statsLoading}
              wordsCount={dailyWords.length}
              generating={generating}
              onGenerate={() => void generateDailyWords(false)}
            />
          )}

          {activeView === "words" && (
            <WordsView
              loading={wordsLoading}
              dailyWords={dailyWords}
              generating={generating}
              onGenerate={() => void generateDailyWords(true)}
              onMarkLearned={(id) => void markLearned(id)}
              onAskAi={(wordId) => {
                const target = dailyWords.find((entry) => entry.word.id === wordId);
                if (!target) return;
                setActiveView("chat");
                void sendMessage(`Explain the word \"${target.word.word_text}\" with pronunciation, meaning, examples, and a quick memory trick.`);
              }}
            />
          )}

          {activeView === "chat" && (
            <ChatView
              title={currentChatSession?.title || "New Chat"}
              messages={messages}
              loading={chatLoading}
              error={chatError}
              targetLanguage={user.target_language}
              onToggleSidebar={() => setIsSidebarCollapsed((value) => !value)}
              onSend={(value: string) => sendMessage(value)}
              onRetry={() => retryLastMessage()}
              onClearHistory={async () => {
                const confirmed = await confirm({ title: "Clear all messages in this chat?", danger: true });
                if (!confirmed) return;
                void clearHistory();
              }}
              onDeleteSession={async () => {
                const confirmed = await confirm({ title: "Delete this chat?", danger: true });
                if (!confirmed) return;
                void deleteSession(sessionId!);
              }}
              onCancel={cancelRequest}
            />
          )}

          {activeView === "quiz" && (
            <LetterCanvas targetLanguage={user.target_language} nativeLanguage={user.native_language} />
          )}

          {activeView === "settings" && (
            <SettingsView
              user={user}
              apiKey={apiKey}
              apiKeySaved={apiKeySaved}
              savingApiKey={savingApiKey}
              onChangeApiKey={(value) => {
                setApiKey(value);
                setApiKeySaved(false);
              }}
              onSaveApiKey={async () => {
                setSavingApiKey(true);
                try {
                  await api.saveApiKey(apiKey);
                  setApiKeySaved(true);
                } finally {
                  setSavingApiKey(false);
                }
              }}
              onThemeToggle={() => setIsDark((value) => !value)}
              isDark={isDark}
              popupInterval={popupInterval}
              isSidebarCollapsed={isSidebarCollapsed}
              onSaveSettings={async (updatedUser, interval) => {
                await saveUser(updatedUser);
                await api.setSetting("popup_interval", interval.toString());
                setPopupInterval(interval);
              }}
            />
          )}
        </section>
      </main>
      </div>
    </div>
  );
}
