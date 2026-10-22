import { useState, useEffect, useCallback, useRef } from "react";
import type { User, ActiveAttempt, HistoryEntry } from "@/types";
import {
  loadUser,
  saveUser,
  clearUser,
  loadAttempt,
  saveAttempt,
  clearAttempt,
  loadHistory,
  addHistoryEntry,
  createAttempt,
} from "@/utils/storage";
import { calculateScore, generateAttemptId } from "@/utils/examLogic";
import { getExamById } from "@/data/questions";
import Navbar from "@/components/Navbar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ExamRoom from "@/pages/ExamRoom";
import Results from "@/pages/Results";

type Page = "login" | "dashboard" | "exam" | "results";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>("login");
  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const hydratedRef = useRef(false);

  // Hydrate state from localStorage on mount
  useEffect(() => {
    const savedUser = loadUser();
    const savedAttempt = loadAttempt();
    const savedHistory = loadHistory();

    if (savedUser && savedUser.isLoggedIn) {
      setUser(savedUser);

      if (savedAttempt && !savedAttempt.isSubmitted) {
        // Check if exam still has time
        const remaining = savedAttempt.deadlineTimestamp - Date.now();
        if (remaining > 0) {
          // Resume the exam — restore exact state including answers and timer
          setAttempt(savedAttempt);
          setPage("exam");
        } else {
          // Time already expired — auto-submit on hydration
          const exam = getExamById(savedAttempt.examId);
          if (exam) {
            submitExamInternal(savedAttempt, exam);
          } else {
            clearAttempt();
          }
          setPage("results");
        }
      } else {
        setPage("dashboard");
      }
    }

    setHistory(savedHistory);
    hydratedRef.current = true;
  }, []);

  // Persist attempt whenever it changes (if in exam mode)
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (attempt && page === "exam") {
      saveAttempt(attempt);
    }
  }, [attempt, page]);

  // ---------- Auth handlers ----------

  const handleLogin = (newUser: User) => {
    saveUser(newUser);
    setUser(newUser);
    setPage("dashboard");
  };

  const handleLogout = () => {
    clearUser();
    clearAttempt();
    setUser(null);
    setAttempt(null);
    setPage("login");
  };

  // ---------- Exam handlers ----------

  const handleStartExam = (examId: string) => {
    const exam = getExamById(examId);
    if (!exam) return;

    const newAttempt = createAttempt(examId, exam.title, exam.durationMinutes, exam.questions);
    setAttempt(newAttempt);
    saveAttempt(newAttempt);
    setPage("exam");
  };

  const handleAttemptChange = (updated: ActiveAttempt) => {
    setAttempt(updated);
  };

  // Internal submit function — used by both manual submit and auto-submit
  const submitExamInternal = useCallback(
    (currentAttempt: ActiveAttempt, exam: ReturnType<typeof getExamById>) => {
      if (!exam) return;

      // Prevent duplicate submission — check if already submitted
      if (currentAttempt.isSubmitted) return;

      const scoreResult = calculateScore(exam.questions, currentAttempt.answers);
      const timeSpent = Math.floor((Date.now() - currentAttempt.startTime) / 1000);

      const historyEntry: HistoryEntry = {
        attemptId: generateAttemptId(),
        examId: exam.examId,
        examTitle: exam.title,
        date: new Date().toISOString(),
        totalQuestions: scoreResult.totalQuestions,
        attempted: scoreResult.attempted,
        correct: scoreResult.correct,
        incorrect: scoreResult.incorrect,
        score: scoreResult.score,
        accuracy: scoreResult.accuracy,
        timeSpentSeconds: timeSpent,
      };

      addHistoryEntry(historyEntry);
      setHistory(loadHistory());

      // Mark as submitted and clear active attempt
      const submittedAttempt = { ...currentAttempt, isSubmitted: true };
      setAttempt(submittedAttempt);
      clearAttempt();
      setPage("results");
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (!attempt) return;
    const exam = getExamById(attempt.examId);
    if (!exam) return;
    submitExamInternal(attempt, exam);
  }, [attempt, submitExamInternal]);

  const handleBackToDashboard = () => {
    setAttempt(null);
    clearAttempt();
    setPage("dashboard");
  };

  const handleRetakeExam = () => {
    if (!attempt) return;
    handleStartExam(attempt.examId);
  };

  // ---------- Render ----------

  // Show nothing until hydration completes to prevent flash
  if (!hydratedRef.current) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || page === "login") {
    return <Login onLogin={handleLogin} />;
  }

  if (page === "exam" && attempt) {
    const exam = getExamById(attempt.examId);
    if (exam) {
      return (
        <ExamRoom
          exam={exam}
          attempt={attempt}
          onAttemptChange={handleAttemptChange}
          onSubmit={handleSubmit}
        />
      );
    }
  }

  if (page === "results" && attempt) {
    const exam = getExamById(attempt.examId);
    if (exam) {
      return (
        <div>
          <Navbar user={user} onLogout={handleLogout} onLogoClick={handleBackToDashboard} />
          <Results
            exam={exam}
            attempt={attempt}
            history={history}
            onBackToDashboard={handleBackToDashboard}
            onRetakeExam={handleRetakeExam}
          />
        </div>
      );
    }
  }

  // Default: dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={handleLogout} onLogoClick={() => setPage("dashboard")} />
      <Dashboard user={user} history={history} onStartExam={handleStartExam} />
    </div>
  );
}

export default App;
