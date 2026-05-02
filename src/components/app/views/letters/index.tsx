import { useState, useMemo, useEffect, useRef } from "react";
import { getAlphabet, shuffleArray, type LetterInfo } from "./constants";
import { getContentDirection } from "@/lib/rtl";
import { Shuffle, X } from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import { StructuredAIView } from "./StructuredAIView";

export function LetterCanvas({
  targetLanguage,
  nativeLanguage,
}: {
  targetLanguage: string;
  nativeLanguage?: string;
}) {
  const alphabet = useMemo(() => {
    try {
      return getAlphabet(targetLanguage);
    } catch {
      return [];
    }
  }, [targetLanguage]);
  const [letters, setLetters] = useState<LetterInfo[]>(() => alphabet);
  const [selected, setSelected] = useState<LetterInfo | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const isRTL = useMemo(() => {
    if (alphabet.length > 0) {
      return getContentDirection(alphabet[0].char) === "rtl";
    }
    return false;
  }, [alphabet]);

  useEffect(() => {
    setLetters(alphabet);
    setSelected(null);
  }, [alphabet]);

  const handleShuffle = () => {
    setLetters((prev) => shuffleArray(prev));
  };

  const handleSelect = (letter: LetterInfo) => {
    setSelected(letter);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  };

  return (
    <LayoutGroup>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="relative flex h-full w-full flex-col overflow-y-auto overflow-x-hidden px-4 py-8 sm:px-8 sm:py-10 bg-background scroll-smooth"
      >
        {/* Header */}
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between pb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {targetLanguage} Letters
            </h2>
            <p className="text-[13px] font-medium text-muted-foreground">
              {letters.length} Characters • Select one to learn its rules
            </p>
          </div>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-2 rounded-2xl border-2 border-border/40 bg-secondary/60 px-4 py-2.5 text-[13px] font-bold text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 shadow-sm"
          >
            <Shuffle size={14} />
            Shuffle
          </button>
        </div>

        <div className="mx-auto w-full max-w-6xl flex flex-col gap-16 pb-32">
          {/* Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 gap-3 place-items-center">
            {letters.map((letter) => {
              const isActive = selected?.char === letter.char;
              const charDir = getContentDirection(letter.char);

              return (
                <div
                  key={letter.char}
                  className="relative h-14 w-14 sm:h-16 sm:w-16"
                >
                  {/* If this letter is selected, it lives in the details area instead */}
                  {isActive ? (
                    // Ghost placeholder in the grid
                    <div className="absolute inset-0 flex items-center justify-center rounded-[18px] sm:rounded-[20px] border-2 border-dashed border-primary/30 bg-primary/5">
                      <div className="h-2 w-2 rounded-full bg-primary/30 animate-pulse" />
                    </div>
                  ) : (
                    // Normal interactive letter
                    <motion.button
                      layoutId={`letter-${letter.char}`}
                      onClick={() => handleSelect(letter)}
                      dir={charDir}
                      className="absolute inset-0 flex items-center justify-center rounded-[18px] sm:rounded-[20px] border-2 border-border/40 bg-card shadow-sm outline-none cursor-pointer hover:border-primary/50 hover:bg-primary/5 active:scale-95"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <span className="text-2xl sm:text-3xl font-black text-foreground">
                        {letter.char}
                      </span>
                    </motion.button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Details Area — the selected letter slides here */}
          <div ref={detailsRef} className="w-full flex justify-center py-8 min-h-[100px]">
            {selected && (
              <div className="relative flex flex-col items-center w-full max-w-[300px] sm:max-w-md min-h-[420px]">
                {/* The SAME letter element that was in the grid — framer-motion slides it here */}
                <motion.div
                  layoutId={`letter-${selected.char}`}
                  dir={getContentDirection(selected.char)}
                  className="relative z-10 flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-[32px] sm:rounded-[40px] border-4 border-primary/20 bg-card shadow-2xl"
                  transition={{ type: "spring", stiffness: 250, damping: 28 }}
                >
                  <span className="text-6xl font-black text-foreground sm:text-7xl">
                    {selected.char}
                  </span>
                  {/* Close button on the letter card */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelected(null); }}
                    className="absolute -top-2 -end-2 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-secondary border border-border/50 text-muted-foreground/70 shadow-sm transition hover:bg-destructive hover:text-white hover:border-destructive active:scale-90"
                  >
                    <X size={10} />
                  </button>
                </motion.div>

                {/* AI Floating Bubbles */}
                <StructuredAIView
                  letter={selected}
                  targetLanguage={targetLanguage}
                  nativeLanguage={nativeLanguage ?? "English"}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
