import type { Result, Child, DisciplineType } from "@/store/session-store";
import { DISCIPLINES } from "@/lib/constants";
import { cn, formatTime, formatDistance } from "@/lib/utils";

interface ResultsTableProps {
  results: Result[];
  children: Child[];
  discipline: DisciplineType;
}

const RANK_COLORS: Record<number, string> = {
  1: "text-yellow-600 font-bold",
  2: "text-gray-400 font-bold",
  3: "text-amber-700 font-bold",
};

export default function ResultsTable({
  results,
  children,
  discipline,
}: ResultsTableProps) {
  const config = DISCIPLINES[discipline];

  const filtered = results.filter((r) => r.discipline === discipline);

  const sorted = [...filtered].sort((a, b) =>
    config.sortAscending ? a.value - b.value : b.value - a.value
  );

  const childMap = new Map(children.map((c) => [c.id, c]));

  const formatValue = (value: number) =>
    config.isTimed ? formatTime(value) : formatDistance(value);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No results for {config.label} yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 px-2 text-left w-12">Rank</th>
            <th className="py-2 px-2 text-left">Athlete</th>
            <th className="py-2 px-2 text-right">Result</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((result, i) => {
            const rank = i + 1;
            const child = childMap.get(result.childId);
            return (
              <tr
                key={result.id}
                className={cn("border-b last:border-0", rank <= 3 && "bg-muted/40")}
              >
                <td className={cn("py-2 px-2", RANK_COLORS[rank])}>
                  {rank}
                </td>
                <td className="py-2 px-2">
                  {child?.name ?? "Unknown"}
                </td>
                <td className={cn("py-2 px-2 text-right font-mono", RANK_COLORS[rank])}>
                  {formatValue(result.value)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
