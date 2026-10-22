import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateScore,
  getRemainingSeconds,
  formatTime,
  getQuestionStatus,
  generateAttemptId,
} from "@/utils/examLogic";
import type { Question, AnswerMap, ReviewFlagMap, VisitedMap } from "@/types";

const sampleQuestions: Question[] = [
  { id: "q1", question: "Q1?", options: ["A", "B", "C", "D"], correctAnswer: "A", explanation: "" },
  { id: "q2", question: "Q2?", options: ["A", "B", "C", "D"], correctAnswer: "B", explanation: "" },
  { id: "q3", question: "Q3?", options: ["A", "B", "C", "D"], correctAnswer: "C", explanation: "" },
  { id: "q4", question: "Q4?", options: ["A", "B", "C", "D"], correctAnswer: "D", explanation: "" },
];

describe("calculateScore", () => {
  it("calculates correct score with all correct answers", () => {
    const answers: AnswerMap = { q1: "A", q2: "B", q3: "C", q4: "D" };
    const result = calculateScore(sampleQuestions, answers);
    expect(result.correct).toBe(4);
    expect(result.attempted).toBe(4);
    expect(result.score).toBe(100);
    expect(result.accuracy).toBe(100);
  });

  it("calculates partial score correctly", () => {
    const answers: AnswerMap = { q1: "A", q2: "A", q3: "C", q4: "D" };
    const result = calculateScore(sampleQuestions, answers);
    expect(result.correct).toBe(3);
    expect(result.incorrect).toBe(1);
    expect(result.attempted).toBe(4);
    expect(result.score).toBe(75);
    expect(result.accuracy).toBe(75);
  });

  it("handles zero attempts (no NaN/Infinity)", () => {
    const answers: AnswerMap = {};
    const result = calculateScore(sampleQuestions, answers);
    expect(result.attempted).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.accuracy).toBe(0);
    expect(result.score).toBe(0);
    expect(Number.isNaN(result.accuracy)).toBe(false);
    expect(Number.isFinite(result.accuracy)).toBe(true);
  });

  it("calculates accuracy separately from score", () => {
    // 1 correct out of 1 attempted out of 4 total
    const answers: AnswerMap = { q1: "A" };
    const result = calculateScore(sampleQuestions, answers);
    expect(result.correct).toBe(1);
    expect(result.attempted).toBe(1);
    expect(result.score).toBe(25); // 1/4 * 100
    expect(result.accuracy).toBe(100); // 1/1 * 100
  });

  it("handles empty questions array", () => {
    const result = calculateScore([], {});
    expect(result.totalQuestions).toBe(0);
    expect(result.score).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  it("handles all wrong answers", () => {
    const answers: AnswerMap = { q1: "D", q2: "A", q3: "A", q4: "A" };
    const result = calculateScore(sampleQuestions, answers);
    expect(result.correct).toBe(0);
    expect(result.attempted).toBe(4);
    expect(result.score).toBe(0);
    expect(result.accuracy).toBe(0);
  });
});

describe("getRemainingSeconds", () => {
  it("returns positive remaining time", () => {
    const deadline = Date.now() + 5000; // 5 seconds from now
    const remaining = getRemainingSeconds(deadline);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(5);
  });

  it("returns 0 when deadline has passed", () => {
    const deadline = Date.now() - 10000; // 10 seconds ago
    const remaining = getRemainingSeconds(deadline);
    expect(remaining).toBe(0);
  });

  it("returns 0 at exactly deadline", () => {
    const deadline = Date.now();
    const remaining = getRemainingSeconds(deadline);
    expect(remaining).toBe(0);
  });
});

describe("formatTime", () => {
  it("formats hours, minutes, seconds correctly", () => {
    expect(formatTime(3661)).toBe("01:01:01");
    expect(formatTime(0)).toBe("00:00:00");
    expect(formatTime(59)).toBe("00:00:59");
    expect(formatTime(3600)).toBe("01:00:00");
    expect(formatTime(900)).toBe("00:15:00");
  });
});

describe("getQuestionStatus", () => {
  const emptyAnswers: AnswerMap = {};
  const emptyReview: ReviewFlagMap = {};
  const emptyVisited: VisitedMap = {};

  it("returns not-visited for unvisited questions", () => {
    expect(getQuestionStatus("q1", emptyAnswers, emptyReview, emptyVisited)).toBe("not-visited");
  });

  it("returns unanswered for visited but not answered", () => {
    const visited: VisitedMap = { q1: true };
    expect(getQuestionStatus("q1", emptyAnswers, emptyReview, visited)).toBe("unanswered");
  });

  it("returns answered for answered questions", () => {
    const answers: AnswerMap = { q1: "A" };
    const visited: VisitedMap = { q1: true };
    expect(getQuestionStatus("q1", answers, emptyReview, visited)).toBe("answered");
  });

  it("returns review for marked but not answered", () => {
    const review: ReviewFlagMap = { q1: true };
    const visited: VisitedMap = { q1: true };
    expect(getQuestionStatus("q1", emptyAnswers, review, visited)).toBe("review");
  });

  it("returns answered-review for answered and marked", () => {
    const answers: AnswerMap = { q1: "A" };
    const review: ReviewFlagMap = { q1: true };
    const visited: VisitedMap = { q1: true };
    expect(getQuestionStatus("q1", answers, review, visited)).toBe("answered-review");
  });

  it("returns answered even if not explicitly visited", () => {
    const answers: AnswerMap = { q1: "A" };
    expect(getQuestionStatus("q1", answers, emptyReview, emptyVisited)).toBe("answered");
  });
});

describe("generateAttemptId", () => {
  it("generates unique IDs", () => {
    const id1 = generateAttemptId();
    const id2 = generateAttemptId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^attempt-\d+-/);
  });
});
