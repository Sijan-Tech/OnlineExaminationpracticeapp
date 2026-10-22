import { describe, it, expect, beforeEach } from "vitest";
import {
  saveUser,
  loadUser,
  clearUser,
  loadAttempt,
  saveAttempt,
  clearAttempt,
  loadHistory,
  addHistoryEntry,
  createAttempt,
  KEYS,
} from "@/utils/storage";
import type { User, ActiveAttempt, HistoryEntry, Question } from "@/types";

beforeEach(() => {
  localStorage.clear();
});

// ---------- User tests ----------

describe("User storage", () => {
  const validUser: User = {
    userId: "u1",
    name: "Test User",
    emailOrRoll: "test@example.com",
    targetExam: "GK",
    isLoggedIn: true,
  };

  it("saves and loads a valid user", () => {
    saveUser(validUser);
    const loaded = loadUser();
    expect(loaded).toEqual(validUser);
  });

  it("returns null when no user exists", () => {
    expect(loadUser()).toBeNull();
  });

  it("clears user on logout", () => {
    saveUser(validUser);
    clearUser();
    expect(loadUser()).toBeNull();
  });

  it("rejects corrupt user data and returns null", () => {
    localStorage.setItem(KEYS.USER, JSON.stringify({ garbage: true }));
    expect(loadUser()).toBeNull();
    expect(localStorage.getItem(KEYS.USER)).toBeNull();
  });

  it("rejects invalid JSON", () => {
    localStorage.setItem(KEYS.USER, "{not valid json}");
    expect(loadUser()).toBeNull();
  });

  it("rejects user with missing fields", () => {
    localStorage.setItem(
      KEYS.USER,
      JSON.stringify({ userId: "u1", name: "Test" })
    );
    expect(loadUser()).toBeNull();
  });
});

// ---------- Attempt tests ----------

const sampleQuestions: Question[] = [
  { id: "q1", question: "Q1?", options: ["A", "B"], correctAnswer: "A", explanation: "" },
  { id: "q2", question: "Q2?", options: ["A", "B"], correctAnswer: "B", explanation: "" },
];

describe("Attempt storage", () => {
  it("creates a valid attempt with correct fields", () => {
    const attempt = createAttempt("exam-1", "Test Exam", 10, sampleQuestions);
    expect(attempt.examId).toBe("exam-1");
    expect(attempt.currentIndex).toBe(0);
    expect(attempt.isSubmitted).toBe(false);
    expect(attempt.answers).toEqual({});
    expect(attempt.reviewFlags).toEqual({});
    expect(attempt.visitedStatus).toEqual({ q1: true });
    expect(attempt.deadlineTimestamp).toBeGreaterThan(attempt.startTime);
  });

  it("saves and loads an attempt", () => {
    const attempt = createAttempt("exam-1", "Test Exam", 10, sampleQuestions);
    saveAttempt(attempt);
    const loaded = loadAttempt();
    expect(loaded).toEqual(attempt);
  });

  it("returns null when no attempt exists", () => {
    expect(loadAttempt()).toBeNull();
  });

  it("clears attempt", () => {
    const attempt = createAttempt("exam-1", "Test Exam", 10, sampleQuestions);
    saveAttempt(attempt);
    clearAttempt();
    expect(loadAttempt()).toBeNull();
  });

  it("rejects corrupt attempt data", () => {
    localStorage.setItem(KEYS.ATTEMPT, JSON.stringify({ garbage: true }));
    expect(loadAttempt()).toBeNull();
    expect(localStorage.getItem(KEYS.ATTEMPT)).toBeNull();
  });

  it("rejects invalid JSON attempt", () => {
    localStorage.setItem(KEYS.ATTEMPT, "not json{{{");
    expect(loadAttempt()).toBeNull();
  });

  it("restores attempt missing optional fields with defaults", () => {
    const partial: ActiveAttempt = {
      examId: "exam-1",
      examTitle: "Test Exam",
      startTime: Date.now(),
      deadlineTimestamp: Date.now() + 600000,
      currentIndex: 0,
      answers: {},
      reviewFlags: {},
      visitedStatus: {},
      isSubmitted: false,
      questionTimings: {},
      lastQuestionEnterTime: Date.now(),
    };
    // Remove optional fields to simulate older schema
    const { questionTimings, lastQuestionEnterTime, examTitle, ...rest } = partial;
    void questionTimings;
    void lastQuestionEnterTime;
    void examTitle;
    localStorage.setItem(KEYS.ATTEMPT, JSON.stringify(rest));
    const loaded = loadAttempt();
    expect(loaded).not.toBeNull();
    expect(loaded!.questionTimings).toEqual({});
    expect(loaded!.lastQuestionEnterTime).toBeGreaterThan(0);
  });
});

