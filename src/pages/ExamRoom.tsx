import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Eraser,
  Send,
  PanelLeftClose,
  PanelLeft,
  AlertTriangle,
} from "lucide-react";
import type {
  Exam,
  ActiveAttempt,
  Question,
} from "@/types";
import { getRemainingSeconds, formatTime, getQuestionStatus } from "@/utils/examLogic";
import Timer from "@/components/Timer";
import QuestionPalette from "@/components/QuestionPalette";
import Modal from "@/components/Modal";

interface ExamRoomProps {
  exam: Exam;
  attempt: ActiveAttempt;
  onAttemptChange: (attempt: ActiveAttempt) => void;
  onSubmit: () => void;
}

export default function ExamRoom({
  exam,
  attempt,
  onAttemptChange,
  onSubmit,
}: ExamRoomProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    getRemainingSeconds(attempt.deadlineTimestamp)
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const submitGuardRef = useRef(false);

  const totalSeconds = exam.durationMinutes * 60;
  const currentQuestion: Question = exam.questions[attempt.currentIndex];

  // Update the attempt and persist it
  const updateAttempt = useCallback(
    (partial: Partial<ActiveAttempt>) => {
      const updated = { ...attempt, ...partial };
      onAttemptChange(updated);
    },
    [attempt, onAttemptChange]
  );

  // Timer tick — uses deadline timestamp, survives reloads
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getRemainingSeconds(attempt.deadlineTimestamp);
      setRemainingSeconds(remaining);
      if (remaining <= 0 && !submitGuardRef.current) {
        submitGuardRef.current = true;
        onSubmit();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [attempt.deadlineTimestamp, onSubmit]);

  // Track time spent per question — accumulate time on the previous question
  const lastEnterRef = useRef(attempt.lastQuestionEnterTime);

  useEffect(() => {
    // When currentIndex changes, accumulate the elapsed time on the previous question
    const now = Date.now();
    const elapsed = Math.floor((now - lastEnterRef.current) / 1000);
    if (elapsed > 0 && elapsed < 3600) {
      const prevIndex = attempt.currentIndex;
      const qId = exam.questions[prevIndex]?.id;
      if (qId) {
        const newTimings = {
          ...attempt.questionTimings,
          [qId]: (attempt.questionTimings[qId] || 0) + elapsed,
        };
        updateAttempt({
          questionTimings: newTimings,
          lastQuestionEnterTime: now,
        });
      }
    }
    lastEnterRef.current = now;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.currentIndex]);

  // Mark current question as visited
  useEffect(() => {
    if (!attempt.visitedStatus[currentQuestion.id]) {
      updateAttempt({
        visitedStatus: { ...attempt.visitedStatus, [currentQuestion.id]: true },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.currentIndex]);

  const goToQuestion = (index: number) => {
    if (index < 0 || index >= exam.questions.length) return;
    updateAttempt({ currentIndex: index });
    setPaletteOpen(false);
  };

  const selectAnswer = (option: string) => {
    updateAttempt({
      answers: { ...attempt.answers, [currentQuestion.id]: option },
    });
  };

  const clearResponse = () => {
    const newAnswers = { ...attempt.answers };
    delete newAnswers[currentQuestion.id];
    updateAttempt({ answers: newAnswers });
  };

  const toggleReview = () => {
    updateAttempt({
      reviewFlags: {
        ...attempt.reviewFlags,
        [currentQuestion.id]: !attempt.reviewFlags[currentQuestion.id],
      },
    });
  };

  const handleSubmit = () => {
    if (submitGuardRef.current) return;
    submitGuardRef.current = true;
    onSubmit();
  };

  const status = getQuestionStatus(
    currentQuestion.id,
    attempt.answers,
    attempt.reviewFlags,
    attempt.visitedStatus
  );

  const statusBadge = {
    answered: { text: "Answered", class: "bg-success-light text-success" },
    unanswered: { text: "Not Answered", class: "bg-danger-light text-danger" },
    review: { text: "Marked for Review", class: "bg-warning-light text-warning" },
    "answered-review": { text: "Answered & Marked", class: "bg-warning-light text-warning" },
    "not-visited": { text: "Not Visited", class: "bg-slate-100 text-slate-500" },
  };

  const answeredCount = exam.questions.filter(
    (q) => attempt.answers[q.id] && attempt.answers[q.id].trim() !== ""
  ).length;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Exam header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate">
              {exam.title}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {exam.questions.length} Questions · {exam.durationMinutes} min
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Timer remainingSeconds={remainingSeconds} totalSeconds={totalSeconds} />
            <button
              onClick={() => setPaletteOpen(!paletteOpen)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Toggle question palette"
            >
              {paletteOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question area */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            {/* Question header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400">
                  Q{attempt.currentIndex + 1}
                  <span className="text-slate-300"> / {exam.questions.length}</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${statusBadge[status].class}`}>
                  {statusBadge[status].text}
                </span>
              </div>
              {currentQuestion.subject && (
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {currentQuestion.subject}
                </span>
              )}
            </div>

            {/* Question text */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-5 animate-fade-in" key={currentQuestion.id}>
              <p className="text-lg text-slate-800 font-medium leading-relaxed mb-6">
                {currentQuestion.question}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = attempt.answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(option)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        isSelected
                          ? "border-primary bg-primary-light"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span
                        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className={`text-slate-800 ${isSelected ? "font-semibold" : ""}`}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleReview}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  attempt.reviewFlags[currentQuestion.id]
                    ? "bg-warning text-white hover:bg-warning-700"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Flag className="w-4 h-4" />
                {attempt.reviewFlags[currentQuestion.id] ? "Marked" : "Mark for Review"}
              </button>

              <button
                onClick={clearResponse}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                <Eraser className="w-4 h-4" />
                Clear Response
              </button>

              <div className="flex-1" />

              <button
                onClick={() => goToQuestion(attempt.currentIndex - 1)}
                disabled={attempt.currentIndex === 0}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-medium text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {attempt.currentIndex < exam.questions.length - 1 ? (
                <button
                  onClick={() => goToQuestion(attempt.currentIndex + 1)}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-medium text-sm bg-primary hover:bg-primary-dark text-white transition-all active:scale-[0.98]"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setSubmitModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm bg-success hover:bg-success-600 text-white transition-all active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Palette sidebar — desktop */}
        <div className="hidden lg:block w-80 shrink-0 bg-white border-l border-slate-200">
          <QuestionPalette
            questions={exam.questions}
            currentIndex={attempt.currentIndex}
            answers={attempt.answers}
            reviewFlags={attempt.reviewFlags}
            visitedStatus={attempt.visitedStatus}
            onJump={goToQuestion}
          />
          <div className="border-t border-slate-100 p-4">
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm bg-success hover:bg-success-600 text-white transition-all active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              Submit Exam
            </button>
          </div>
        </div>

        {/* Palette drawer — mobile */}
        {paletteOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setPaletteOpen(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-white animate-slide-in-right flex flex-col">
              <QuestionPalette
                questions={exam.questions}
                currentIndex={attempt.currentIndex}
                answers={attempt.answers}
                reviewFlags={attempt.reviewFlags}
                visitedStatus={attempt.visitedStatus}
                onJump={goToQuestion}
              />
              <div className="border-t border-slate-100 p-4">
                <button
                  onClick={() => {
                    setPaletteOpen(false);
                    setSubmitModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm bg-success hover:bg-success-600 text-white transition-all"
                >
                  <Send className="w-4 h-4" />
                  Submit Exam
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit confirmation modal */}
      <Modal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit Exam?"
        footer={
          <>
            <button
              onClick={() => setSubmitModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Keep Going
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success hover:bg-success-600 text-white font-semibold transition-all"
            >
              <Send className="w-4 h-4" />
              Submit Now
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-warning-light">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700">
              You have answered <span className="font-bold">{answeredCount}</span> out of{" "}
              <span className="font-bold">{exam.questions.length}</span> questions.
              {answeredCount < exam.questions.length && (
                <> {exam.questions.length - answeredCount} questions are still unanswered.</>
              )}
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Once submitted, you cannot change your answers. You will see your results immediately.
          </p>
        </div>
      </Modal>
    </div>
  );
}
