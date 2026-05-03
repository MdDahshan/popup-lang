import { useState, useMemo, useEffect } from "react";
import type { User } from "@/types";
import { ChevronDown, ChevronRight, Palette, KeyRound, Globe2, GraduationCap, Zap, Heart, Check, Loader2, X, Bot } from "lucide-react";
import { getAvailableProviders, setPreferredProvider, type AgentDetection } from "@/lib/tauri";
import * as api from "@/lib/tauri";
// The core supported languages
const languages = [
  "Arabic", "English", "Spanish", "French", "German", 
  "Japanese", "Korean", "Italian", "Chinese", "Russian"
];

// Rebuilt clean custom select without depending on WelcomeSetup
function SettingsSelect({ value, options, onChange }: { value: string, options: string[], onChange: (val: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-border/60 bg-background/50 px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-3 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function AccordionItem({
  title, description, icon, isOpen, onToggle, children
}: {
  title: string; description: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`overflow-hidden rounded-3xl border transition-all duration-500 will-change-auto ${isOpen ? "border-primary/40 bg-secondary/30 shadow-sm" : "border-border/50 bg-transparent hover:border-border hover:bg-secondary/10"}`}>
      <button onClick={onToggle} className="flex w-full items-center justify-between p-5 text-left outline-none">
        <div className="flex items-center gap-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${isOpen ? "bg-primary text-primary-foreground shadow-inner" : "bg-secondary text-muted-foreground"}`}>
            {icon}
          </div>
          <div>
            <h4 className={`text-[15px] font-semibold transition-colors ${isOpen ? "text-foreground" : "text-foreground/80"}`}>{title}</h4>
            <p className="text-[13px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isOpen ? "bg-background shadow-sm" : "bg-transparent"}`}>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>
      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="p-6 pt-2 border-t border-border/30 mt-2 mx-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsView({
  user,
  apiKey,
  apiKeySaved,
  savingApiKey,
  onChangeApiKey,
  onSaveApiKey,
  onThemeToggle,
  isDark,
  popupInterval,
  isSidebarCollapsed,
  onSaveSettings,
}: {
  user: User;
  apiKey: string;
  apiKeySaved: boolean;
  savingApiKey: boolean;
  onChangeApiKey: (value: string) => void;
  onSaveApiKey: () => Promise<void>;
  onThemeToggle: () => void;
  isDark: boolean;
  popupInterval: number;
  isSidebarCollapsed: boolean;
  onSaveSettings: (user: User, interval: number) => Promise<void>;
}) {
  const [form, setForm] = useState<User>(user);
  const [interval, setInterval] = useState<number>(popupInterval);
  const [openSection, setOpenSection] = useState<string>("appearance");
  const [customInterest, setCustomInterest] = useState("");
  const [savingSync, setSavingSync] = useState(false);
  const [savedSync, setSavedSync] = useState(false);
  
  const [providers, setProviders] = useState<AgentDetection[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("groq-api");
  const [selectedModel, setSelectedModel] = useState<string>("default");

  useEffect(() => {
    async function loadProviders() {
      const all = await getAvailableProviders();
      setProviders(all);
      
      const saved = await api.getSetting("preferred_ai_provider");
      if (saved) {
        setSelectedProvider(saved);
      } else {
        const availableCli = all.find(p => p.available && p.id !== "groq-api");
        if (availableCli) setSelectedProvider(availableCli.id);
      }
      
      const savedModel = await api.getSetting("preferred_ai_model");
      if (savedModel) setSelectedModel(savedModel);
    }
    void loadProviders();
  }, []);

  const currentProvider = providers.find(p => p.id === selectedProvider);
  const currentModels = currentProvider?.models ?? [];

  const handleProviderSelect = async (id: string) => {
    setSelectedProvider(id);
    await setPreferredProvider(id);
    // Reset model to first available (or "default") when switching providers
    const provider = providers.find(p => p.id === id);
    const firstModel = provider?.models?.[0]?.id ?? "default";
    setSelectedModel(firstModel);
    await api.setSetting("preferred_ai_model", firstModel);
  };

  const handleModelSelect = async (modelId: string) => {
    setSelectedModel(modelId);
    await api.setSetting("preferred_ai_model", modelId);
  };

  const handleSaveWorkspace = async () => {
    setSavingSync(true);
    try {
      await onSaveSettings(form, interval);
      setSavedSync(true);
      setTimeout(() => setSavedSync(false), 3000);
    } finally {
      setSavingSync(false);
    }
  };

  const selectedInterests = useMemo(() => form.interests || [], [form.interests]);
  
  const toggleInterest = (interest: string) => {
    const next = selectedInterests.includes(interest)
      ? selectedInterests.filter((item) => item !== interest)
      : [...selectedInterests, interest];
    setForm({ ...form, interests: next });
    setSavedSync(false);
  };

  const addCustomInterest = () => {
    const val = customInterest.trim();
    if (!val) return;
    if (selectedInterests.some((i) => i.toLowerCase() === val.toLowerCase())) {
      setCustomInterest("");
      return;
    }
    setForm({ ...form, interests: [...selectedInterests, val] });
    setCustomInterest("");
    setSavedSync(false);
  };

  const builtinOptions = ["Technology", "Travel", "Business", "Art", "Science", "Daily Life", "Food", "Culture"];
  const customInterests = selectedInterests.filter(i => !builtinOptions.includes(i));

  return (
    <div className="flex relative h-full w-full items-start justify-center overflow-y-auto px-4 py-8 md:py-10">
      <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Preferences</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Customize your learning environment.</p>
        </div>

        <div className="space-y-4">
          <AccordionItem
            title="Appearance"
            description="Toggle between light and dark themes"
            icon={<Palette size={20} />}
            isOpen={openSection === "appearance"}
            onToggle={() => setOpenSection(openSection === "appearance" ? "" : "appearance")}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => isDark && onThemeToggle()}
                className={`flex-1 rounded-xl border p-3 text-center transition-all ${!isDark ? "border-primary bg-background shadow-sm" : "border-border/50 hover:bg-secondary/40"}`}
              >
                <div className="mx-auto mb-2 h-6 w-6 rounded-full bg-gradient-to-tr from-stone-100 to-stone-300 shadow-inner" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                onClick={() => !isDark && onThemeToggle()}
                className={`flex-1 rounded-xl border p-3 text-center transition-all ${isDark ? "border-primary bg-background shadow-sm" : "border-border/50 hover:bg-secondary/40"}`}
              >
                <div className="mx-auto mb-2 h-6 w-6 rounded-full bg-gradient-to-tr from-stone-700 to-stone-900 shadow-inner" />
                <span className="text-sm font-medium">Dark</span>
              </button>
            </div>
          </AccordionItem>

          <AccordionItem
            title="AI Provider"
            description="Manage your preferred AI model and credentials"
            icon={<Bot size={20} />}
            isOpen={openSection === "provider"}
            onToggle={() => setOpenSection(openSection === "provider" ? "" : "provider")}
          >
            <div className="space-y-4">
              <div className="grid gap-2">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    disabled={!p.available && p.id !== "groq-api"}
                    onClick={() => handleProviderSelect(p.id)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      selectedProvider === p.id 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border/50 hover:bg-secondary/30"
                    } ${!p.available && p.id !== "groq-api" ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-foreground">
                        {p.display_name} {p.id === "groq-api" && "(Fallback)"}
                      </span>
                      <span className="text-[12px] text-muted-foreground mt-0.5">
                        {p.id === "groq-api" 
                          ? "Uses cloud API directly (requires key)" 
                          : p.available ? `Detected locally: ${p.executable_path}` : "Not installed locally"}
                      </span>
                    </div>
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${selectedProvider === p.id ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                      {selectedProvider === p.id && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Model Selector */}
              {currentModels.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
                  <p className="text-[13px] font-medium text-foreground">Model</p>
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={(e) => void handleModelSelect(e.target.value)}
                      className="h-10 w-full appearance-none rounded-xl border border-border/60 bg-background/50 px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {currentModels.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedModel === "default" || !currentModels.find(m => m.id === selectedModel)
                      ? "Using the provider's default model configuration."
                      : `Active model: ${selectedModel}`}
                  </p>
                </div>
              )}

              {selectedProvider === "groq-api" && (
                <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
                  <p className="text-[13px] font-medium text-foreground">Groq API Key</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => onChangeApiKey(e.target.value)}
                      className="h-10 flex-1 rounded-xl border border-border/60 bg-background/50 px-4 text-[13px] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Paste your Groq API key (gsk_...)"
                    />
                    <button
                      disabled={savingApiKey}
                      onClick={() => void onSaveApiKey()}
                      className="flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                    >
                      {savingApiKey ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test API"}
                    </button>
                  </div>
                  {apiKeySaved && <p className="text-[13px] font-medium text-emerald-600 flex items-center gap-1.5"><Check size={14} /> Key saved and validated successfully</p>}
                </div>
              )}
            </div>
          </AccordionItem>


          <AccordionItem
            title="Languages"
            description="Set your native and learning targets"
            icon={<Globe2 size={20} />}
            isOpen={openSection === "languages"}
            onToggle={() => setOpenSection(openSection === "languages" ? "" : "languages")}
          >
           <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-[13px] font-medium text-muted-foreground">Native Language</p>
                <SettingsSelect
                  value={form.native_language}
                  options={languages}
                  onChange={(val) => { setForm({ ...form, native_language: val }); setSavedSync(false); }}
                />
              </div>
              <div>
                <p className="mb-2 text-[13px] font-medium text-muted-foreground">Target Language</p>
                <SettingsSelect
                  value={form.target_language}
                  options={languages}
                  onChange={(val) => { setForm({ ...form, target_language: val }); setSavedSync(false); }}
                />
              </div>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Proficiency"
            description="Choose your current understanding level"
            icon={<GraduationCap size={20} />}
            isOpen={openSection === "level"}
            onToggle={() => setOpenSection(openSection === "level" ? "" : "level")}
          >
            <div className="flex gap-2">
              {[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setForm({ ...form, level: option.value as User["level"] }); setSavedSync(false); }}
                  className={`flex-1 rounded-xl border py-2.5 text-[13px] font-medium transition ${form.level === option.value ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/60 bg-background/50 hover:bg-secondary/40 text-foreground"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </AccordionItem>

          <AccordionItem
            title="Pace & Frequency"
            description="Manage desktop quizzes and popups"
            icon={<Zap size={20} />}
            isOpen={openSection === "pace"}
            onToggle={() => setOpenSection(openSection === "pace" ? "" : "pace")}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-background/50 p-4 border border-border/40">
                <div>
                  <p className="text-[14px] font-medium">Daily New Words</p>
                  <p className="text-[12px] text-muted-foreground">Limit your learning scope</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.daily_word_count}
                    onChange={(e) => { setForm({ ...form, daily_word_count: Math.max(1, Number(e.target.value) || 1) }); setSavedSync(false); }}
                    className="h-9 w-16 text-center text-sm font-medium border border-border/60 rounded-xl bg-background outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-background/50 p-4 border border-border/40">
                <div>
                  <p className="text-[14px] font-medium">Enable Desktop Popups</p>
                  <p className="text-[12px] text-muted-foreground">Receive quizzes directly on screen</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setForm({ ...form, reminder_enabled: !form.reminder_enabled }); setSavedSync(false); }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.reminder_enabled ? "bg-primary" : "bg-border"}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.reminder_enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className={`overflow-hidden transition-all duration-300 ${form.reminder_enabled ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="flex items-center justify-between rounded-2xl bg-background/50 p-4 border border-border/40">
                  <div>
                    <p className="text-[14px] font-medium">Popup Interval</p>
                    <p className="text-[12px] text-muted-foreground">Minutes between quizzes</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={interval}
                      onChange={(e) => { setInterval(Math.max(1, Number(e.target.value) || 1)); setSavedSync(false); }}
                      className="h-9 w-16 text-center text-sm font-medium border border-border/60 rounded-xl bg-background outline-none focus:border-primary"
                    />
                    <span className="text-xs font-medium text-muted-foreground">min</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Interests"
            description="Tailor generated vocabulary to topics you love"
            icon={<Heart size={20} />}
            isOpen={openSection === "interests"}
            onToggle={() => setOpenSection(openSection === "interests" ? "" : "interests")}
          >
            <div className="flex flex-wrap gap-2">
              {builtinOptions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${selectedInterests.includes(interest) ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/60 bg-background/50 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}
                >
                  {interest}
                </button>
              ))}
              {customInterests.map(interest => (
                 <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className="group flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground shadow-sm"
                 >
                   <span>{interest}</span>
                   <X size={12} className="opacity-60 transition group-hover:opacity-100" />
                 </button>
              ))}
              <input
                type="text"
                value={customInterest.trimStart()}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomInterest(); } }}
                className="h-8 flex-1 min-w-[120px] max-w-[200px] rounded-full border border-border/50 bg-background/50 px-4 text-[13px] outline-none focus:border-primary"
                placeholder="Type & press Enter"
              />
            </div>
          </AccordionItem>

        </div>
      </div>

      <div 
        className={`fixed z-50 transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isSidebarCollapsed ? "bottom-3 left-0" : "bottom-3 left-[272px]"
        }`}
      >
        <button
          disabled={savingSync}
          onClick={handleSaveWorkspace}
          className={`group relative flex h-[48px] items-center overflow-hidden rounded-r-2xl bg-primary text-primary-foreground shadow-2xl transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-50 ${
            isSidebarCollapsed ? "w-10 hover:w-[155px]" : "w-[155px]"
          }`}
        >
          <div className="absolute left-[10px] flex items-center justify-center">
            {savingSync ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : savedSync ? (
              <Check className="h-5 w-5" />
            ) : isSidebarCollapsed ? (
               <div className="relative flex items-center justify-center">
                 <ChevronRight className="h-5 w-5 transition-opacity duration-200 group-hover:opacity-0" />
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-0 top-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                   <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                 </svg>
               </div>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
            )}
          </div>
          
          <span className={`absolute left-10 whitespace-nowrap text-[14px] font-semibold tracking-wide transition-opacity duration-300 ${
            isSidebarCollapsed ? "opacity-0 group-hover:opacity-100 delay-75" : "opacity-100"
          }`}>
            {savedSync ? "Applied" : "Save Settings"}
          </span>

          <div className="absolute inset-0 -z-10 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>

    </div>
  );
}
