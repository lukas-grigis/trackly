import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSessionStore } from "@/store/session-store";
import { DISCIPLINES } from "@/lib/constants";
import { formatValue } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { formatLocalDate } from "@/lib/locale";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Minus, Plus, Timer, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import DisciplinePicker from "@/components/session/DisciplinePicker";

const MEDAL_COLORS = [
  "bg-yellow-400 text-yellow-900",   // gold
  "bg-slate-300 text-slate-700",     // silver
  "bg-amber-600 text-amber-100",     // bronze
];

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.sessions.find((sess) => sess.id === id));
  const allAthletes = useSessionStore((s) => s.athletes);
  const setSessionAthletes = useSessionStore((s) => s.setSessionAthletes);
  const addResult = useSessionStore((s) => s.addResult);
  const addResults = useSessionStore((s) => s.addResults);
  const deleteResult = useSessionStore((s) => s.deleteResult);
  const { t } = useTranslation();

  const [athletesOpen, setAthletesOpen] = useState(true);
  const [discipline, setDiscipline] = useState("sprint_60");
  const [selectedChildId, setSelectedChildId] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [score, setScore] = useState({ a: 0, b: 0 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelection, setPickerSelection] = useState<string[]>([]);

  if (!session || !id) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t.sessionNotFound}
      </div>
    );
  }

  const sessionAthletes = allAthletes.filter((a) => session.athleteIds.includes(a.id));
  const disciplineConfig = DISCIPLINES[discipline] ?? DISCIPLINES["sprint_60"];
  const mode = disciplineConfig.mode;

  function handleDisciplineChange(newDiscipline: string) {
    setDiscipline(newDiscipline);
    setScore({ a: 0, b: 0 });
  }

  function openPicker() {
    setPickerSelection([...(session?.athleteIds ?? [])]);
    setPickerOpen(true);
  }

  function togglePickerAthlete(athleteId: string) {
    setPickerSelection((prev) =>
      prev.includes(athleteId)
        ? prev.filter((aid) => aid !== athleteId)
        : [...prev, athleteId],
    );
  }

  function savePicker() {
    if (id) setSessionAthletes(id, pickerSelection);
    setPickerOpen(false);
  }

  function handleAddResult() {
    if (!selectedChildId || !resultValue || !id) return;
    const value = parseFloat(resultValue);
    if (isNaN(value)) return;
    const athleteName =
      allAthletes.find((a) => a.id === selectedChildId)?.name ?? selectedChildId;
    addResult(id, {
      athleteName,
      discipline,
      value,
      unit: disciplineConfig.unit,
      recordedAt: new Date().toISOString(),
    });
    toast.success(t.resultSaved);
    setResultValue("");
  }

  function handleAdjustScore(team: "a" | "b", delta: number) {
    setScore((prev) => ({ ...prev, [team]: Math.max(0, prev[team] + delta) }));
  }

  function handleSaveScore() {
    if (!id) return;
    const now = new Date().toISOString();
    addResults(id, [
      { athleteName: t.teamA, discipline, value: score.a, unit: "count", recordedAt: now },
      { athleteName: t.teamB, discipline, value: score.b, unit: "count", recordedAt: now },
    ]);
    toast.success(t.resultsSaved);
    setScore({ a: 0, b: 0 });
  }

  const filteredResults = session.results
    .filter((r) => r.discipline === discipline)
    .sort((a, b) =>
      disciplineConfig.sortAscending ? a.value - b.value : b.value - a.value,
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{session.name}</h1>
        <span className="inline-block mt-1 rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground">
          {formatLocalDate(session.date)}
        </span>
      </div>

      {/* ── Collapsible athletes panel ── */}
      <div className="rounded-lg border overflow-hidden">
        <button
          className="flex w-full items-center justify-between bg-secondary/50 px-4 py-3 text-sm font-semibold"
          onClick={() => setAthletesOpen((v) => !v)}
        >
          <span className="flex items-center gap-2">
            {athletesOpen
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            {t.childrenTab}
            <span className="ml-1 text-muted-foreground font-normal">
              ({sessionAthletes.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            onClick={(e) => { e.stopPropagation(); openPicker(); }}
          >
            <Users className="h-3.5 w-3.5" />
            {t.selectAthletes}
          </Button>
        </button>

        {athletesOpen && (
          <div className="border-t px-4 py-3">
            {sessionAthletes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noAthletesInSession}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sessionAthletes.map((athlete) => (
                  <span
                    key={athlete.id}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm font-medium"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {athlete.name}
                    {athlete.yearOfBirth && (
                      <span className="text-xs text-muted-foreground">
                        {athlete.yearOfBirth}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Results section ── */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t.disciplineLabel}</Label>
          <DisciplinePicker value={discipline} onChange={handleDisciplineChange} />
        </div>

        {mode === "timed" && (
          <Button
            className="w-full h-14 text-base gap-2"
            onClick={() => navigate(ROUTES.RACE(id, discipline))}
            disabled={sessionAthletes.length === 0}
          >
            <Timer className="h-5 w-5" />
            {t.startRace}
          </Button>
        )}

        {mode === "distance" && (
          <div className="space-y-2">
            <Label>{t.enterResult}</Label>
            <div className="flex gap-2">
              <Select
                value={selectedChildId}
                onValueChange={(v) => { if (v) setSelectedChildId(v); }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t.chooseChild} />
                </SelectTrigger>
                <SelectContent>
                  {sessionAthletes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder={disciplineConfig.unit}
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                className="w-24"
              />
              <Button onClick={handleAddResult}>{t.save}</Button>
            </div>
          </div>
        )}

        {mode === "count" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {(["a", "b"] as const).map((team) => (
                <div
                  key={team}
                  className="flex flex-col items-center gap-2 rounded-xl border p-3"
                >
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {team === "a" ? t.teamA : t.teamB}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="tap-target tap-press h-14 w-14 rounded-xl"
                    onClick={() => handleAdjustScore(team, 1)}
                    aria-label="+"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                  <span className="font-display text-6xl font-bold tabular-nums">
                    {score[team]}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="tap-target tap-press h-14 w-14 rounded-xl"
                    onClick={() => handleAdjustScore(team, -1)}
                    disabled={score[team] === 0}
                    aria-label="-"
                  >
                    <Minus className="h-6 w-6" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSaveScore}>
                {t.saveScore}
              </Button>
              <Button variant="outline" onClick={() => setScore({ a: 0, b: 0 })}>
                {t.resetCounts}
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {filteredResults.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noResults}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">{t.rankCol}</th>
                  <th className="pb-2 pr-4">{t.nameCol}</th>
                  <th className="pb-2 text-right">
                    {mode === "count" ? t.scoreCol : t.resultsTab}
                  </th>
                  <th className="pb-2 pl-2" />
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result, i) => (
                  <tr key={result.id} className={cn("border-b last:border-0", i % 2 === 1 && "bg-muted/30")}>
                    <td className="py-2 pr-4 font-medium">
                      {i < 3 ? (
                        <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", MEDAL_COLORS[i])}>
                          {i + 1}
                        </span>
                      ) : (
                        i + 1
                      )}
                    </td>
                    <td className="py-2 pr-4">{result.athleteName || "—"}</td>
                    <td className="py-2 text-right font-mono">
                      {formatValue(result.value, result.unit)}
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteResult(id, result.id)}
                        aria-label={t.deleteResult}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Athlete picker dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.selectAthletes}</DialogTitle>
          </DialogHeader>
          {allAthletes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t.noAthletes}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 py-2">
              {allAthletes.map((athlete) => {
                const selected = pickerSelection.includes(athlete.id);
                return (
                  <Button
                    key={athlete.id}
                    variant="outline"
                    className={cn(
                      "tap-target h-11 justify-start",
                      selected && "border-primary bg-primary/10 font-semibold",
                    )}
                    onClick={() => togglePickerAthlete(athlete.id)}
                  >
                    {athlete.name}
                  </Button>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={savePicker}>{t.done}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
