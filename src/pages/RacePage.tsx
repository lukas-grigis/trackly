import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSessionStore } from "@/store/session-store";
import { DISCIPLINES } from "@/lib/constants";
import { isTimedDiscipline } from "@/lib/constants";
import { formatTime, formatStopwatch, cn, getAgeGroup } from "@/lib/utils";
import { GenderBadgeInline } from "@/components/GenderBadge";
import { AthleteAvatar } from "@/components/ui/athlete-avatar";
import { useTranslation } from "@/lib/i18n";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";

type Phase = "setup" | "running" | "finished" | "field-entry";

const MEDAL_COLORS = [
  "bg-yellow-400 text-yellow-900",
  "bg-slate-300 text-slate-700",
  "bg-amber-600 text-amber-100",
];

/** Split a formatStopwatch string into [beforeColon, colon, afterColon] */
function StopwatchDisplay({ value }: { value: string }) {
  const colonIdx = value.indexOf(":");
  if (colonIdx === -1) return <span>{value}</span>;
  const before = value.slice(0, colonIdx);
  const after = value.slice(colonIdx + 1);
  return (
    <>
      {before}
      <span className="animate-colon-blink">:</span>
      {after}
    </>
  );
}

export default function RacePage() {
  const { id, discipline = "sprint_60" } = useParams<{ id: string; discipline: string }>();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.sessions.find((sess) => sess.id === id));
  const allAthletes = useSessionStore((s) => s.athletes);
  const addHeat = useSessionStore((s) => s.addHeat);
  const addHeatResult = useSessionStore((s) => s.addHeatResult);
  const { t } = useTranslation();

  const disciplineConfig = DISCIPLINES[discipline] ?? DISCIPLINES["sprint_60"];

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finishTimes, setFinishTimes] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [heatId, setHeatId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Field-entry state: attempts per athlete (up to 3)
  interface Attempt {
    value: string; // raw input string
    foul: boolean;
  }
  const [fieldAttempts, setFieldAttempts] = useState<Record<string, Attempt[]>>({});
  const [fieldUnit, setFieldUnit] = useState<"m" | "cm" | "s" | "ms">("m");
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [warningAthletes, setWarningAthletes] = useState<string[]>([]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  if (!session || !id) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t.sessionNotFound}
      </div>
    );
  }

  function toggleChild(childId: string) {
    setSelectedChildren((prev) =>
      prev.includes(childId)
        ? prev.filter((c) => c !== childId)
        : [...prev, childId],
    );
  }

  function handleStart() {
    if (selectedChildren.length === 0 || !id) return;
    const nowIso = new Date().toISOString();
    const newHeatId = addHeat(id, {
      sessionId: id,
      disciplineType: discipline,
      participantIds: [...selectedChildren],
      startedAt: nowIso,
    });
    setHeatId(newHeatId);

    if (!isTimedDiscipline(discipline)) {
      // Field event — go to manual entry
      // Initialize attempts for each athlete
      const initial: Record<string, Attempt[]> = {};
      for (const cid of selectedChildren) {
        initial[cid] = [{ value: "", foul: false }];
      }
      setFieldAttempts(initial);
      // Set default unit based on discipline
      if (discipline === "long_jump" || discipline === "shot_put" || discipline === "ball_throw" || discipline === "sling_ball") {
        setFieldUnit("m"); // displayed as m, stored as cm
      } else if (discipline === "high_jump") {
        setFieldUnit("cm");
      } else {
        setFieldUnit("m"); // custom default
      }
      setPhase("field-entry");
      return;
    }

    const now = performance.now();
    setStartTime(now);
    setFinishTimes({});
    setElapsed(0);
    setPhase("running");
    intervalRef.current = setInterval(() => {
      setElapsed(performance.now() - now);
    }, 100);
  }

  function handleFinish(childId: string) {
    if (!startTime) return;
    // eslint-disable-next-line react-hooks/purity -- event handler, not called during render
    const time = performance.now() - startTime;
    setFinishTimes((prev) => {
      const next = { ...prev, [childId]: time };
      if (Object.keys(next).length >= selectedChildren.length) {
        stopTimer();
        setPhase("finished");
      }
      return next;
    });
  }

  function handleCancel() {
    stopTimer();
    setPhase("finished");
  }

  function handleSave() {
    if (!id || !session || !heatId) return;
    const now = new Date().toISOString();
    for (const [childId, value] of Object.entries(finishTimes)) {
      addHeatResult(id, heatId, {
        childId,
        value: Math.round(value),
        unit: disciplineConfig.unit,
        recordedAt: now,
      });
    }
    toast.success(t.resultsSaved);
    navigate(ROUTES.SESSION(id));
  }

  function handleReset() {
    setPhase("setup");
    setStartTime(null);
    setFinishTimes({});
    setElapsed(0);
    setHeatId(null);
    setFieldAttempts({});
    setShowSaveWarning(false);
    setWarningAthletes([]);
    stopTimer();
  }

  const rankedResults = Object.entries(finishTimes)
    .sort(([, a], [, b]) => a - b)
    .map(([childId, time], i) => ({
      rank: i + 1,
      childId,
      time,
      name: allAthletes.find((a) => a.id === childId)?.name ?? "—",
    }));

  const disciplineLabel = t.disciplines[discipline] ?? discipline;

  // SETUP PHASE
  if (phase === "setup") {
    const sessionAthletes = allAthletes.filter((a) => session.athleteIds.includes(a.id));
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t.prepareRace}</h1>
          <p className="text-sm text-muted-foreground">{disciplineLabel}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t.selectParticipants}</p>
          <div className="grid grid-cols-2 gap-2">
            {sessionAthletes.map((athlete) => {
              const selected = selectedChildren.includes(athlete.id);
              return (
                <Button
                  key={athlete.id}
                  variant={selected ? "default" : "outline"}
                  className="tap-target tap-press h-14 font-medium gap-2"
                  onClick={() => toggleChild(athlete.id)}
                >
                  <AthleteAvatar name={athlete.name} avatarBase64={athlete.avatarBase64} size="sm" />
                  <span className="flex flex-col items-start">
                    <span>{athlete.name}</span>
                    <span className="flex items-center gap-1">
                      {athlete.yearOfBirth && (
                        <span className="text-[10px] font-normal opacity-70">
                          {getAgeGroup(athlete.yearOfBirth)}
                        </span>
                      )}
                      <GenderBadgeInline gender={athlete.gender} />
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
          {session.athleteIds.length === 0 && (
            <p className="text-sm text-muted-foreground">{t.noChildrenYet}</p>
          )}
        </div>

        <Button
          className="tap-target tap-press h-20 w-full rounded-2xl text-2xl font-display tracking-wide"
          disabled={selectedChildren.length === 0}
          onClick={handleStart}
        >
          {t.start}
        </Button>
      </div>
    );
  }

  // FIELD-ENTRY PHASE
  if (phase === "field-entry") {
    const isCustom = disciplineConfig.mode === "custom";
    const displayUnit = isCustom ? fieldUnit : (discipline === "high_jump" ? "cm" : "m");
    const unitLabel = displayUnit;

    function getStoredUnit(): "cm" | "m" | "s" | "ms" {
      if (isCustom) return fieldUnit;
      // long_jump, shot_put, ball_throw, sling_ball, high_jump all store as cm
      return "cm";
    }

    function toStoredValue(inputStr: string): number | null {
      const num = parseFloat(inputStr);
      if (isNaN(num) || num < 0) return null;
      const storedUnit = getStoredUnit();
      // If display is m but stored is cm, convert
      if (displayUnit === "m" && storedUnit === "cm") {
        return Math.round(num * 100);
      }
      // If display is s and stored is ms
      if (displayUnit === "s" && storedUnit === "ms") {
        return Math.round(num * 1000);
      }
      return num;
    }

    function getBestAttemptIdx(attempts: { value: string; foul: boolean }[]): number | null {
      let bestIdx: number | null = null;
      let bestVal = -Infinity;
      for (let i = 0; i < attempts.length; i++) {
        if (attempts[i].foul) continue;
        const num = parseFloat(attempts[i].value);
        if (isNaN(num)) continue;
        if (num > bestVal) {
          bestVal = num;
          bestIdx = i;
        }
      }
      return bestIdx;
    }

    function updateAttempt(childId: string, idx: number, update: Partial<{ value: string; foul: boolean }>) {
      setFieldAttempts((prev) => {
        const attempts = [...(prev[childId] ?? [])];
        attempts[idx] = { ...attempts[idx], ...update };
        return { ...prev, [childId]: attempts };
      });
    }

    function addAttempt(childId: string) {
      setFieldAttempts((prev) => {
        const attempts = prev[childId] ?? [];
        if (attempts.length >= 3) return prev;
        return { ...prev, [childId]: [...attempts, { value: "", foul: false }] };
      });
    }

    function handleFieldSave() {
      // Check for athletes with 0 valid attempts
      const athletesWithNoResults: string[] = [];
      for (const childId of selectedChildren) {
        const attempts = fieldAttempts[childId] ?? [];
        const hasValid = attempts.some((a) => !a.foul && a.value.trim() !== "" && !isNaN(parseFloat(a.value)));
        if (!hasValid) {
          athletesWithNoResults.push(childId);
        }
      }

      if (athletesWithNoResults.length > 0 && !showSaveWarning) {
        setWarningAthletes(athletesWithNoResults);
        setShowSaveWarning(true);
        return;
      }

      // Save best result per athlete
      if (!id || !heatId) return;
      const now = new Date().toISOString();
      const storedUnit = getStoredUnit();

      for (const childId of selectedChildren) {
        const attempts = fieldAttempts[childId] ?? [];
        const bestIdx = getBestAttemptIdx(attempts);
        if (bestIdx === null) continue;
        const stored = toStoredValue(attempts[bestIdx].value);
        if (stored === null) continue;
        addHeatResult(id, heatId, {
          childId,
          value: stored,
          unit: storedUnit,
          recordedAt: now,
        });
      }

      toast.success(t.resultsSaved);
      navigate(ROUTES.SESSION(id));
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t.fieldEntry}</h1>
          <p className="text-sm text-muted-foreground">{disciplineLabel}</p>
        </div>

        {isCustom && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t.unitLabel}:</span>
            {(["m", "cm", "s", "ms"] as const).map((u) => (
              <Button
                key={u}
                size="sm"
                variant={fieldUnit === u ? "default" : "outline"}
                onClick={() => setFieldUnit(u)}
              >
                {u}
              </Button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {selectedChildren.map((childId) => {
            const athlete = allAthletes.find((a) => a.id === childId);
            const attempts = fieldAttempts[childId] ?? [];
            const bestIdx = getBestAttemptIdx(attempts);

            return (
              <div key={childId} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AthleteAvatar name={athlete?.name ?? "?"} avatarBase64={athlete?.avatarBase64} size="sm" />
                  <span>{athlete?.name ?? "—"}</span>
                </div>

                <div className="space-y-1">
                  {attempts.map((attempt, idx) => (
                    <div key={idx} className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1",
                      bestIdx === idx && !attempt.foul && "bg-primary/10 ring-1 ring-primary",
                    )}>
                      <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                      {attempt.foul ? (
                        <span className="flex-1 text-sm text-destructive font-medium">{t.foul}</span>
                      ) : (
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          className="flex-1 rounded border bg-background px-2 py-1 text-sm"
                          placeholder="0.00"
                          value={attempt.value}
                          onChange={(e) => updateAttempt(childId, idx, { value: e.target.value })}
                        />
                      )}
                      {!attempt.foul && <span className="text-xs text-muted-foreground">{unitLabel}</span>}
                      <Button
                        size="sm"
                        variant={attempt.foul ? "destructive" : "ghost"}
                        className="h-7 text-xs px-2"
                        onClick={() => updateAttempt(childId, idx, { foul: !attempt.foul, value: attempt.foul ? "" : attempt.value })}
                      >
                        {attempt.foul ? t.undoFoul : t.foul}
                      </Button>
                      {bestIdx === idx && !attempt.foul && (
                        <span className="text-xs font-bold text-primary">{t.best}</span>
                      )}
                    </div>
                  ))}
                </div>

                {attempts.length < 3 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => addAttempt(childId)}
                  >
                    + {t.addAttempt}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {showSaveWarning && (
          <div className="rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 p-3 space-y-2">
            <p className="text-sm font-medium">{t.fieldSaveWarning}</p>
            <ul className="text-sm text-muted-foreground list-disc pl-4">
              {warningAthletes.map((cid) => {
                const a = allAthletes.find((ath) => ath.id === cid);
                return <li key={cid}>{a?.name ?? "—"}</li>;
              })}
            </ul>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleFieldSave}>{t.saveAll}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowSaveWarning(false)}>{t.back}</Button>
            </div>
          </div>
        )}

        {!showSaveWarning && (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleFieldSave}>
              {t.saveAll}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              {t.abort}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // RUNNING PHASE
  if (phase === "running") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-primary p-8 text-center text-primary-foreground animate-pulse-ring">
          <div className="font-display text-7xl tabular-nums">
            <StopwatchDisplay value={formatStopwatch(elapsed)} />
          </div>
        </div>

        <div className="grid gap-2">
          {selectedChildren.map((childId) => {
            const child = allAthletes.find((a) => a.id === childId);
            const finished = childId in finishTimes;
            return (
              <button
                key={childId}
                disabled={finished}
                onClick={() => handleFinish(childId)}
                className={cn(
                  "tap-target tap-press flex w-full items-center justify-between rounded-xl px-4 py-3 text-lg font-semibold transition-colors min-h-[4rem]",
                  finished
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <span className="flex items-center gap-3">
                  <AthleteAvatar name={child?.name ?? "?"} avatarBase64={child?.avatarBase64} size="sm" />
                  <span className="flex flex-col items-start">
                    <span>{child?.name}</span>
                    <span className="flex items-center gap-1">
                      {child?.yearOfBirth && (
                        <span className="text-xs font-normal opacity-70">
                          {getAgeGroup(child.yearOfBirth)}
                        </span>
                      )}
                      <GenderBadgeInline gender={child?.gender} />
                    </span>
                  </span>
                </span>
                {finished && (
                  <span className="font-mono text-base">
                    {formatTime(finishTimes[childId])}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleCancel}
        >
          {t.abort}
        </Button>
      </div>
    );
  }

  // FINISHED PHASE
  return (
    <div className="space-y-6">
      <h1 className="text-center text-2xl font-bold heading-tight text-primary">{t.raceFinished}</h1>

      {rankedResults.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">{t.rankCol}</th>
                <th className="pb-2 pr-4">{t.nameCol}</th>
                <th className="pb-2 text-right">{t.timeCol}</th>
              </tr>
            </thead>
            <tbody>
              {rankedResults.map((r) => (
                <tr key={r.childId} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">
                    {r.rank <= 3 ? (
                      <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", MEDAL_COLORS[r.rank - 1])}>
                        {r.rank}
                      </span>
                    ) : (
                      r.rank
                    )}
                  </td>
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 text-right font-mono">
                    {formatTime(r.time)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          {t.noTimesRecorded}
        </p>
      )}

      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleSave}>
          {t.save}
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleReset}>
          {t.repeat}
        </Button>
      </div>
    </div>
  );
}
