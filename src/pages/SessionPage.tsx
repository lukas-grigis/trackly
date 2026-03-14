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
import { Check, ChevronDown, ChevronRight, Minus, Plus, Timer, Users, X } from "lucide-react";
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
  const addHeat = useSessionStore((s) => s.addHeat);
  const addHeatResult = useSessionStore((s) => s.addHeatResult);
  const deleteHeat = useSessionStore((s) => s.deleteHeat);
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
    const now = new Date().toISOString();
    const heatId = addHeat(id, {
      sessionId: id,
      disciplineType: discipline,
      participantIds: [selectedChildId],
      startedAt: now,
    });
    addHeatResult(id, heatId, {
      childId: selectedChildId,
      value,
      unit: disciplineConfig.unit,
      recordedAt: now,
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
    // Use placeholder IDs for team scores (team-a / team-b)
    const teamAId = "team-a";
    const teamBId = "team-b";
    const heatId = addHeat(id, {
      sessionId: id,
      disciplineType: discipline,
      participantIds: [teamAId, teamBId],
      startedAt: now,
    });
    addHeatResult(id, heatId, { childId: teamAId, value: score.a, unit: "count", recordedAt: now });
    addHeatResult(id, heatId, { childId: teamBId, value: score.b, unit: "count", recordedAt: now });
    toast.success(t.resultsSaved);
    setScore({ a: 0, b: 0 });
  }

  const filteredHeats = session.heats
    .filter((h) => h.disciplineType === discipline)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt) || a.id.localeCompare(b.id));

  const filteredResults = filteredHeats.flatMap((h) =>
    h.results.map((r) => ({
      heatId: h.id,
      childId: r.childId,
      athleteName: allAthletes.find((a) => a.id === r.childId)?.name ?? r.childId,
      value: r.value,
      unit: r.unit,
      recordedAt: r.recordedAt,
    })),
  ).sort((a, b) =>
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
                  <tr key={`${result.heatId}-${result.childId}`} className={cn("border-b last:border-0", i % 2 === 1 && "bg-muted/30")}>
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
                        onClick={() => deleteHeat(id, result.heatId)}
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
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>{t.selectAthletes}</DialogTitle>
              {allAthletes.length > 0 && (
                <button
                  onClick={() =>
                    setPickerSelection(
                      pickerSelection.length === allAthletes.length
                        ? []
                        : allAthletes.map((a) => a.id),
                    )
                  }
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {pickerSelection.length === allAthletes.length
                    ? t.deselectAll
                    : t.selectAll}
                </button>
              )}
            </div>
          </DialogHeader>

          {allAthletes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t.noAthletes}</p>
          ) : (
            <div className="flex flex-col gap-1.5 py-1 max-h-72 overflow-y-auto">
              {allAthletes.map((athlete) => {
                const selected = pickerSelection.includes(athlete.id);
                const initial = athlete.name.trim().charAt(0).toUpperCase();
                return (
                  <button
                    key={athlete.id}
                    onClick={() => togglePickerAthlete(athlete.id)}
                    className={cn(
                      "tap-target flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {initial}
                    </span>
                    <span className="flex-1">
                      <span className={cn("block text-sm font-medium", selected && "text-primary")}>
                        {athlete.name}
                      </span>
                      {athlete.yearOfBirth && (
                        <span className="text-xs text-muted-foreground">*{athlete.yearOfBirth}</span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <span className="text-xs text-muted-foreground self-center">
              {pickerSelection.length} / {allAthletes.length}
            </span>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setPickerOpen(false)}>
                {t.cancel}
              </Button>
              <Button onClick={savePicker}>{t.done}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
