import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSessionStore, type DisciplineType } from "@/store/session-store";
import { DISCIPLINE_OPTIONS } from "@/lib/constants";
import { formatTime, formatStopwatch, cn } from "@/lib/utils";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Phase = "setup" | "running" | "finished";

const TIMED_DISCIPLINES = DISCIPLINE_OPTIONS.filter((d) =>
  d.value.startsWith("sprint_"),
);

export default function RacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === id),
  );
  const addResults = useSessionStore((s) => s.addResults);

  const [phase, setPhase] = useState<Phase>("setup");
  const [discipline, setDiscipline] = useState<DisciplineType>("sprint_60");
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
        Session nicht gefunden.
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
    if (!id) return;
    const results = Object.entries(finishTimes).map(([childId, value]) => ({
      childId,
      discipline,
      value: Math.round(value),
      unit: "ms" as const,
      recordedAt: new Date().toISOString(),
    }));
    addResults(id, results);
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
      name:
        session.children.find((c) => c.id === childId)?.name ?? "Unbekannt",
    }));

  // SETUP PHASE
  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Rennen vorbereiten</h1>

        <div className="space-y-2">
          <Label>Disziplin</Label>
          <Select
            value={discipline}
            onValueChange={(v) => setDiscipline(v as DisciplineType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMED_DISCIPLINES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Teilnehmer auswählen</Label>
          <div className="grid grid-cols-2 gap-2">
            {session.children.map((child) => {
              const selected = selectedChildren.includes(child.id);
              return (
                <Button
                  key={child.id}
                  variant={selected ? "default" : "outline"}
                  className="h-12"
                  onClick={() => toggleChild(child.id)}
                >
                  {child.name}
                </Button>
              );
            })}
          </div>
          {session.children.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Füge zuerst Kinder zur Session hinzu.
            </p>
          )}
        </div>

        <Button
          className="h-16 w-full text-xl"
          disabled={selectedChildren.length === 0}
          onClick={handleStart}
        >
          Start
        </Button>
      </div>
    );
  }

  // RUNNING PHASE
  if (phase === "running") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-primary p-6 text-center text-primary-foreground">
          <div className="font-mono text-4xl font-bold">
            {formatStopwatch(elapsed)}
          </div>
        </div>

        <div className="grid gap-2">
          {selectedChildren.map((childId) => {
            const child = session.children.find((c) => c.id === childId);
            const finished = childId in finishTimes;
            return (
              <button
                key={childId}
                disabled={finished}
                onClick={() => handleFinish(childId)}
                className={cn(
                  "flex min-h-16 items-center justify-between rounded-lg px-4 py-3 text-lg font-medium transition-colors",
                  finished
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground active:opacity-80",
                )}
              >
                <span>{child?.name}</span>
                {finished && (
                  <span className="font-mono">
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
          Abbrechen
        </Button>
      </div>
    );
  }

  // FINISHED PHASE
  return (
    <div className="space-y-6">
      <h1 className="text-center text-2xl font-bold">Rennen beendet!</h1>

      {rankedResults.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 text-right">Zeit</th>
              </tr>
            </thead>
            <tbody>
              {rankedResults.map((r) => (
                <tr key={r.childId} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{r.rank}</td>
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
          Keine Zeiten aufgezeichnet.
        </p>
      )}

      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleSave}>
          Speichern
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleReset}>
          Wiederholen
        </Button>
      </div>
    </div>
  );
}
