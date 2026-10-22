import { useState } from "react";
import { GraduationCap, User, Mail, Target, ArrowRight } from "lucide-react";
import type { User as UserType } from "@/types";
import { generateUserId } from "@/utils/examLogic";
import { exams } from "@/data/questions";

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState("");
  const [emailOrRoll, setEmailOrRoll] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emailOrRoll.trim() || !targetExam) {
      setError("Please fill in all fields.");
      return;
    }

    const user: UserType = {
      userId: generateUserId(),
      name: name.trim(),
      emailOrRoll: emailOrRoll.trim(),
      targetExam,
      isLoggedIn: true,
    };

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">ExamPractice</h1>
          <p className="text-slate-500 mt-2">Sign in to start your practice exams</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-5 animate-fade-in"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-slate-800"
                placeholder="e.g. John Doe"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Roll Number or Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={emailOrRoll}
                onChange={(e) => setEmailOrRoll(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-slate-800"
                placeholder="e.g. ROLL2024 or you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Target Exam
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-slate-800 appearance-none bg-white cursor-pointer"
              >
                <option value="">Select an exam</option>
                {exams.map((exam) => (
                  <option key={exam.examId} value={exam.title}>
                    {exam.title}
                  </option>
                ))}
                <option value="Other">Other / General Practice</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger-light px-4 py-2.5 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98]"
          >
            Start Practicing
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Your data is stored locally on this device only.
        </p>
      </div>
    </div>
  );
}
