import { useState } from "react";
import {
  Clock,
  FileQuestion,
  Target,
  Play,
  History,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import type { User, HistoryEntry } from "@/types";
import { exams } from "@/data/questions";

interface DashboardProps {
  user: User;
  history: HistoryEntry[];
  onStartExam: (examId: string) => void;
}

export default function Dashboard({ user, history, onStartExam }: DashboardProps) {
  const [confirmExam, setConfirmExam] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Welcome back, {user.name.split(" ")[0]}!
        </h1>
        <p className="text-slate-500 mt-1">
          Target: <span className="font-semibold text-primary">{user.targetExam}</span>
        </p>
      </div>

      {/* Stats summary */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<History className="w-5 h-5" />}
            label="Total Attempts"
            value={history.length}
            color="primary"
          />
          <StatCard
            icon={<Award className="w-5 h-5" />}
            label="Best Score"
            value={`${Math.max(...history.map((h) => h.score))}%`}
            color="success"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Avg Accuracy"
            value={`${Math.round(history.reduce((sum, h) => sum + h.accuracy, 0) / history.length)}%`}
            color="warning"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Questions Solved"
            value={history.reduce((sum, h) => sum + h.attempted, 0)}
            color="danger"
          />
        </div>
      )}

      {/* Available exams */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">Available Exams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {exams.map((exam) => {
          const pastAttempts = history.filter((h) => h.examId === exam.examId);
          const bestScore = pastAttempts.length > 0 ? Math.max(...pastAttempts.map((h) => h.score)) : null;

          return (
            <div
              key={exam.examId}
              className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-lg leading-snug">{exam.title}</h3>
                {bestScore !== null && (
                  <span className="shrink-0 px-2.5 py-1 rounded-lg bg-success-light text-success text-xs font-bold">
                    Best: {bestScore}%
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{exam.description}</p>

              <div className="flex items-center gap-4 text-sm text-slate-600 mb-5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {exam.durationMinutes} min
                </span>
                <span className="flex items-center gap-1.5">
                  <FileQuestion className="w-4 h-4 text-slate-400" />
                  {exam.questions.length} Qs
                </span>
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-slate-400" />
                  {exam.passingScore}%
                </span>
              </div>

              <button
                onClick={() => setConfirmExam(exam.examId)}
                className="w-full flex items-center justify-center gap-2 bg-primary group-hover:bg-primary-dark text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98]"
              >
                <Play className="w-4 h-4" />
                Start Exam
              </button>
            </div>
          );
        })}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Performance History</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-left">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Exam</th>
                    <th className="px-5 py-3 font-semibold hidden sm:table-cell">Date</th>
                    <th className="px-5 py-3 font-semibold text-center">Attempted</th>
                    <th className="px-5 py-3 font-semibold text-center">Correct</th>
                    <th className="px-5 py-3 font-semibold text-center">Incorrect</th>
                    <th className="px-5 py-3 font-semibold text-center">Score</th>
                    <th className="px-5 py-3 font-semibold text-center">Accuracy</th>
                    <th className="px-5 py-3 font-semibold text-center hidden md:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr
                      key={entry.attemptId}
                      className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-800">{entry.examTitle}</td>
                      <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">
                        {new Date(entry.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3 text-center text-slate-700">{entry.attempted}/{entry.totalQuestions}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {entry.correct}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-danger">
                          <XCircle className="w-3.5 h-3.5" />
                          {entry.incorrect}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-lg font-bold ${
                            entry.score >= 50
                              ? "bg-success-light text-success"
                              : "bg-danger-light text-danger"
                          }`}
                        >
                          {entry.score}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-700">{entry.accuracy}%</td>
                      <td className="px-5 py-3 text-center text-slate-500 hidden md:table-cell">
                        {Math.floor(entry.timeSpentSeconds / 60)}m {entry.timeSpentSeconds % 60}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmExam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setConfirmExam(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Ready to start?</h3>
            <p className="text-sm text-slate-500 mb-6">
              The timer will begin immediately and cannot be paused. Make sure you have enough time to complete the exam.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmExam(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onStartExam(confirmExam);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-all active:scale-[0.98]"
              >
                Begin
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
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
