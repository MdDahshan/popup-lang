import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/tauri";
import { Loader2, Sparkles, Volume2, BookOpen, AlertTriangle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { getContentDirection } from "@/lib/rtl";

interface LetterData {
  pronunciation_rules: string;
  notable_combinations: string;
  silences_and_tricks: string;
}

function detectTextDir(text: string): "rtl" | "ltr" {
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;
  return rtlRegex.test(text) ? "rtl" : "ltr";
}

export function StructuredAIView({
  letter,
  targetLanguage,
  nativeLanguage,
}: {
  letter: { char: string };
  targetLanguage: string;
  nativeLanguage: string;
}) {
  const [data, setData] = useState<LetterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchAI = useCallback(async (cancelled: { current: boolean }) => {
    setLoading(true);
    setError(null);
    setData(null);

    const systemPrompt = `You are an expert linguist teaching the characteristics of the ${targetLanguage} letter "${letter.char}".
      Respond ONLY with a raw JSON object in the user's native language (${nativeLanguage}). Do not use markdown backticks, just straight JSON.
      Use this exact schema:
      {
        "pronunciation_rules": "Explain exactly how this letter sounds, any changes in sound before certain vowels/consonants? (max 15 words)",
        "notable_combinations": "List common pairs/blends using this letter and their sound (max 15 words)",
        "silences_and_tricks": "When is it usually silent? Or mention a crucial phonetic trick (max 15 words)"
      }`;

    try {
      let sessionId: number;
      try {
        sessionId = await api.getOrCreateSession();
      } catch {
        if (!cancelled.current) setError("Could not create AI session. Check your API key in Settings.");
        if (!cancelled.current) setLoading(false);
        return;
      }

      let response;
      try {
        response = await api.sendChatMessage(systemPrompt, undefined, sessionId);
      } catch (err: unknown) {
        if (!cancelled.current) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          if (msg.includes("401") || msg.includes("auth")) {
            setError("Invalid API key. Go to Settings and check your configuration.");
          } else if (msg.includes("429") || msg.includes("rate")) {
            setError("Rate limited. Wait a moment and try again.");
          } else if (msg.includes("network") || msg.includes("fetch")) {
            setError("Network error. Check your internet connection.");
          } else {
            setError(`AI request failed: ${msg.slice(0, 80)}`);
          }
          setLoading(false);
        }
        return;
      }

      if (!cancelled.current) {
        if (!response?.content || response.content.trim().length === 0) {
          setError("AI returned an empty response. Try again.");
          setLoading(false);
          return;
        }

        try {
          const cleanJson = response.content
            .trim()
            .replace(/^```(?:json)?\s*/g, "")
            .replace(/```\s*$/g, "")
            .trim();
          const parsed = JSON.parse(cleanJson);

          // Validate schema
          if (!parsed.pronunciation_rules || !parsed.notable_combinations || !parsed.silences_and_tricks) {
            setError("AI returned incomplete data. Try again.");
            setLoading(false);
            return;
          }

          setData(parsed);
        } catch {
          setError("Failed to parse AI response. Try again.");
        }
      }
    } catch {
      if (!cancelled.current) setError("An unexpected error occurred.");
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  }, [letter.char, targetLanguage, nativeLanguage]);

  useEffect(() => {
    const cancelled = { current: false };
    fetchAI(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchAI, retryCount]);

  const handleRetry = () => setRetryCount((c) => c + 1);

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <Loader2 size={28} className="animate-spin text-primary opacity-40 mb-3" />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-64 p-4 flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 shadow-sm backdrop-blur-md"
      >
        <p className="text-destructive text-[12px] text-center font-medium leading-relaxed">
          {error || "An unexpected error occurred."}
        </p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-[11px] font-bold text-destructive hover:bg-destructive/20 transition active:scale-95"
        >
          <RefreshCw size={11} />
          Retry
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="absolute top-6 flex w-full items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest"
      >
        <Sparkles size={10} />
        AI-Generated Rules
      </motion.div>

      <Bubble
        icon={<Volume2 size={15} />}
        title="Pronunciation"
        content={data.pronunciation_rules}
        style={{ top: -12, insetInlineStart: -140 }}
        delay={0.1}
      />
      <Bubble
        icon={<BookOpen size={15} />}
        title="Combinations"
        content={data.notable_combinations}
        style={{ top: -12, insetInlineEnd: -140 }}
        delay={0.2}
      />
      <Bubble
        icon={<AlertTriangle size={15} />}
        title="Tricks & Silences"
        content={data.silences_and_tricks}
        style={{ bottom: -24, left: "50%", transform: "translateX(-50%)" }}
        delay={0.3}
      />
    </>
  );
}

function Bubble({
  icon,
  title,
  content,
  style,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  style: React.CSSProperties;
  delay: number;
}) {
  const contentDir = detectTextDir(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      dir={contentDir}
      className="absolute w-36 sm:w-44 rounded-2xl border-2 border-border/40 bg-card/90 p-3 shadow-xl backdrop-blur-md z-20"
      style={style}
    >
      <div className="flex items-center gap-2 text-primary font-bold text-[10px] sm:text-[11px] uppercase tracking-wide mb-1.5">
        {icon}
        {title}
      </div>
      <p className="text-[11px] sm:text-[12px] leading-relaxed text-foreground/80 font-medium">
        {content}
      </p>
    </motion.div>
  );
}
