import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Loader2, Moon, Search, Sparkles, Sun, X } from "lucide-react";
import type { User } from "@/types";
import { initialUserForm, type UserFormState } from "../config";

export const languageOptions = [
  { value: "af", label: "Afrikaans" },
  { value: "sq", label: "Albanian" },
  { value: "am", label: "Amharic" },
  { value: "ar", label: "Arabic" },
  { value: "hy", label: "Armenian" },
  { value: "as", label: "Assamese" },
  { value: "ay", label: "Aymara" },
  { value: "az", label: "Azerbaijani" },
  { value: "bm", label: "Bambara" },
  { value: "eu", label: "Basque" },
  { value: "be", label: "Belarusian" },
  { value: "bn", label: "Bengali" },
  { value: "bs", label: "Bosnian" },
  { value: "bg", label: "Bulgarian" },
  { value: "ca", label: "Catalan" },
  { value: "ceb", label: "Cebuano" },
  { value: "ny", label: "Chichewa" },
  { value: "zh", label: "Chinese" },
  { value: "co", label: "Corsican" },
  { value: "hr", label: "Croatian" },
  { value: "cs", label: "Czech" },
  { value: "da", label: "Danish" },
  { value: "dv", label: "Dhivehi" },
  { value: "doi", label: "Dogri" },
  { value: "nl", label: "Dutch" },
  { value: "en", label: "English" },
  { value: "eo", label: "Esperanto" },
  { value: "et", label: "Estonian" },
  { value: "ee", label: "Ewe" },
  { value: "fil", label: "Filipino" },
  { value: "fi", label: "Finnish" },
  { value: "fr", label: "French" },
  { value: "fy", label: "Frisian" },
  { value: "gl", label: "Galician" },
  { value: "ka", label: "Georgian" },
  { value: "de", label: "German" },
  { value: "el", label: "Greek" },
  { value: "gn", label: "Guarani" },
  { value: "gu", label: "Gujarati" },
  { value: "ht", label: "Haitian Creole" },
  { value: "ha", label: "Hausa" },
  { value: "haw", label: "Hawaiian" },
  { value: "he", label: "Hebrew" },
  { value: "hi", label: "Hindi" },
  { value: "hmn", label: "Hmong" },
  { value: "hu", label: "Hungarian" },
  { value: "is", label: "Icelandic" },
  { value: "ig", label: "Igbo" },
  { value: "ilo", label: "Ilocano" },
  { value: "id", label: "Indonesian" },
  { value: "ga", label: "Irish" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "jv", label: "Javanese" },
  { value: "kn", label: "Kannada" },
  { value: "kk", label: "Kazakh" },
  { value: "km", label: "Khmer" },
  { value: "rw", label: "Kinyarwanda" },
  { value: "gom", label: "Konkani" },
  { value: "ko", label: "Korean" },
  { value: "kri", label: "Krio" },
  { value: "ku", label: "Kurdish" },
  { value: "ckb", label: "Kurdish (Sorani)" },
  { value: "ky", label: "Kyrgyz" },
  { value: "lo", label: "Lao" },
  { value: "la", label: "Latin" },
  { value: "lv", label: "Latvian" },
  { value: "ln", label: "Lingala" },
  { value: "lt", label: "Lithuanian" },
  { value: "lg", label: "Luganda" },
  { value: "lb", label: "Luxembourgish" },
  { value: "mk", label: "Macedonian" },
  { value: "mai", label: "Maithili" },
  { value: "mg", label: "Malagasy" },
  { value: "ms", label: "Malay" },
  { value: "ml", label: "Malayalam" },
  { value: "mt", label: "Maltese" },
  { value: "mi", label: "Maori" },
  { value: "mr", label: "Marathi" },
  { value: "mni", label: "Meiteilon" },
  { value: "lus", label: "Mizo" },
  { value: "mn", label: "Mongolian" },
  { value: "my", label: "Myanmar" },
  { value: "ne", label: "Nepali" },
  { value: "no", label: "Norwegian" },
  { value: "or", label: "Odia" },
  { value: "om", label: "Oromo" },
  { value: "ps", label: "Pashto" },
  { value: "fa", label: "Persian" },
  { value: "pl", label: "Polish" },
  { value: "pt", label: "Portuguese" },
  { value: "pa", label: "Punjabi" },
  { value: "qu", label: "Quechua" },
  { value: "ro", label: "Romanian" },
  { value: "ru", label: "Russian" },
  { value: "sm", label: "Samoan" },
  { value: "sa", label: "Sanskrit" },
  { value: "gd", label: "Scots Gaelic" },
  { value: "nso", label: "Sepedi" },
  { value: "sr", label: "Serbian" },
  { value: "st", label: "Sesotho" },
  { value: "sn", label: "Shona" },
  { value: "sd", label: "Sindhi" },
  { value: "si", label: "Sinhala" },
  { value: "sk", label: "Slovak" },
  { value: "sl", label: "Slovenian" },
  { value: "so", label: "Somali" },
  { value: "es", label: "Spanish" },
  { value: "su", label: "Sundanese" },
  { value: "sw", label: "Swahili" },
  { value: "sv", label: "Swedish" },
  { value: "tg", label: "Tajik" },
  { value: "ta", label: "Tamil" },
  { value: "tt", label: "Tatar" },
  { value: "te", label: "Telugu" },
  { value: "th", label: "Thai" },
  { value: "ti", label: "Tigrinya" },
  { value: "ts", label: "Tsonga" },
  { value: "tr", label: "Turkish" },
  { value: "tk", label: "Turkmen" },
  { value: "ak", label: "Twi" },
  { value: "uk", label: "Ukrainian" },
  { value: "ur", label: "Urdu" },
  { value: "ug", label: "Uyghur" },
  { value: "uz", label: "Uzbek" },
  { value: "vi", label: "Vietnamese" },
  { value: "cy", label: "Welsh" },
  { value: "xh", label: "Xhosa" },
  { value: "yi", label: "Yiddish" },
  { value: "yo", label: "Yoruba" },
  { value: "zu", label: "Zulu" },
];

