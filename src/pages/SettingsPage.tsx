import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { getApiKey, saveApiKey } from "@/lib/tauri";
import { SUPPORTED_LANGUAGES } from "@/types";
import type { User } from "@/types";
import {
  Settings,
  Key,
  Globe,
  Target,
  Hash,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

export function SettingsPage() {
  const { user, saveUser } = useUserStore();

  const [apiKey, setApiKeyValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nativeLang, setNativeLang] = useState(user?.native_language || "");
  const [targetLang, setTargetLang] = useState(user?.target_language || "");
  const [level, setLevel] = useState(user?.level || "beginner");
  const [wordCount, setWordCount] = useState(user?.daily_word_count || 5);
  const [reminderInterval, setReminderInterval] = useState("60");

  useEffect(() => {
    getApiKey().then((key) => {
      if (key) setApiKeyValue(key);
    });
    import("@/lib/tauri").then(({ getSetting }) => {
      getSetting("reminder_interval").then((val) => {
        if (val) setReminderInterval(val);
      });
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);

    try {
      await saveApiKey(apiKey);
      const { setSetting } = await import("@/lib/tauri");
      await setSetting("reminder_interval", reminderInterval);
      const updatedUser: User = {
        ...user,
        native_language: nativeLang,
        target_language: targetLang,
        level: level as "beginner" | "intermediate" | "advanced",
        daily_word_count: wordCount,
      };
      await saveUser(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-surface-700/50 flex items-center justify-center">
          <Settings className="w-5 h-5 text-surface-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-surface-400">Configure your learning preferences</p>
        </div>
      </div>

      <div className="space-y-6 stagger-children">
        {/* API Key */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-primary-400" />
            <h3 className="font-semibold text-white">Groq API Key</h3>
          </div>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKeyValue(e.target.value)}
              placeholder="gsk_..."
              className="w-full pl-4 pr-12 py-3 rounded-xl bg-surface-800/60 border border-surface-700/50 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Languages */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-accent-400" />
            <h3 className="font-semibold text-white">Languages</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-surface-400 mb-1.5 block">Native Language</label>
              <select
                value={nativeLang}
                onChange={(e) => setNativeLang(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-surface-400 mb-1.5 block">Learning</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Level */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-success-400" />
            <h3 className="font-semibold text-white">Level</h3>
          </div>
          <div className="flex gap-2">
            {(["beginner", "intermediate", "advanced"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                  level === l
                    ? "gradient-primary text-white"
                    : "bg-surface-800/40 text-surface-400 hover:text-white hover:bg-surface-700/40"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Word Count */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-warning-400" />
            <h3 className="font-semibold text-white">Daily Words</h3>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={3}
              max={20}
              value={wordCount}
              onChange={(e) => setWordCount(parseInt(e.target.value))}
              className="flex-1 accent-primary-500"
            />
            <span className="w-10 text-center text-xl font-bold text-white">{wordCount}</span>
          </div>
          <p className="text-xs text-surface-500 mt-2">Minimum 3, maximum 20 words per day</p>
        </div>

        {/* Reminder Settings */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-accent-400" />
            <h3 className="font-semibold text-white">Background Reminders</h3>
          </div>
          
          <div className="mb-4">
            <label className="text-xs text-surface-400 mb-1.5 block">Popup Quiz Interval</label>
            <select
              value={reminderInterval}
              onChange={(e) => setReminderInterval(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/50 text-white text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="1">Every 1 Minute (Test Mode)</option>
              <option value="30">Every 30 Minutes</option>
              <option value="60">Every 1 Hour</option>
              <option value="120">Every 2 Hours</option>
              <option value="240">Every 4 Hours</option>
            </select>
          </div>

          <button
            onClick={() => {
              import("@tauri-apps/api/core").then(({ invoke }) => {
                invoke("show_popup_window");
              });
            }}
            className="w-full py-2.5 rounded-xl border border-primary-500/30 text-primary-400 font-medium hover:bg-primary-500/10 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Target className="w-4 h-4" /> Trigger Test Popup Now
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            saved
              ? "bg-success-500/15 text-success-400 border border-success-500/20"
              : "gradient-primary text-white hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
          }`}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-5 h-5" /> Settings Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
