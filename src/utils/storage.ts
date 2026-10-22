import type {
  User,
  ActiveAttempt,
  HistoryEntry,
  Question,
  AnswerMap,
  ReviewFlagMap,
  VisitedMap,
} from "@/types";

// Schema version for forward compatibility and validation
export const SCHEMA_VERSION = 1;

const KEYS = {
  USER: "exam_app_user",
  ATTEMPT: "exam_app_active_attempt",
  HISTORY: "exam_app_history",
} as const;

// ---------- Generic helpers ----------

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWrite(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage might be full or unavailable — silently fail
  }
}

// ---------- User ----------

export function loadUser(): User | null {
  const user = safeParse<User>(localStorage.getItem(KEYS.USER));
  if (!user) return null;

  if (
    typeof user.userId === "string" &&
    typeof user.name === "string" &&
    typeof user.emailOrRoll === "string" &&
    typeof user.targetExam === "string" &&
    typeof user.isLoggedIn === "boolean"
  ) {
    return user;
  }
  // Corrupt data — clear it
  localStorage.removeItem(KEYS.USER);
  return null;
}

export function saveUser(user: User): void {
  safeWrite(KEYS.USER, user);
}

export function clearUser(): void {
  localStorage.removeItem(KEYS.USER);
}

// ---------- Active Attempt ----------

function isValidAttempt(data: unknown): data is ActiveAttempt {
  if (!data || typeof data !== "object") return false;
  const a = data as Record<string, unknown>;
  return (
    typeof a.examId === "string" &&
    typeof a.startTime === "number" &&
    typeof a.deadlineTimestamp === "number" &&
    typeof a.currentIndex === "number" &&
    typeof a.isSubmitted === "boolean" &&
    typeof a.answers === "object" &&
    typeof a.reviewFlags === "object" &&
    typeof a.visitedStatus === "object"
  );
}

export function loadAttempt(): ActiveAttempt | null {
  const attempt = safeParse<ActiveAttempt>(localStorage.getItem(KEYS.ATTEMPT));
  if (!attempt) return null;
  if (!isValidAttempt(attempt)) {
    localStorage.removeItem(KEYS.ATTEMPT);
    return null;
  }
  // Ensure optional fields exist with safe defaults
  if (typeof attempt.questionTimings !== "object" || attempt.questionTimings === null) {
    attempt.questionTimings = {};
  }
  if (typeof attempt.lastQuestionEnterTime !== "number") {
    attempt.lastQuestionEnterTime = Date.now();
  }
  if (typeof attempt.examTitle !== "string") {
    attempt.examTitle = "Exam";
  }
  return attempt;
}

export function saveAttempt(attempt: ActiveAttempt): void {
  safeWrite(KEYS.ATTEMPT, attempt);
}

export function clearAttempt(): void {
  localStorage.removeItem(KEYS.ATTEMPT);
}

export function createAttempt(
  examId: string,
  examTitle: string,
  durationMinutes: number,
  questions: Question[]
): ActiveAttempt {
  const now = Date.now();
  return {
    examId,
    examTitle,
    startTime: now,
    deadlineTimestamp: now + durationMinutes * 60 * 1000,
    currentIndex: 0,
    answers: {} as AnswerMap,
    reviewFlags: {} as ReviewFlagMap,
    visitedStatus: { [questions[0]?.id]: true } as VisitedMap,
    isSubmitted: false,
    questionTimings: {},
    lastQuestionEnterTime: now,
  };
}

// ---------- History ----------

function isValidHistoryEntry(data: unknown): data is HistoryEntry {
  if (!data || typeof data !== "object") return false;
  const e = data as Record<string, unknown>;
  return (
    typeof e.attemptId === "string" &&
    typeof e.examId === "string" &&
    typeof e.examTitle === "string" &&
    typeof e.date === "string" &&
    typeof e.totalQuestions === "number" &&
    typeof e.attempted === "number" &&
    typeof e.correct === "number" &&
    typeof e.incorrect === "number" &&
    typeof e.score === "number" &&
    typeof e.accuracy === "number" &&
    typeof e.timeSpentSeconds === "number"
  );
}

export function loadHistory(): HistoryEntry[] {
  const history = safeParse<HistoryEntry[]>(localStorage.getItem(KEYS.HISTORY));
  if (!history || !Array.isArray(history)) return [];
  return history.filter(isValidHistoryEntry);
}

export function addHistoryEntry(entry: HistoryEntry): void {
  const history = loadHistory();
  // Prevent duplicate entries by attemptId
  if (history.some((h) => h.attemptId === entry.attemptId)) return;
  history.unshift(entry);
  safeWrite(KEYS.HISTORY, history);
}

export function clearHistory(): void {
  localStorage.removeItem(KEYS.HISTORY);
}

export { KEYS };
