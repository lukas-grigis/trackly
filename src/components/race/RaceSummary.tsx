import type { Child } from "@/store/session-store";
import { cn, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface RaceResult {
  child: Child;
  time: number;
}

interface RaceSummaryProps {
  results: RaceResult[];
  onDone: () => void;
}

const RANK_COLORS: Record<number, string> = {
  1: "text-yellow-600",
  2: "text-gray-400",
  3: "text-amber-700",
};

export default function RaceSummary({ results, onDone }: RaceSummaryProps) {
  const sorted = [...results].sort((a, b) => a.time - b.time);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 text-xl font-bold">
        <Trophy className="size-6 text-yellow-600" />
        <span>Race Results</span>
      </div>

      <div className="space-y-2">
        {sorted.map((result, i) => {
          const rank = i + 1;
          return (
            <div
              key={result.child.id}
              className={cn(
                "flex items-center justify-between rounded-md border px-4 py-3",
                rank <= 3 && "bg-muted/40"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-lg font-bold w-8",
                    RANK_COLORS[rank]
                  )}
                >
                  {rank}
                </span>
                <span className="font-medium">{result.child.name}</span>
              </div>
              <span
                className={cn("font-mono text-sm", RANK_COLORS[rank])}
              >
                {formatTime(result.time)}
              </span>
            </div>
          );
        })}
      </div>

      <Button onClick={onDone} className="w-full" size="lg">
        Done
      </Button>
    </div>
  );
}
