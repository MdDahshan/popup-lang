import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { saveApiKey } from "@/lib/tauri";
import { SUPPORTED_LANGUAGES, INTERESTS, type User } from "@/types";
import {
  GraduationCap,
  Globe,
  Target,
  Sparkles,
  Hash,
  Heart,
  Key,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const STEPS = [
  { icon: Sparkles, title: "Welcome" },
  { icon: Globe, title: "Languages" },
  { icon: Target, title: "Level" },
  { icon: Hash, title: "Daily Words" },
  { icon: Heart, title: "Interests" },
  { icon: Key, title: "API Key" },
  { icon: Check, title: "Ready" },
];

export function OnboardingPage() {
  const { saveUser } = useUserStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [nativeLang, setNativeLang] = useState("");
  const [targetLang, setTargetLang] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [wordCount, setWordCount] = useState(5);
  const [interests, setInterests] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return nativeLang !== "" && targetLang !== "" && nativeLang !== targetLang;
      case 2: return true;
      case 3: return wordCount >= 3;
      case 4: return true;
      case 5: return apiKey.trim().length > 10;
      case 6: return true;
      default: return false;
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      await saveApiKey(apiKey.trim());

      const user: User = {
        id: 0,
        native_language: nativeLang,
        target_language: targetLang,
        level,
        daily_word_count: wordCount,
        reminder_enabled: true,
        interests,
        created_at: "",
        updated_at: "",
      };
      await saveUser(user);
      window.location.reload();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  const next = () => {
    if (step === 6) {
      handleFinish();
    } else {
      setStep((s) => Math.min(s + 1, 6));
    }
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-surface-950 p-6">
      <div className="w-full max-w-xl animate-fade-in">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "gradient-primary" : "bg-surface-800"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 min-h-[420px] flex flex-col">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-slide-up">
              <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center animate-pulse-glow">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-3">PopupLang</h1>
                <p className="text-surface-400 text-lg leading-relaxed max-w-md">
                  Learn new vocabulary every day with AI-powered explanations, 
                  quick quizzes, and smart progress tracking.
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Languages */}
          {step === 1 && (
            <div className="flex-1 flex flex-col gap-6 animate-slide-up">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Choose your languages</h2>
                <p className="text-surface-400">Select your native language and what you want to learn</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-surface-300 mb-2 block">I speak</label>
                  <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={`n-${lang.code}`}
                        onClick={() => setNativeLang(lang.code)}
                        className={`flex flex-col items-center p-2.5 rounded-xl transition-all duration-200 text-xs ${
                          nativeLang === lang.code
                            ? "bg-primary-500/20 border border-primary-500/50 text-primary-300"
                            : "bg-surface-800/50 border border-transparent text-surface-300 hover:bg-surface-700/50"
                        }`}
                      >
                        <span className="text-lg mb-1">{lang.flag}</span>
                        <span className="truncate w-full text-center">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-surface-300 mb-2 block">I want to learn</label>
                  <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {SUPPORTED_LANGUAGES.filter((l) => l.code !== nativeLang).map((lang) => (
                      <button
                        key={`t-${lang.code}`}
                        onClick={() => setTargetLang(lang.code)}
                        className={`flex flex-col items-center p-2.5 rounded-xl transition-all duration-200 text-xs ${
                          targetLang === lang.code
                            ? "bg-accent-500/20 border border-accent-500/50 text-accent-300"
                            : "bg-surface-800/50 border border-transparent text-surface-300 hover:bg-surface-700/50"
                        }`}
                      >
                        <span className="text-lg mb-1">{lang.flag}</span>
                        <span className="truncate w-full text-center">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Level */}
          {step === 2 && (
            <div className="flex-1 flex flex-col gap-6 animate-slide-up">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Your current level</h2>
                <p className="text-surface-400">This helps us choose the right difficulty for you</p>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                {[
                  { value: "beginner" as const, emoji: "🌱", title: "Beginner", desc: "I'm just starting out" },
                  { value: "intermediate" as const, emoji: "🌿", title: "Intermediate", desc: "I know some basics" },
                  { value: "advanced" as const, emoji: "🌳", title: "Advanced", desc: "I want to refine my skills" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLevel(opt.value)}
                    className={`flex items-center gap-4 p-5 rounded-xl transition-all duration-200 text-left ${
                      level === opt.value
                        ? "bg-primary-500/15 border border-primary-500/40 shadow-lg shadow-primary-500/10"
                        : "bg-surface-800/40 border border-surface-700/30 hover:bg-surface-800/60"
                    }`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <div>
                      <p className="font-semibold text-white">{opt.title}</p>
                      <p className="text-sm text-surface-400">{opt.desc}</p>
                    </div>
                    {level === opt.value && (
                      <Check className="w-5 h-5 text-primary-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Word Count */}
          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-slide-up">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Daily word goal</h2>
                <p className="text-surface-400">How many new words per day? (minimum 3)</p>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => setWordCount((c) => Math.max(3, c - 1))}
                  className="w-12 h-12 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-xl text-white hover:bg-surface-700 transition-colors"
                >
                  −
                </button>
                <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
                  <span className="text-4xl font-bold text-white">{wordCount}</span>
                </div>
                <button
                  onClick={() => setWordCount((c) => Math.min(20, c + 1))}
                  className="w-12 h-12 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-xl text-white hover:bg-surface-700 transition-colors"
                >
                  +
                </button>
              </div>

              <input
                type="range"
                min={3}
                max={20}
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value))}
                className="w-full max-w-xs accent-primary-500"
              />
              <p className="text-surface-500 text-sm">
                {wordCount <= 5 ? "Great for building a habit" : wordCount <= 10 ? "Solid daily practice" : "Ambitious! Let's go!"}
              </p>
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div className="flex-1 flex flex-col gap-6 animate-slide-up">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Topics you enjoy</h2>
                <p className="text-surface-400">Pick topics to make vocabulary more relevant (optional)</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                      interests.includes(interest)
                        ? "gradient-primary text-white shadow-lg shadow-primary-500/20"
                        : "bg-surface-800/60 text-surface-300 border border-surface-700/50 hover:bg-surface-700/60"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              {interests.length > 0 && (
                <p className="text-center text-sm text-primary-400">
                  {interests.length} topic{interests.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* Step 5: API Key */}
          {step === 5 && (
            <div className="flex-1 flex flex-col gap-6 animate-slide-up">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Groq API Key</h2>
                <p className="text-surface-400">
                  AI powers the explanations and quizzes.{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener"
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    Get a free key
                  </a>
                </p>
              </div>

              <div className="space-y-3 mt-4">
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-surface-800/60 border border-surface-700/50 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>
                <p className="text-xs text-surface-500 text-center">
                  Your key is stored locally and never shared. It's only used to communicate with Groq.
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Ready */}
          {step === 6 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-slide-up">
              <div className="w-20 h-20 rounded-3xl gradient-success flex items-center justify-center animate-confetti">
                <Check className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">You're all set!</h2>
                <p className="text-surface-400 leading-relaxed max-w-sm">
                  Learning{" "}
                  <span className="text-accent-400 font-semibold">
                    {SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name}
                  </span>{" "}
                  with{" "}
                  <span className="text-primary-400 font-semibold">{wordCount} words/day</span>.
                  Let's build your first vocabulary set!
                </p>
              </div>
              {error && (
                <p className="text-error-400 text-sm bg-error-500/10 px-4 py-2 rounded-lg">{error}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-800/50">
            {step > 0 ? (
              <button
                onClick={prev}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800/50 transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={next}
              disabled={!canProceed() || saving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                canProceed() && !saving
                  ? "gradient-primary text-white hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
                  : "bg-surface-800 text-surface-500 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : step === 6 ? (
                <>Start Learning <Sparkles className="w-4 h-4" /></>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
