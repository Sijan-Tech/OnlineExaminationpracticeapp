export interface User {
  userId: string;
  name: string;
  emailOrRoll: string;
  targetExam: string;
  isLoggedIn: boolean;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject?: string;
}

export interface Exam {
  examId: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  questions: Question[];
}

export type AnswerMap = Record<string, string>;
export type ReviewFlagMap = Record<string, boolean>;
export type VisitedMap = Record<string, boolean>;

export interface ActiveAttempt {
  examId: string;
  examTitle: string;
  startTime: number;
  deadlineTimestamp: number;
  currentIndex: number;
  answers: AnswerMap;
  reviewFlags: ReviewFlagMap;
  visitedStatus: VisitedMap;
  isSubmitted: boolean;
  questionTimings: Record<string, number>;
  lastQuestionEnterTime: number;
}

export interface HistoryEntry {
  attemptId: string;
  examId: string;
  examTitle: string;
  date: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  score: number;
  accuracy: number;
  timeSpentSeconds: number;
}

export type QuestionStatus =
  | "answered"
  | "unanswered"
  | "review"
  | "answered-review"
  | "not-visited";
