import { useState } from "react";
import { useQuizStore } from "@/store/quizStore";
import { useWordsStore } from "@/store/wordsStore";
import type { AnswerFeedback } from "@/types";
import {
  X,
  Check,
  XCircle,
  ChevronRight,
  Loader2,
  Trophy,
  Sparkles,
  Target,
} from "lucide-react";

export function QuizModal() {
  const {
    questions,
    currentIndex,
    answers,
    submitting,
    submitAnswer,
    nextQuestion,
    closeQuiz,
  } = useQuizStore();
  const { fetchDailyWords } = useWordsStore();

  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const question = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

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

  const handleClose = () => {
    fetchDailyWords();
    closeQuiz();
  };

  // Results screen
  if (isFinished) {
    const correctCount = answers.filter((a) => a.feedback.is_correct).length;
    const totalCount = answers.length;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="glass rounded-2xl p-8 w-full max-w-md animate-confetti">
          <div className="flex flex-col items-center text-center gap-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${
              percentage >= 70 ? "gradient-success" : percentage >= 40 ? "gradient-primary" : "bg-error-500/20"
            }`}>
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
              <p className="text-surface-400">
                You got <span className="text-white font-semibold">{correctCount}</span> out of{" "}
                <span className="text-white font-semibold">{totalCount}</span> correct
              </p>
            </div>

            <div className="w-full bg-surface-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  percentage >= 70 ? "gradient-success" : percentage >= 40 ? "gradient-primary" : "bg-error-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <p className="text-4xl font-bold gradient-text">{percentage}%</p>

            <p className="text-surface-400 text-sm">
              {percentage >= 90
                ? "Outstanding! You're mastering these words! 🌟"
                : percentage >= 70
                ? "Great job! Keep up the good work! 💪"
                : percentage >= 40
                ? "Good effort! Review the hard ones. 📚"
                : "Don't worry, practice makes perfect! 🌱"}
            </p>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl gradient-primary text-white font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
            >
              Back to Words
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="glass rounded-2xl w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-700/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-surface-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-700/50 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-surface-800">
          <div
            className="h-full gradient-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <div className="p-6">
          <div className="mb-1">
            <span className="px-2 py-0.5 rounded text-xs bg-surface-700/50 text-surface-400 capitalize">
              {question.question_type.replace("_", " ")}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-6">{question.prompt}</h3>

          {/* Multiple Choice */}
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
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      showResult && isCorrect
                        ? "bg-success-500/15 border border-success-500/40 text-success-300"
                        : showResult && isSelected && !isCorrect
                        ? "bg-error-500/15 border border-error-500/40 text-error-300 animate-shake"
                        : isSelected
                        ? "bg-primary-500/15 border border-primary-500/40 text-primary-300"
                        : "bg-surface-800/40 border border-surface-700/30 text-surface-300 hover:bg-surface-700/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showResult && isCorrect && <Check className="w-5 h-5 text-success-400" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-error-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Text Input */
            <div className="space-y-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !feedback && handleSubmit()}
                disabled={!!feedback || submitting}
                placeholder="Type your answer..."
                className="w-full px-4 py-3.5 rounded-xl bg-surface-800/60 border border-surface-700/50 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                autoFocus
              />

              {!feedback && (
                <button
                  onClick={() => handleSubmit()}
                  disabled={!userInput.trim() || submitting}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    userInput.trim() && !submitting
                      ? "gradient-primary text-white hover:shadow-lg hover:shadow-primary-500/25"
                      : "bg-surface-800 text-surface-500 cursor-not-allowed"
                  }`}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Submit Answer"
                  )}
                </button>
              )}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`mt-5 p-4 rounded-xl animate-slide-up ${
              feedback.is_correct
                ? "bg-success-500/10 border border-success-500/20"
                : "bg-error-500/10 border border-error-500/20"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {feedback.is_correct ? (
                  <Sparkles className="w-5 h-5 text-success-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-error-400" />
                )}
                <span className={`font-semibold ${feedback.is_correct ? "text-success-300" : "text-error-300"}`}>
                  {feedback.is_correct ? "Correct!" : "Not quite right"}
                </span>
              </div>

              <p className="text-sm text-surface-300 mb-2">{feedback.explanation}</p>

              {!feedback.is_correct && (
                <p className="text-sm text-surface-400">
                  <span className="font-medium text-white">Correct answer:</span> {feedback.correct_answer}
                </p>
              )}

              {feedback.extra_examples.length > 0 && (
                <div className="mt-3 pt-3 border-t border-surface-700/30">
                  <p className="text-xs text-surface-500 mb-1">More examples:</p>
                  {feedback.extra_examples.map((ex, i) => (
                    <p key={i} className="text-sm text-surface-400">• {ex}</p>
                  ))}
                </div>
              )}

              <p className="text-sm text-primary-400 mt-3 italic">{feedback.encouragement}</p>

              <button
                onClick={handleNext}
                className="mt-4 w-full py-2.5 rounded-xl bg-surface-800/60 text-white font-medium hover:bg-surface-700/60 transition-colors flex items-center justify-center gap-2"
              >
                {currentIndex + 1 < questions.length ? (
                  <>Next Question <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>See Results <Trophy className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
