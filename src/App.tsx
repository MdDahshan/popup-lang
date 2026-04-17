import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { HomePage } from "@/pages/HomePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { WordDetailPage } from "@/pages/WordDetailPage";
import { PopupQuizPage } from "@/pages/PopupQuizPage";
import { useUserStore } from "@/store/userStore";
import "./index.css";

function AppRouter() {
  const { user, fetchUser, loading } = useUserStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchUser().finally(() => setInitialized(true));
  }, [fetchUser]);

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-surface-950">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <p className="text-surface-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Intercept popup route before enforcing onboarding
  return (
    <Routes>
      <Route path="/popup" element={<PopupQuizPage />} />
      {user ? (
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/word/:id" element={<WordDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      ) : (
        <Route path="*" element={<OnboardingPage />} />
      )}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <AppRouter />
    </HashRouter>
  );
}

export default App;
