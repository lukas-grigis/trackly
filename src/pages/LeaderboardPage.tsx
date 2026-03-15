import { useState, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useSessionStore } from "@/store/session-store";
import { DISCIPLINES } from "@/lib/constants";
import { formatValue } from "@/lib/utils";
import {
  useLeaderboard,
  AGE_GROUP_OPTIONS,
  type AgeGroupFilter,
} from "@/hooks/useLeaderboard";
import { useTranslation } from "@/lib/i18n";
import { AthleteAvatar } from "@/components/ui/athlete-avatar";
import { ROUTES } from "@/routes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { TVMode } from "@/components/session/TVMode";

const PODIUM_STYLES = [
  "bg-yellow-400 text-yellow-900",   // gold
  "bg-slate-300 text-slate-700",     // silver
  "bg-amber-600 text-amber-100",     // bronze
] as const;

function getPodiumStyle(rank: number): string | undefined {
  if (rank === 1) return PODIUM_STYLES[0];
  if (rank === 2) return PODIUM_STYLES[1];
  if (rank === 3) return PODIUM_STYLES[2];
  return undefined;
}

export default function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = useSessionStore((s) => s.sessions.find((sess) => sess.id === id));
  const allAthletes = useSessionStore((s) => s.athletes);
  const { t } = useTranslation();

  const [tvMode, setTvMode] = useState(() => searchParams.get("tv") === "1");

  const exitTvMode = useCallback(() => {
    setTvMode(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("tv");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const enterTvMode = useCallback(() => {
    setTvMode(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tv", "1");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Find disciplines that have results in this session
  const availableDisciplines = session
    ? [...new Set(session.heats.map((h) => h.disciplineType))].filter(
        (d) => d !== "custom" && DISCIPLINES[d],
      )
    : [];

  const [discipline, setDiscipline] = useState(() =>
    availableDisciplines.length > 0 ? availableDisciplines[0] : "sprint_60",
  );
  const [ageGroupFilter, setAgeGroupFilter] = useState<AgeGroupFilter>("All");
  const [heatFilter, setHeatFilter] = useState("all");

  // Get heats for current discipline (for heat selector)
  const disciplineHeats = session
    ? session.heats.filter((h) => h.disciplineType === discipline)
    : [];

  const { entries, hasYobData } = useLeaderboard(
    session,
    discipline,
    allAthletes,
    ageGroupFilter,
    heatFilter,
  );
  const config = DISCIPLINES[discipline];

  // Reset heat filter when discipline changes (via effect-free approach: check validity)
  const validHeatFilter =
    heatFilter === "all" || disciplineHeats.some((h) => h.id === heatFilter)
      ? heatFilter
      : "all";
  if (validHeatFilter !== heatFilter) {
    setHeatFilter(validHeatFilter);
  }

  if (!session || !id) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t.sessionNotFound}
      </div>
    );
  }

  const isFiltered = ageGroupFilter !== "All" || heatFilter !== "all";

  if (tvMode) {
    return (
      <TVMode entries={entries} discipline={discipline} onExit={exitTvMode} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={ROUTES.SESSION(id)}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {t.leaderboard}
          </h1>
          <p className="text-sm text-muted-foreground">{session.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={enterTvMode}>
          <Monitor className="h-4 w-4 mr-1.5" />
          {t.tvToggle}
        </Button>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-wrap gap-3">
        {/* Discipline selector */}
        <div className="space-y-1 min-w-[160px] flex-1">
          <Label>{t.leaderboardDiscipline}</Label>
          <Select value={discipline} onValueChange={(d) => { setDiscipline(d); setHeatFilter("all"); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableDisciplines.map((d) => (
                <SelectItem key={d} value={d}>
                  {t.disciplines[d] ?? d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Heat filter */}
        {disciplineHeats.length > 1 && (
          <div className="space-y-1 min-w-[140px] flex-1">
            <Label>{t.leaderboardHeatFilter}</Label>
            <Select value={heatFilter} onValueChange={setHeatFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.leaderboardAllHeats}</SelectItem>
                {disciplineHeats.map((h, idx) => (
                  <SelectItem key={h.id} value={h.id}>
                    {t.leaderboardHeatLabel} {idx + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Age group filter — hidden when no athletes have YoB */}
        {hasYobData && (
          <div className="space-y-1 min-w-[140px] flex-1">
            <Label>{t.leaderboardAgeGroupFilter}</Label>
            <Select value={ageGroupFilter} onValueChange={(v) => setAgeGroupFilter(v as AgeGroupFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUP_OPTIONS.map((ag) => (
                  <SelectItem key={ag} value={ag}>
                    {ag === "All" ? t.leaderboardAllAgeGroups : ag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Leaderboard table */}
      {entries.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {availableDisciplines.length === 0
            ? t.leaderboardNoResults
            : isFiltered
              ? t.leaderboardNoFilterResults
              : t.leaderboardNoDisciplineResults}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">{t.rankCol}</th>
                <th className="pb-2 pr-4">{t.nameCol}</th>
                <th className="pb-2 text-right">
                  {t.leaderboardBest}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const podiumStyle = getPodiumStyle(entry.rank);
                return (
                  <tr
                    key={entry.athleteId}
                    className={cn(
                      "border-b last:border-0",
                      i % 2 === 1 && "bg-muted/30",
                    )}
                  >
                    <td className="py-2.5 pr-4 font-medium">
                      {podiumStyle ? (
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                            podiumStyle,
                          )}
                        >
                          {entry.rank}
                        </span>
                      ) : (
                        entry.rank
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-2">
                        <AthleteAvatar
                          name={entry.athlete?.name ?? "?"}
                          avatarBase64={entry.athlete?.avatarBase64}
                          size="sm"
                        />
                        {entry.athlete?.name ?? entry.athleteId}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {config
                        ? formatValue(entry.bestValue, config.unit)
                        : entry.bestValue}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
