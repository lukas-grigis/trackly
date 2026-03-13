import { Check } from "lucide-react";
import type { Child } from "@/store/session-store";
import { cn, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChildTapButtonProps {
  child: Child;
  finishTime: number | null;
  onTap: () => void;
}

export default function ChildTapButton({
  child,
  finishTime,
  onTap,
}: ChildTapButtonProps) {
  const finished = finishTime !== null;

  return (
    <Button
      variant={finished ? "secondary" : "default"}
      className={cn(
        "min-h-16 w-full text-lg transition-all duration-200",
        finished && "opacity-60"
      )}
      disabled={finished}
      onClick={onTap}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          {finished && <Check className="size-5" />}
          <span>{child.name}</span>
        </div>
        {finished && (
          <span className="text-xs font-mono">{formatTime(finishTime)}</span>
        )}
      </div>
    </Button>
  );
}
