import type {
  Question,
  AnswerMap,
  ReviewFlagMap,
  VisitedMap,
} from "@/types";
import { getQuestionStatus } from "@/utils/examLogic";

interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  answers: AnswerMap;
  reviewFlags: ReviewFlagMap;
  visitedStatus: VisitedMap;
  onJump: (index: number) => void;
}

const statusConfig = {
  answered: { bg: "bg-success text-white", label: "Answered" },
  unanswered: { bg: "bg-danger text-white", label: "Not Answered" },
  review: { bg: "bg-warning text-white", label: "Marked for Review" },
  "answered-review": { bg: "bg-warning text-white ring-2 ring-success", label: "Answered & Marked" },
  "not-visited": { bg: "bg-slate-200 text-slate-600", label: "Not Visited" },
};

export default function QuestionPalette({
  questions,
  currentIndex,
  answers,
  reviewFlags,
  visitedStatus,
  onJump,
}: QuestionPaletteProps) {
  const statusCounts = {
    answered: 0,
    unanswered: 0,
    review: 0,
    "answered-review": 0,
    "not-visited": 0,
  };

  questions.forEach((q) => {
    const status = getQuestionStatus(q.id, answers, reviewFlags, visitedStatus);
    statusCounts[status]++;
  });

  const legend: { key: keyof typeof statusCounts; label: string; color: string; ring?: string }[] = [
    { key: "answered", label: "Answered", color: "bg-success" },
    { key: "unanswered", label: "Not Answered", color: "bg-danger" },
    { key: "answered-review", label: "Answered & Marked", color: "bg-warning", ring: "ring-2 ring-success" },
    { key: "review", label: "Marked for Review", color: "bg-warning" },
    { key: "not-visited", label: "Not Visited", color: "bg-slate-300" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Question Palette</h3>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 space-y-2 border-b border-slate-100">
        {legend.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-xs text-slate-600">
            <div className={`w-4 h-4 rounded ${item.color} ${item.ring || ""}`} />
            <span>{item.label}</span>
            <span className="ml-auto font-bold text-slate-800">
              {statusCounts[item.key]}
            </span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const status = getQuestionStatus(q.id, answers, reviewFlags, visitedStatus);
            const cfg = statusConfig[status];
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => onJump(idx)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all hover:scale-110 ${cfg.bg} ${
                  isCurrent ? "ring-2 ring-slate-800 ring-offset-1" : ""
                }`}
                title={cfg.label}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
