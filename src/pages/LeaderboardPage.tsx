import { useState, useCallback, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useSessionStore } from "@/store/session-store";
import { DISCIPLINES, getMedalStyle } from "@/lib/constants";
import { formatValue } from "@/lib/utils";
import { AgeGroupBadge } from "@/components/AgeGroupBadge";
import {
  computeLeaderboard,
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
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Monitor } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { TVMode } from "@/components/session/TVMode";

// Row highlight classes by rank
const ROW_ACCENT: Record<number, string> = {
  1: "bg-yellow-400/8 border-l-2 border-l-yellow-400",
  2: "bg-zinc-400/6 border-l-2 border-l-zinc-400",
  3: "bg-orange-700/6 border-l-2 border-l-orange-700",
};

export default function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = useSessionStore((s) => s.sessions.find((sess) => sess.id === id));
  const allAthletes = useSessionStore((s) => s.athletes);
  const { t } = useTranslation();

  const [tvMode, setTvMode] = useState(() => searchParams.get("tv") === "1");
  const [ageGroupFilter, setAgeGroupFilter] = useState<AgeGroupFilter>("All");

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

  // Disciplines with at least one result in this session
  const availableDisciplines = useMemo(() => {
    if (!session) return [];
    return [...new Set(session.heats.map((h) => h.disciplineType))].filter(
      (d) => d !== "custom" && DISCIPLINES[d],
    );
  }, [session]);

  // Compute leaderboards for every discipline at once
  const sections = useMemo(() => {
    if (!session) return [];
    return availableDisciplines.map((discipline) => {
      const { entries, hasYobData } = computeLeaderboard(
        session,
        discipline,
        allAthletes,
        ageGroupFilter,
      );
      return { discipline, entries, hasYobData };
    }).filter((s) => s.entries.length > 0);
  }, [session, availableDisciplines, allAthletes, ageGroupFilter]);

  const hasYobData = sections.some((s) => s.hasYobData);

  // I7: count athletes without birth year (hidden by age group filter)
  const athletesWithoutYob = useMemo(() => {
    if (!session || ageGroupFilter === "All") return 0;
    const sessionAthletes = allAthletes.filter((a) => session.athleteIds.includes(a.id));
    return sessionAthletes.filter((a) => a.yearOfBirth == null).length;
  }, [session, allAthletes, ageGroupFilter]);

  // I6: pass all sections to TV mode for auto-rotation
  const tvSections = sections.map(({ discipline, entries }) => ({ discipline, entries }));

  if (!session || !id) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t.sessionNotFound}
      </div>
    );
  }

  if (tvMode) {
    return (
      <TVMode
        entries={tvSections[0]?.entries ?? []}
        discipline={tvSections[0]?.discipline ?? "sprint_60"}
        onExit={exitTvMode}
        allSections={tvSections}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link to={ROUTES.SESSION(id)} />}>
          <ArrowLeft className="h-5 w-5" />
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

      {/* ── Age group filter ── */}
      {hasYobData && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground shrink-0">{t.leaderboardAgeGroupFilter}</span>
          <Select value={ageGroupFilter} onValueChange={(v) => setAgeGroupFilter(v as AgeGroupFilter)}>
            <SelectTrigger className="w-36 h-8 text-base md:text-sm">
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
          {athletesWithoutYob > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {t.athletesWithoutYob.replace("{count}", String(athletesWithoutYob))}
            </span>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {sections.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Trophy className="h-14 w-14 text-muted-foreground/30 animate-float" strokeWidth={1.25} />
          <p className="text-muted-foreground max-w-xs">{t.leaderboardNoResults}</p>
        </div>
      )}

      {/* ── Discipline sections ── */}
      <div className="space-y-4">
        {sections.map(({ discipline, entries }, sectionIdx) => {
          const config = DISCIPLINES[discipline];
          const label = t.disciplines[discipline] ?? discipline;

          return (
            <div
              key={discipline}
              className="rounded-xl border overflow-hidden bg-card"
              style={{ animationDelay: `${sectionIdx * 60}ms` }}
            >
              {/* Section header */}
              <div className="flex items-center gap-2.5 bg-muted/40 px-4 py-2.5 border-b">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon icon={config?.icon ?? "mdi:medal"} width={16} />
                </span>
                <span className="font-semibold text-sm tracking-wide uppercase">
                  {label}
                </span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {entries.length}
                </span>
              </div>

              {/* Ranked rows */}
              <div className="divide-y">
                {entries.map((entry) => {
                  const medalStyle = getMedalStyle(entry.rank);
                  const rowAccent = ROW_ACCENT[entry.rank] ?? "";

                  return (
                    <div
                      key={entry.athleteId}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 transition-colors",
                        rowAccent,
                      )}
                    >
                      {/* Rank badge */}
                      <div className="w-7 shrink-0 flex justify-center">
                        {medalStyle ? (
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                              medalStyle,
                            )}
                          >
                            {entry.rank}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground tabular-nums">
                            {entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <AthleteAvatar
                        name={entry.athlete?.name ?? "?"}
                        avatarBase64={entry.athlete?.avatarBase64}
                        size="sm"
                        className={cn(entry.rank === 1 && "ring-2 ring-yellow-400/60")}
                      />

                      {/* Name + age group */}
                      <div className="flex flex-1 items-center gap-1.5 min-w-0">
                        <span
                          className={cn(
                            "truncate text-sm",
                            entry.rank === 1 ? "font-bold" : "font-medium",
                          )}
                        >
                          {entry.athlete?.name ?? entry.athleteId}
                        </span>
                        <AgeGroupBadge yearOfBirth={entry.athlete?.yearOfBirth} referenceYear={new Date(session.date).getFullYear()} />
                      </div>

                      {/* Best value */}
                      <span
                        className={cn(
                          "shrink-0 font-mono text-sm tabular-nums",
                          entry.rank === 1
                            ? "font-bold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {config ? formatValue(entry.bestValue, config.unit) : entry.bestValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
