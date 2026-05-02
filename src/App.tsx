import { useEffect, useMemo, useState } from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import * as api from "@/lib/tauri";
import { Sidebar } from "@/components/app/Sidebar";
import { navItems, type View } from "@/components/app/config";
import { FullScreenLoader } from "@/components/app/shared";
import { WelcomeSetup } from "@/components/app/views/WelcomeSetup";
import { DashboardView } from "@/components/app/views/DashboardView";
import { WordsView } from "@/components/app/views/WordsView";
import { ChatView } from "@/components/app/views/chat";
import { QuizView } from "@/components/app/views/QuizView";
import { SettingsView } from "@/components/app/views/settings";
import type { DashboardStats } from "@/types";
import { useChatStore } from "@/store/chatStore";
import { useQuizStore } from "@/store/quizStore";
import { useUserStore } from "@/store/userStore";
import { useWordsStore } from "@/store/wordsStore";

const FRAMELESS_VIEWS: View[] = ["chat", "dashboard", "words", "quiz", "settings"];

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [popupInterval, setPopupInterval] = useState(1);

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
    <div className="flex h-full bg-background p-0 text-foreground md:p-2">
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
        onRenameSession={(id, currentTitle) => {
          const title = window.prompt("Rename chat", currentTitle);
          if (!title?.trim()) return;
          void renameSession(id, title.trim());
        }}
        onDeleteSession={(id) => {
          const confirmed = window.confirm("Delete this chat?");
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
        {!isChatView && (
          <header className="px-5 py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsSidebarCollapsed((value) => !value)}
                className="hidden rounded-xl p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground md:flex"
                title="Toggle sidebar"
              >
                <PanelLeft size={15} />
              </button>
              <h2 className="text-[15px] font-medium capitalize tracking-tight">{activeView}</h2>
            </div>
          </header>
        )}

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
              onClearHistory={() => {
                const confirmed = window.confirm("Clear all messages in this chat?");
                if (!confirmed) return;
                void clearHistory();
              }}
              onDeleteSession={() => {
                const confirmed = window.confirm("Delete this chat?");
                if (!confirmed) return;
                void deleteSession(sessionId!);
              }}
              onCancel={cancelRequest}
            />
          )}

          {activeView === "quiz" && (
            <QuizView
              questions={questions}
              currentIndex={currentIndex}
              answersCount={answers.length}
              isOpen={isOpen}
              loading={quizLoading}
              submitting={submitting}
              onStart={(single) => void startQuiz(single)}
              onSubmit={(answer) => submitAnswer(answer)}
              onNext={nextQuestion}
              onClose={closeQuiz}
            />
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
  );
}
