import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useQuizStore } from "@/store/quizStore";
import { useWordsStore } from "@/store/wordsStore";
import { X, Check, XCircle, ChevronRight, Loader2, Target, Sparkles, Trophy } from "lucide-react";

export function PopupQuizPage() {
  const {
    questions,
    currentIndex,
    answers,
    submitting,
    submitAnswer,
    nextQuestion,
    closeQuiz,
    startQuiz,
    loading
  } = useQuizStore();
  
  const { fetchDailyWords } = useWordsStore();
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Initialize quiz immediately when the popup route loads
  useEffect(() => {
    // Because this view is spawned independently of AppShell, we might want to ensure store is fresh
    fetchDailyWords();
    startQuiz().catch(console.error);
    
    // Add event listener for Escape key to close the popup
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeWindow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeWindow = async () => {
    closeQuiz();
    await invoke("hide_popup_window");
  };

  const question = questions[currentIndex];
  const isFinished = questions.length > 0 && currentIndex >= questions.length;
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const handleSubmit = async (answer?: string) => {
    const finalAnswer = answer || userInput;
    if (!finalAnswer.trim()) return;

    try {
      const fb = await submitAnswer(finalAnswer.trim());
      setFeedback(fb);
      setSelectedOption(finalAnswer);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setUserInput("");
    setSelectedOption(null);
    nextQuestion();
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-surface-950 flex flex-col items-center justify-center p-6 border border-surface-800 rounded-xl">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-4" />
        <p className="text-surface-400 text-sm">Preparing a quick quiz...</p>
      </div>
    );
  }

  // If no questions generated (maybe all words learned today)
  if (!loading && questions.length === 0 && !isFinished) {
    return (
      <div className="w-full h-full bg-surface-950 flex flex-col items-center justify-center p-6 border border-surface-800 rounded-xl relative">
        <button onClick={closeWindow} className="absolute top-3 right-3 text-surface-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
        <Trophy className="w-8 h-8 text-surface-500 mb-3" />
        <h3 className="text-white font-medium mb-1 text-center">Nothing to review right now</h3>
        <p className="text-surface-400 text-sm text-center mb-6">You are all caught up!</p>
        <button onClick={closeWindow} className="px-4 py-2 rounded-lg bg-surface-800 text-white text-sm hover:bg-surface-700 transition">
          Close
        </button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = answers.length > 0 ? Math.round((answers.filter(a => a.feedback.is_correct).length / answers.length) * 100) : 0;
    
    return (
      <div className="w-full h-full bg-surface-950 flex flex-col border border-surface-800 rounded-xl overflow-hidden animate-confetti relative p-6 items-center justify-center text-center">
        <button onClick={closeWindow} className="absolute top-3 right-3 text-surface-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
          percentage >= 70 ? "gradient-success" : percentage >= 40 ? "gradient-primary" : "bg-error-500/20"
        }`}>
          <Trophy className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-3xl font-bold gradient-text mb-4">{percentage}%</p>
        
        <button
          onClick={closeWindow}
          className="w-full py-2.5 rounded-xl gradient-primary text-white font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all mt-4"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="w-full h-full bg-surface-950 flex flex-col border border-surface-800 rounded-xl overflow-hidden relative">
      <div className="flex items-center justify-between p-3 border-b border-surface-800/80 bg-surface-900/50">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-xs text-surface-400 font-medium tracking-wide">QUICK REVIEW</span>
        </div>
        <button onClick={closeWindow} className="text-surface-400 hover:text-white transition-colors hover:bg-surface-800 p-1.5 rounded-md">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-0.5 bg-surface-800">
        <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="mb-4">
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-surface-800 text-surface-400 mb-2 inline-block">
            {question.question_type.replace("_", " ")}
          </span>
          <h3 className="text-base font-semibold text-white leading-snug">{question.prompt}</h3>
        </div>

        {/* Form Options */}
        <div className="flex-1 flex flex-col gap-2">
          {question.question_type === "multiple_choice" && question.options ? (
            <div className="space-y-2">
              {question.options.map((option) => {
                const isSelected = selectedOption === option;
                const showResult = feedback !== null;
                const isCorrect = option === question.correct_answer;

                return (
                  <button
                    key={option}
                    onClick={() => !feedback && handleSubmit(option)}
                    disabled={!!feedback || submitting}
                    className={`w-full p-3 rounded-xl text-left text-sm transition-all flex items-center justify-between ${
                      showResult && isCorrect
                        ? "bg-success-500/15 border border-success-500/40 text-success-300"
                        : showResult && isSelected && !isCorrect
                        ? "bg-error-500/15 border border-error-500/40 text-error-300 animate-shake"
                        : isSelected
                        ? "bg-primary-500/15 border border-primary-500/40 text-primary-300"
                        : "bg-surface-800/40 border border-surface-800 hover:border-surface-700 text-surface-300 hover:bg-surface-800"
                    }`}
                  >
                    <span>{option}</span>
                    {showResult && isCorrect && <Check className="w-4 h-4 text-success-400" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-error-400" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !feedback && handleSubmit()}
                disabled={!!feedback || submitting}
                placeholder="Type your answer..."
                className="w-full px-3 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/50 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500/50 text-sm"
                autoFocus
              />
              {!feedback && (
                <button
                  onClick={() => handleSubmit()}
                  disabled={!userInput.trim() || submitting}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                    userInput.trim() && !submitting
                      ? "gradient-primary text-white"
                      : "bg-surface-800 text-surface-500 cursor-not-allowed"
                  }`}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Answer"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feedback Area */}
        {feedback && (
          <div className={`mt-4 p-3 rounded-xl animate-slide-up flex-shrink-0 ${
            feedback.is_correct ? "bg-success-500/10 border border-success-500/20" : "bg-error-500/10 border border-error-500/20"
          }`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              {feedback.is_correct ? (
                <Sparkles className="w-4 h-4 text-success-400" />
              ) : (
                <XCircle className="w-4 h-4 text-error-400" />
              )}
              <span className={`text-sm font-semibold ${feedback.is_correct ? "text-success-300" : "text-error-300"}`}>
                {feedback.is_correct ? "Correct!" : "Not quite right"}
              </span>
            </div>
            
            <p className="text-[13px] text-surface-300 mb-2 leading-snug">{feedback.explanation}</p>
            
            {!feedback.is_correct && (
              <p className="text-[13px] text-surface-400 mb-2">
                <span className="font-medium text-white">Answer:</span> {feedback.correct_answer}
              </p>
            )}

            <button
              onClick={handleNext}
              className="mt-3 w-full py-2 rounded-lg bg-surface-800/80 text-white text-sm font-medium hover:bg-surface-700 transition flex items-center justify-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
