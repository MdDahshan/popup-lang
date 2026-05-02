import { useState } from "react";
import { cn } from "@/lib/utils";
import * as api from "@/lib/tauri";
import { FullScreenLoader } from "../shared";

export function QuizView({
  questions,
  currentIndex,
  answersCount,
  isOpen,
  loading,
  submitting,
  onStart,
  onSubmit,
  onNext,
  onClose,
}: {
  questions: Awaited<ReturnType<typeof api.generateQuiz>>;
  currentIndex: number;
  answersCount: number;
  isOpen: boolean;
  loading: boolean;
  submitting: boolean;
  onStart: (single: boolean) => void;
  onSubmit: (answer: string) => Promise<unknown>;
  onNext: () => void;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Awaited<ReturnType<typeof api.submitQuizAnswer>> | null>(null);
  const current = questions[currentIndex];
  const finished = isOpen && currentIndex >= questions.length;

  return (
    <div className="space-y-5 px-5 py-4 md:px-6 md:py-5">
      <div className="rounded-[28px] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.05),transparent_45%)] px-6 py-6 md:px-7 md:py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Quiz</p>
            <h3 className="mt-3 text-[30px] font-semibold tracking-tight">Practice mode</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-[15px]">
              Start a full session or one quick challenge and keep your streak moving.
            </p>
          </div>
          <div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">{answersCount} answered</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button onClick={() => onStart(false)} className="rounded-[24px] border border-border/70 bg-card p-5 text-left shadow-sm transition hover:bg-accent">
          <p className="mb-2 text-[15px] font-medium">Full quiz</p>
          <p className="text-sm text-muted-foreground">Generate a complete practice session.</p>
        </button>
        <button onClick={() => onStart(true)} className="rounded-[24px] border border-border/70 bg-card p-5 text-left shadow-sm transition hover:bg-accent">
          <p className="mb-2 text-[15px] font-medium">Quick question</p>
          <p className="text-sm text-muted-foreground">One fast challenge.</p>
        </button>
        <div className="rounded-[24px] border border-border/70 bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Current status</p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight">{isOpen ? "Running" : "Ready"}</p>
        </div>
      </div>

      {loading ? (
        <FullScreenLoader label="Preparing quiz..." />
      ) : !isOpen ? (
        <div className="rounded-[28px] border border-border/70 bg-card p-8 text-center text-muted-foreground shadow-sm">
          Start a quiz to begin practicing.
        </div>
      ) : finished ? (
        <div className="rounded-[28px] border border-border/70 bg-card p-8 text-center shadow-sm">
          <h3 className="text-[28px] font-semibold tracking-tight">Quiz complete</h3>
          <p className="mt-2 text-sm text-muted-foreground">You answered {answersCount} question(s).</p>
          <button onClick={onClose} className="mt-5 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">Close session</button>
        </div>
      ) : current ? (
        <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm md:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Question {currentIndex + 1}</p>
              <h3 className="mt-2 text-[28px] font-semibold tracking-tight">{current.prompt}</h3>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-[10px] text-muted-foreground">{current.question_type}</span>
          </div>

          {current.options?.length ? (
            <div className="mb-4 grid gap-2 md:grid-cols-2">
              {current.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswer(option)}
                  className={cn(
                    "rounded-2xl border border-border/70 bg-background px-4 py-3 text-left text-sm transition",
                    answer === option && "bg-accent"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-28 w-full rounded-[24px] border border-border/70 bg-secondary/80 p-4 text-sm outline-none"
            placeholder="Type your answer"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              disabled={!answer.trim() || submitting}
              onClick={async () => {
                const result = await onSubmit(answer);
                setFeedback(result as Awaited<ReturnType<typeof api.submitQuizAnswer>>);
              }}
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {submitting ? "Checking..." : "Submit answer"}
            </button>
            <button
              onClick={() => {
                setAnswer("");
                setFeedback(null);
                onNext();
              }}
              className="rounded-2xl bg-secondary px-4 py-3 text-sm transition hover:bg-accent"
            >
              Next question
            </button>
          </div>

          {feedback && (
            <div className="mt-5 rounded-[24px] bg-secondary/80 p-5">
              <p className="text-[15px] font-medium">{feedback.is_correct ? "Correct" : "Not quite"}</p>
              <p className="mt-2 text-sm text-muted-foreground">Correct answer: {feedback.correct_answer}</p>
              <p className="mt-3 text-sm leading-7">{feedback.explanation}</p>
              {feedback.extra_examples.length > 0 && (
                <div className="mt-4 space-y-2">
                  {feedback.extra_examples.map((example, index) => (
                    <p key={index} className="text-sm text-muted-foreground">• {example}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
