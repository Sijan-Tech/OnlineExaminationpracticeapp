import { Clock } from "lucide-react";

interface TimerProps {
  remainingSeconds: number;
  totalSeconds: number;
}

export default function Timer({ remainingSeconds, totalSeconds }: TimerProps) {
  const isDanger = remainingSeconds <= 60;
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60;

  const hours = Math.floor(remainingSeconds / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);
  const secs = remainingSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const display = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

  const bgClass = isDanger
    ? "bg-danger-light text-danger"
    : isWarning
    ? "bg-warning-light text-warning"
    : "bg-primary-light text-primary";

  const ringClass = isDanger ? "animate-pulse-ring" : "";

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${bgClass} ${ringClass} transition-colors`}
    >
      <Clock className="w-5 h-5" />
      <span>{display}</span>
    </div>
  );
}
