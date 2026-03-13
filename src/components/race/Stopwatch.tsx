import { formatStopwatch } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StopwatchProps {
  elapsedMs: number;
}

export default function Stopwatch({ elapsedMs }: StopwatchProps) {
  return (
    <div className={cn("flex items-center justify-center py-4")}>
      <span className="font-mono text-5xl sm:text-6xl tabular-nums tracking-tight">
        {formatStopwatch(elapsedMs)}
      </span>
    </div>
  );
}