export const interestOptions = [
  "Travel",
  "Work",
  "Daily conversation",
  "Movies",
  "Business",
  "Technology",
  "Study",
  "Culture",
];

export const dailyGoalOptions = [5, 10, 15, 20];

export function WelcomeSetup({
  isDark,
  onToggleTheme,
  onSaved,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
  onSaved: (form: UserFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<UserFormState>(initialUserForm);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const selectedInterests = useMemo(
    () => form.interests.split(",").map((item) => item.trim()).filter(Boolean),
    [form.interests]
  );
  const [customInterest, setCustomInterest] = useState("");

  const customInterests = selectedInterests.filter((interest) => !interestOptions.includes(interest));
  const isCustomDailyGoal = !dailyGoalOptions.includes(form.daily_word_count);
  const hasCustomInterest = customInterests.length > 0;

  const canContinue =
    step === 0
      ? Boolean(form.native_language && form.target_language)
      : step === 1
        ? Boolean(form.level && form.daily_word_count)
        : selectedInterests.length > 0;

  const toggleInterest = (interest: string) => {
    const next = selectedInterests.includes(interest)
      ? selectedInterests.filter((item) => item !== interest)
      : [...selectedInterests, interest];

    setForm({ ...form, interests: next.join(", ") });
  };

  const addCustomInterest = () => {
    const value = customInterest.trim();
    if (!value) return;
    if (selectedInterests.some((interest) => interest.toLowerCase() === value.toLowerCase())) {
      setCustomInterest("");
      return;
    }
    setForm({ ...form, interests: [...selectedInterests, value].join(", ") });
    setCustomInterest("");
  };

  const removeInterest = (interestToRemove: string) => {
    setForm({
      ...form,
      interests: selectedInterests.filter((interest) => interest !== interestToRemove).join(", "),
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-background px-4 py-3 md:px-6 md:py-4">
      <div className="mx-auto flex h-full max-w-3xl items-center justify-center">
        <div className="w-full max-w-3xl overflow-visible">
          <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Popup Lang</p>
              <h1 className="mt-2 text-[24px] font-semibold tracking-tight md:text-[28px]">Let’s set things up</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-[14px]">
                A simple setup to personalize your learning space.
              </p>
            </div>
            <button
              onClick={onToggleTheme}
              className="rounded-2xl border border-border/60 p-3 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            {["Languages", "Level", "Interests"].map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs transition",
                    index <= step ? "border-foreground text-foreground" : "border-border/70 text-muted-foreground",
                  ].join(" ")}
                >
                  {index + 1}
                </div>
                <span className={index === step ? "text-foreground" : undefined}>{label}</span>
                {index < 2 && <ChevronRight size={14} className="text-muted-foreground/60" />}
              </div>
            ))}
          </div>

          <div className="relative mt-5 border-y border-border/60 py-5">
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Step 1</p>
                  <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight">Choose your languages</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <CustomSelect
                    label="Native language"
                    value={form.native_language}
                    options={languageOptions}
                    onChange={(value) => setForm({ ...form, native_language: value })}
                  />

                  <CustomSelect
                    label="Target language"
                    value={form.target_language}
                    options={languageOptions}
                    onChange={(value) => setForm({ ...form, target_language: value })}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Step 2</p>
                  <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight">Pick your pace</h2>
                </div>

                <div>
                  <p className="mb-2.5 text-sm text-muted-foreground">Level</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "beginner", label: "Beginner" },
                      { value: "intermediate", label: "Intermediate" },
                      { value: "advanced", label: "Advanced" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setForm({ ...form, level: option.value as User["level"] })}
                        className={[
                          "rounded-full border px-3.5 py-1.5 text-sm transition",
                          form.level === option.value
                            ? "border-foreground bg-foreground text-background"
                            : "border-border/70 text-foreground hover:bg-accent",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2.5 text-sm text-muted-foreground">Daily goal</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {dailyGoalOptions.map((count) => (
                      <button
                        key={count}
                        onClick={() => setForm({ ...form, daily_word_count: count })}
                        className={[
                          "rounded-full border px-3.5 py-1.5 text-sm transition",
                          form.daily_word_count === count
                            ? "border-foreground bg-foreground text-background"
                            : "border-border/70 text-foreground hover:bg-accent",
                        ].join(" ")}
                      >
                        {count} words
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        if (!isCustomDailyGoal) {
                          setForm({ ...form, daily_word_count: 25 });
                        }
                      }}
                      className={[
                        "rounded-full border px-3.5 py-1.5 text-sm transition",
                        isCustomDailyGoal
                          ? "border-foreground bg-foreground text-background"
                          : "border-border/70 text-foreground hover:bg-accent",
                      ].join(" ")}
                    >
                      Custom
                    </button>

                    {isCustomDailyGoal && (
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={form.daily_word_count}
                        onChange={(e) => setForm({ ...form, daily_word_count: Math.max(1, Number(e.target.value) || 1) })}
                        className="h-8 w-28 rounded-full border border-border/70 bg-background px-3 text-sm text-foreground outline-none"
                        placeholder="Words"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Enable reminders</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Get a small nudge to keep your streak going.</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={form.reminder_enabled}
                    onClick={() => setForm({ ...form, reminder_enabled: !form.reminder_enabled })}
                    className={[
                      "relative inline-flex h-6 w-11 items-center rounded-full transition",
                      form.reminder_enabled ? "bg-primary" : "bg-secondary border border-border/70",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        form.reminder_enabled ? "translate-x-5" : "translate-x-0.5",
                      ].join(" ")}
                    />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Step 3</p>
                  <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight">Choose your interests</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">Pick a few topics so examples feel more natural.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {interestOptions.map((interest) => {
                    const active = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={[
                          "rounded-full border px-3.5 py-1.5 text-sm transition",
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border/70 text-foreground hover:bg-accent",
                        ].join(" ")}
                      >
                        {interest}
                      </button>
                    );
                  })}

                  {customInterests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-foreground bg-foreground px-3.5 py-1.5 text-sm text-background transition"
                    >
                      <span>{interest}</span>
                      <X size={12} />
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCustomInterest((current) => current || " ")}
                    className={[
                      "rounded-full border px-3.5 py-1.5 text-sm transition",
                      hasCustomInterest || customInterest.trim()
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/70 text-foreground hover:bg-accent",
                    ].join(" ")}
                  >
                    Custom
                  </button>

                  {(hasCustomInterest || customInterest !== "") && (
                    <input
                      type="text"
                      value={customInterest.trimStart()}
                      onChange={(e) => setCustomInterest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomInterest();
                        }
                      }}
                      className="h-8 w-36 rounded-full border border-border/70 bg-background px-3 text-sm text-foreground outline-none"
                      placeholder="Custom interest"
                    />
                  )}

                  {(hasCustomInterest || customInterest !== "") && (
                    <button
                      type="button"
                      onClick={addCustomInterest}
                      className="rounded-full border border-border/70 px-3.5 py-1.5 text-sm text-foreground transition hover:bg-accent"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-4">
            <p className="text-sm text-muted-foreground">You can change everything later from settings.</p>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep((value) => value - 1)}
                  className="rounded-2xl border border-border/70 px-4 py-2.5 text-sm text-foreground transition hover:bg-accent"
                >
                  Back
                </button>
              )}

              {step < 2 ? (
                <button
                  disabled={!canContinue}
                  onClick={() => setStep((value) => value + 1)}
                  className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  disabled={saving || !canContinue}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await onSaved(form);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={16} />}
                  Start learning
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type SelectOption = {
  value: string;
  label: string;
};

export function CustomSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query));
  }, [options, search]);

  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setHighlightedIndex(0);
      return;
    }

    const selectedIndex = Math.max(
      0,
      filteredOptions.findIndex((option) => option.value === value)
    );
    setHighlightedIndex(selectedIndex);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, value, filteredOptions]);

  const chooseOption = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground transition hover:bg-accent"
      >
        <span>{selected?.label}</span>
        <ChevronDown size={16} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-border/70 bg-popover shadow-lg"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              return;
            }

            if (!filteredOptions.length) return;

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setHighlightedIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlightedIndex((current) => Math.max(current - 1, 0));
            }

            if (event.key === "Enter") {
              event.preventDefault();
              chooseOption(filteredOptions[highlightedIndex].value);
            }
          }}
        >
          <div className="border-b border-border/60 p-2">
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3">
              <Search size={14} className="text-muted-foreground" />
              <input
                ref={inputRef}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search language"
                className="h-10 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No language found.</div>
            ) : (
              filteredOptions.map((option, index) => {
                const active = option.value === value;
                const highlighted = index === highlightedIndex;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => chooseOption(option.value)}
                    className={[
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-popover-foreground transition",
                      highlighted ? "bg-accent" : "hover:bg-accent",
                    ].join(" ")}
                  >
                    <span>{option.label}</span>
                    {active && <Check size={15} className="text-muted-foreground" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
