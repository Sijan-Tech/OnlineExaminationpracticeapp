import { CheckCircle, XCircle, Clock, Target, Award, RotateCcw, Home, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { Exam, ActiveAttempt, HistoryEntry } from "@/types";
import { calculateScore, formatTime } from "@/utils/examLogic";

interface ResultsProps {
  exam: Exam;
  attempt: ActiveAttempt;
  history: HistoryEntry[];
  onBackToDashboard: () => void;
  onRetakeExam: () => void;
}

export default function Results({
  exam,
  attempt,
  history,
  onBackToDashboard,
  onRetakeExam,
}: ResultsProps) {
  const scoreResult = calculateScore(exam.questions, attempt.answers);
  const timeSpent = Math.floor((Date.now() - attempt.startTime) / 1000);
  const passed = scoreResult.score >= exam.passingScore;
  const [showReview, setShowReview] = useState(false);

  const pastAttempts = history.filter((h) => h.examId === exam.examId);
  const isBestScore =
    pastAttempts.length === 0 || scoreResult.score >= Math.max(...pastAttempts.map((h) => h.score));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Result banner */}
      <div
        className={`rounded-2xl p-8 mb-6 text-center ${
          passed
            ? "bg-gradient-to-br from-success-50 to-emerald-100 border border-success/20"
            : "bg-gradient-to-br from-danger-50 to-red-100 border border-danger/20"
        }`}
      >
        <div
          className={`inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 ${
            passed ? "bg-success text-white" : "bg-danger text-white"
          }`}
        >
          {passed ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          {passed ? "Congratulations!" : "Keep Practicing!"}
        </h1>
        <p className="text-slate-600">
          {passed
            ? `You passed with ${scoreResult.score}%`
            : `You scored ${scoreResult.score}% — passing score is ${exam.passingScore}%`}
        </p>
        {isBestScore && passed && (
          <span className="inline-block mt-3 px-3 py-1 rounded-lg bg-success text-white text-xs font-bold">
            New Best Score!
          </span>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ResultCard
          icon={<Target className="w-5 h-5" />}
          label="Score"
          value={`${scoreResult.score}%`}
          color="primary"
        />
        <ResultCard
          icon={<Award className="w-5 h-5" />}
          label="Accuracy"
          value={`${scoreResult.accuracy}%`}
          color="warning"
        />
        <ResultCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Correct"
          value={`${scoreResult.correct}/${scoreResult.totalQuestions}`}
          color="success"
        />
        <ResultCard
          icon={<Clock className="w-5 h-5" />}
          label="Time Spent"
          value={formatTime(timeSpent)}
          color="danger"
        />
      </div>

      {/* Breakdown bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="font-bold text-slate-800 mb-4">Answer Breakdown</h3>
        <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 mb-3">
          <div
            className="bg-success"
            style={{ width: `${(scoreResult.correct / scoreResult.totalQuestions) * 100}%` }}
          />
          <div
            className="bg-danger"
            style={{ width: `${(scoreResult.incorrect / scoreResult.totalQuestions) * 100}%` }}
          />
          <div
            className="bg-slate-300"
            style={{
              width: `${((scoreResult.totalQuestions - scoreResult.attempted) / scoreResult.totalQuestions) * 100}%`,
            }}
          />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded bg-success" /> Correct ({scoreResult.correct})
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded bg-danger" /> Incorrect ({scoreResult.incorrect})
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded bg-slate-300" /> Skipped ({scoreResult.totalQuestions - scoreResult.attempted})
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setShowReview(!showReview)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-all active:scale-[0.98]"
        >
          {showReview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showReview ? "Hide Review" : "Review Answers"}
        </button>
        <button
          onClick={onRetakeExam}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-all active:scale-[0.98]"
        >
          <RotateCcw className="w-4 h-4" />
          Retake Exam
        </button>
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-all active:scale-[0.98]"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Detailed review */}
      {showReview && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-bold text-slate-800">Detailed Review</h2>
          {exam.questions.map((q, idx) => {
            const userAnswer = attempt.answers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            const isSkipped = !userAnswer || userAnswer.trim() === "";

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border-2 p-6 ${
                  isSkipped
                    ? "border-slate-200"
                    : isCorrect
                    ? "border-success/30"
                    : "border-danger/30"
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-800 font-medium mb-1">{q.question}</p>
                    {q.subject && (
                      <span className="text-xs text-slate-400">{q.subject}</span>
                    )}
                  </div>
                  {isSkipped ? (
                    <span className="shrink-0 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold">
                      Skipped
                    </span>
                  ) : isCorrect ? (
                    <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-success-light text-success text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-danger-light text-danger text-xs font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Wrong
                    </span>
                  )}
                </div>

                <div className="space-y-2 ml-11">
                  {q.options.map((option, optIdx) => {
                    const isUserAnswer = userAnswer === option;
                    const isCorrectAnswer = q.correctAnswer === option;

                    let className = "border-slate-200 bg-slate-50 text-slate-600";
                    if (isCorrectAnswer) {
                      className = "border-success bg-success-light text-success font-semibold";
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      className = "border-danger bg-danger-light text-danger font-semibold";
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 ${className}`}
                      >
                        <span className="shrink-0 w-6 h-6 rounded-lg bg-white/60 flex items-center justify-center text-xs font-bold">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{option}</span>
                        {isCorrectAnswer && (
                          <CheckCircle className="w-4 h-4 ml-auto text-success" />
                        )}
                        {isUserAnswer && !isCorrectAnswer && (
                          <XCircle className="w-4 h-4 ml-auto text-danger" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="ml-11 mt-3 p-3 rounded-xl bg-primary-50 border border-primary/10">
                  <p className="text-xs font-bold text-primary mb-1">Explanation</p>
                  <p className="text-sm text-slate-700">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "success" | "warning" | "danger";
}) {
  const colorMap = {
    primary: "bg-primary-light text-primary",
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
    danger: "bg-danger-light text-danger",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
