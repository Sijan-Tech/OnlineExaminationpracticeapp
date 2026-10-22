import type {
  Question,
  AnswerMap,
  ReviewFlagMap,
  VisitedMap,
  QuestionStatus,
} from "@/types";

// ---------- Scoring ----------

export interface ScoreResult {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  score: number;
  accuracy: number;
}

export function calculateScore(
  questions: Question[],
  answers: AnswerMap
): ScoreResult {
  const totalQuestions = questions.length;
  let correct = 0;
  let attempted = 0;

  for (const q of questions) {
    const userAnswer = answers[q.id];
    if (userAnswer && userAnswer.trim() !== "") {
      attempted++;
      if (userAnswer === q.correctAnswer) {
        correct++;
      }
    }
  }

  const incorrect = attempted - correct;
  // Score = correct / total (always based on total questions)
  const score = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
  // Accuracy = correct / attempted (guard against divide-by-zero)
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

  return {
    totalQuestions,
    attempted,
    correct,
    incorrect,
    score: Math.round(score * 100) / 100,
    accuracy: Math.round(accuracy * 100) / 100,
  };
}

// ---------- Timer ----------

export function getRemainingSeconds(deadlineTimestamp: number): number {
  const remaining = deadlineTimestamp - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

// ---------- Question Status ----------

export function getQuestionStatus(
  questionId: string,
  answers: AnswerMap,
  reviewFlags: ReviewFlagMap,
  visitedStatus: VisitedMap
): QuestionStatus {
  const isAnswered = !!answers[questionId] && answers[questionId].trim() !== "";
  const isMarkedReview = !!reviewFlags[questionId];
  const isVisited = !!visitedStatus[questionId];

  if (isAnswered && isMarkedReview) return "answered-review";
  if (isAnswered) return "answered";
  if (isMarkedReview) return "review";
  if (isVisited) return "unanswered";
  return "not-visited";
}

// ---------- Utility ----------

export function generateAttemptId(): string {
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
