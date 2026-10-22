import { LogOut, User as UserIcon, GraduationCap } from "lucide-react";
import type { User } from "@/types";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onLogoClick: () => void;
}

export default function Navbar({ user, onLogout, onLogoClick }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">ExamPractice</span>
          </button>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{user.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:bg-danger-light hover:text-danger transition-colors text-sm font-medium"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
