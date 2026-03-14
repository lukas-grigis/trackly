import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSessionStore } from "@/store/session-store";
import { DISCIPLINES } from "@/lib/constants";
import { formatTime, formatStopwatch, cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";

type Phase = "setup" | "running" | "finished";

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
  const addResults = useSessionStore((s) => s.addResults);
  const { t } = useTranslation();

  const disciplineConfig = DISCIPLINES[discipline] ?? DISCIPLINES["sprint_60"];

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finishTimes, setFinishTimes] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (selectedChildren.length === 0) return;
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
    if (!id || !session) return;
    const results = Object.entries(finishTimes).map(([childId, value]) => ({
      athleteName: allAthletes.find((a) => a.id === childId)?.name ?? childId,
      discipline,
      value: Math.round(value),
      unit: disciplineConfig.unit,
      recordedAt: new Date().toISOString(),
    }));
    addResults(id, results);
    toast.success(t.resultsSaved);
    navigate(ROUTES.SESSION(id));
  }

  function handleReset() {
    setPhase("setup");
    setStartTime(null);
    setFinishTimes({});
    setElapsed(0);
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
                  className="tap-target tap-press h-14 font-medium"
                  onClick={() => toggleChild(athlete.id)}
                >
                  {athlete.name}
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
          {selectedChildren.map((childId, laneIdx) => {
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
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                    {laneIdx + 1}
                  </span>
                  {child?.name}
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