// ---------- History tests ----------

describe("History storage", () => {
  const validEntry: HistoryEntry = {
    attemptId: "att-1",
    examId: "exam-1",
    examTitle: "Test Exam",
    date: new Date().toISOString(),
    totalQuestions: 10,
    attempted: 8,
    correct: 6,
    incorrect: 2,
    score: 60,
    accuracy: 75,
    timeSpentSeconds: 300,
  };

  it("saves and loads history entries", () => {
    addHistoryEntry(validEntry);
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].attemptId).toBe("att-1");
  });

  it("prevents duplicate entries by attemptId", () => {
    addHistoryEntry(validEntry);
    addHistoryEntry(validEntry); // same attemptId
    const history = loadHistory();
    expect(history).toHaveLength(1);
  });

  it("stores entries in reverse chronological order (newest first)", () => {
    addHistoryEntry({ ...validEntry, attemptId: "att-1" });
    addHistoryEntry({ ...validEntry, attemptId: "att-2" });
    const history = loadHistory();
    expect(history).toHaveLength(2);
    expect(history[0].attemptId).toBe("att-2");
  });

  it("returns empty array when no history exists", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("filters out corrupt history entries", () => {
    localStorage.setItem(
      KEYS.HISTORY,
      JSON.stringify([validEntry, { garbage: true }, { attemptId: "x" }])
    );
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].attemptId).toBe("att-1");
  });

  it("handles non-array history data", () => {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify({ not: "an array" }));
    expect(loadHistory()).toEqual([]);
  });
});

// ---------- Timer / refresh recovery test ----------

describe("Timer expiry & refresh recovery", () => {
  it("deadline timestamp survives reload and maintains correct remaining time", () => {
    const now = Date.now();
    const deadline = now + 300000; // 5 minutes
    const attempt: ActiveAttempt = {
      examId: "exam-1",
      examTitle: "Test",
      startTime: now,
      deadlineTimestamp: deadline,
      currentIndex: 2,
      answers: { q1: "A", q2: "B" },
      reviewFlags: { q3: true },
      visitedStatus: { q1: true, q2: true, q3: true },
      isSubmitted: false,
      questionTimings: {},
      lastQuestionEnterTime: now,
    };

    saveAttempt(attempt);
    const loaded = loadAttempt();
    expect(loaded).not.toBeNull();
    expect(loaded!.deadlineTimestamp).toBe(deadline);
    expect(loaded!.currentIndex).toBe(2);
    expect(loaded!.answers).toEqual({ q1: "A", q2: "B" });
    expect(loaded!.reviewFlags).toEqual({ q3: true });
    expect(loaded!.visitedStatus).toEqual({ q1: true, q2: true, q3: true });
  });

  it("expired attempt is detected as expired after reload", () => {
    const pastTime = Date.now() - 1000;
    const attempt: ActiveAttempt = {
      examId: "exam-1",
      examTitle: "Test",
      startTime: pastTime - 600000,
      deadlineTimestamp: pastTime,
      currentIndex: 0,
      answers: {},
      reviewFlags: {},
      visitedStatus: {},
      isSubmitted: false,
      questionTimings: {},
      lastQuestionEnterTime: pastTime,
    };

    saveAttempt(attempt);
    const loaded = loadAttempt();
    expect(loaded).not.toBeNull();
    // Simulate the check that App.tsx does on hydration
    const remaining = loaded!.deadlineTimestamp - Date.now();
    expect(remaining).toBeLessThanOrEqual(0);
  });
});
