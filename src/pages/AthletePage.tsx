import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSessionStore } from '@/store/session-store';
import { DISCIPLINES, getMedalStyle } from '@/lib/constants';
import { formatValue } from '@/lib/utils';
import { AgeGroupBadge } from '@/components/AgeGroupBadge';
import { GenderBadge } from '@/components/GenderBadge';
import { AthleteAvatar } from '@/components/ui/athlete-avatar';
import { computeLeaderboard } from '@/hooks/useLeaderboard';
import { useTranslation } from '@/lib/i18n';
import { formatLocalDate } from '@/lib/locale';
import { ROUTES } from '@/routes';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

interface PBEntry {
  discipline: string;
  value: number;
  unit: string;
  sessionId: string;
  sessionName: string;
  sessionDate: string;
  /** value of the first-ever result for this discipline (to show trend) */
  firstValue: number;
}

interface SessionResult {
  discipline: string;
  value: number;
  unit: string;
  rank: number | null;
}

interface SessionEntry {
  sessionId: string;
  sessionName: string;
  sessionDate: string;
  results: SessionResult[];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AthletePage() {
  const { id } = useParams<{ id: string }>();
  const athlete = useSessionStore((s) => s.athletes.find((a) => a.id === id));
  const allAthletes = useSessionStore((s) => s.athletes);
  const sessions = useSessionStore((s) => s.sessions);
  const { t } = useTranslation();

  const { personalBests, sessionEntries, totalResults, totalSessions } = useMemo(() => {
    if (!id) return { personalBests: [], sessionEntries: [], totalResults: 0, totalSessions: 0 };

    // Sort sessions chronologically (oldest first) for trend computation
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

    // Track: discipline -> list of {value, sessionId, sessionName, sessionDate} ordered chronologically
    const disciplineHistory = new Map<
      string,
      { value: number; sessionId: string; sessionName: string; sessionDate: string }[]
    >();

    for (const session of sorted) {
      for (const heat of session.heats) {
        if (heat.disciplineType === 'custom') continue;
        const config = DISCIPLINES[heat.disciplineType];
        if (!config) continue;
        const result = heat.results.find((r) => r.athleteId === id);
        if (!result) continue;

        const existing = disciplineHistory.get(heat.disciplineType) ?? [];
        existing.push({
          value: result.value,
          sessionId: session.id,
          sessionName: session.name,
          sessionDate: session.date,
        });
        disciplineHistory.set(heat.disciplineType, existing);
      }
    }

    // Build personal bests
    const pbMap = new Map<string, PBEntry>();
    for (const [discipline, history] of disciplineHistory.entries()) {
      const config = DISCIPLINES[discipline];
      if (!config) continue;
      let best = history[0];
      for (const entry of history) {
        const isBetter = config.sortAscending ? entry.value < best.value : entry.value > best.value;
        if (isBetter) best = entry;
      }
      pbMap.set(discipline, {
        discipline,
        value: best.value,
        unit: config.unit,
        sessionId: best.sessionId,
        sessionName: best.sessionName,
        sessionDate: best.sessionDate,
        firstValue: history[0].value,
      });
    }

    // Sort PBs: disciplines with most sessions first, then alphabetically
    const personalBests = Array.from(pbMap.values()).sort(
      (a, b) => (disciplineHistory.get(b.discipline)?.length ?? 0) - (disciplineHistory.get(a.discipline)?.length ?? 0)
    );

    // Build session history (most recent first)
    const sessionEntries: SessionEntry[] = [];
    let totalResults = 0;

    for (const session of [...sorted].reverse()) {
      const results: SessionResult[] = [];

      const disciplinesInSession = [
        ...new Set(
          session.heats
            .filter((h) => h.disciplineType !== 'custom' && DISCIPLINES[h.disciplineType])
            .filter((h) => h.results.some((r) => r.athleteId === id))
            .map((h) => h.disciplineType)
        ),
      ];

      for (const discipline of disciplinesInSession) {
        const config = DISCIPLINES[discipline];
        if (!config) continue;

        // I5: iterate ALL heats to find best result for this athlete/discipline
        let bestValue: number | null = null;
        for (const h of session.heats) {
          if (h.disciplineType !== discipline) continue;
          for (const r of h.results) {
            if (r.athleteId !== id) continue;
            if (bestValue === null) bestValue = r.value;
            else {
              const isBetter = config.sortAscending ? r.value < bestValue : r.value > bestValue;
              if (isBetter) bestValue = r.value;
            }
          }
        }
        if (bestValue === null) continue;

        const { entries } = computeLeaderboard(session, discipline, allAthletes);
        const rankEntry = entries.find((e) => e.athleteId === id);

        results.push({
          discipline,
          value: bestValue,
          unit: config.unit,
          rank: rankEntry?.rank ?? null,
        });
        totalResults++;
      }

      if (results.length > 0) {
        sessionEntries.push({
          sessionId: session.id,
          sessionName: session.name,
          sessionDate: session.date,
          results,
        });
      }
    }

    const totalSessions = sessionEntries.length;
    return { personalBests, sessionEntries, totalResults, totalSessions };
  }, [id, sessions, allAthletes]);

  if (!athlete) {
    return <div className="py-12 text-center text-muted-foreground">{t.athleteNotFound}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" render={<Link to={ROUTES.ATHLETES} />}>
        <ArrowLeft className="h-4 w-4" />
        {t.athletesNav}
      </Button>

      {/* ── Profile header ── */}
      <div className="flex items-center gap-4 rounded-2xl border bg-card p-5">
        <AthleteAvatar
          name={athlete.name}
          avatarBase64={athlete.avatarBase64}
          size="md"
          className="h-16 w-16 text-xl"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{athlete.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {athlete.yearOfBirth && <span className="text-sm text-muted-foreground">*{athlete.yearOfBirth}</span>}
            <AgeGroupBadge yearOfBirth={athlete.yearOfBirth} />
            <GenderBadge gender={athlete.gender} />
          </div>
        </div>
        {/* Stats */}
        <div className="hidden sm:flex gap-5 shrink-0 text-center">
          <div>
            <p className="text-2xl font-bold tabular-nums">{totalSessions}</p>
            <p className="text-xs text-muted-foreground">{t.sessions}</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{personalBests.length}</p>
            <p className="text-xs text-muted-foreground">{t.leaderboardDiscipline}</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{totalResults}</p>
            <p className="text-xs text-muted-foreground">{t.results}</p>
          </div>
        </div>
      </div>

      {/* Mobile stats */}
      <div className="sm:hidden grid grid-cols-3 gap-2">
        {[
          { value: totalSessions, label: t.sessions },
          { value: personalBests.length, label: t.leaderboardDiscipline },
          { value: totalResults, label: t.results },
        ].map(({ value, label }) => (
          <div key={label} className="rounded-xl border bg-card p-3 text-center">
            <p className="text-xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {personalBests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Icon icon="mdi:chart-line" width={48} className="opacity-30" />
          <p className="max-w-xs text-sm">{t.noResultsAthlete}</p>
        </div>
      ) : (
        <>
          {/* ── Personal bests ── */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t.personalBests}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {personalBests.map((pb) => {
                const config = DISCIPLINES[pb.discipline];
                if (!config) return null;
                const label = t.disciplines[pb.discipline] ?? pb.discipline;
                const improved = config.sortAscending ? pb.value < pb.firstValue : pb.value > pb.firstValue;
                const unchanged = pb.value === pb.firstValue;
                return (
                  <div key={pb.discipline} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon icon={config.icon ?? 'mdi:medal'} width={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{label}</p>
                      <p className="text-lg font-bold font-mono tabular-nums leading-tight">
                        {formatValue(pb.value, config.unit)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.pbAchievedIn} {pb.sessionName}
                      </p>
                    </div>
                    {!unchanged && (
                      <span className={cn('shrink-0', improved ? 'text-emerald-500' : 'text-rose-500')}>
                        {improved ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </span>
                    )}
                    {unchanged && (
                      <span className="shrink-0 text-muted-foreground/40">
                        <Minus className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Session history ── */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t.sessionHistory}</h2>
            <div className="space-y-3">
              {sessionEntries.map((entry) => (
                <div key={entry.sessionId} className="rounded-xl border bg-card overflow-hidden">
                  {/* Session header */}
                  <Link
                    to={ROUTES.SESSION(entry.sessionId)}
                    className="flex items-center justify-between bg-muted/40 px-4 py-2.5 border-b hover:bg-muted/60 transition-colors"
                  >
                    <span className="font-semibold text-sm">{entry.sessionName}</span>
                    <span className="text-xs text-muted-foreground">{formatLocalDate(entry.sessionDate)}</span>
                  </Link>
                  {/* Results */}
                  <div className="divide-y">
                    {entry.results.map((result) => {
                      const config = DISCIPLINES[result.discipline];
                      const label = t.disciplines[result.discipline] ?? result.discipline;
                      const medalStyle = result.rank != null ? getMedalStyle(result.rank) : undefined;
                      return (
                        <div key={result.discipline} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <Icon icon={config?.icon ?? 'mdi:medal'} width={13} />
                          </span>
                          <span className="flex-1 text-sm">{label}</span>
                          <span className="font-mono text-sm tabular-nums">
                            {formatValue(result.value, config?.unit ?? 'ms')}
                          </span>
                          {result.rank != null && (
                            <span
                              className={cn(
                                'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                                medalStyle ?? 'bg-muted text-muted-foreground'
                              )}
                            >
                              {result.rank}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
