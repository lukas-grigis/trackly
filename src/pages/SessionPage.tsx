import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useSessionStore } from "@/store/session-store";
import { DISCIPLINES, getMedalStyle } from "@/lib/constants";
import { computeLeaderboard } from "@/hooks/useLeaderboard";
import { formatValue } from "@/lib/utils";
import { GenderBadge } from "@/components/GenderBadge";
import { AthleteAvatar } from "@/components/ui/athlete-avatar";
import { AgeGroupBadge } from "@/components/AgeGroupBadge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, ChevronDown, ChevronRight, Minus, Plus, Timer, Trophy, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import DisciplinePicker from "@/components/session/DisciplinePicker";

const CUSTOM_UNITS = ["s", "ms", "cm", "m"] as const;

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
  const [customDisciplineName, setCustomDisciplineName] = useState("");
  const [selectedChildId, setSelectedChildId] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [customUnit, setCustomUnit] = useState<typeof CUSTOM_UNITS[number]>("s");
  const [customNote, setCustomNote] = useState("");
  const [score, setScore] = useState({ a: 0, b: 0 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelection, setPickerSelection] = useState<string[]>([]);
  const [deleteHeatTarget, setDeleteHeatTarget] = useState<string | null>(null);
  const [resultsView, setResultsView] = useState<"rankings" | "all">("rankings");

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

  function handleDisciplineChange(newDiscipline: string, newCustomName?: string) {
    setDiscipline(newDiscipline);
    if (newCustomName !== undefined) setCustomDisciplineName(newCustomName);
    setScore({ a: 0, b: 0 });
    setResultsView("rankings");
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

  function handleAddCustomResult() {
    if (!selectedChildId || !id) return;
    const numValue = resultValue ? parseFloat(resultValue) : NaN;
    const hasNumeric = !isNaN(numValue) && resultValue !== "";
    const hasNote = customNote.trim() !== "";
    if (!hasNumeric && !hasNote) return;

    const now = new Date().toISOString();
    const heatId = addHeat(id, {
      sessionId: id,
      disciplineType: "custom",
      customDisciplineName,
      participantIds: [selectedChildId],
      startedAt: now,
    });
    addHeatResult(id, heatId, {
      childId: selectedChildId,
      value: hasNumeric ? numValue : 0,
      unit: customUnit,
      note: hasNote ? customNote.trim() : undefined,
      recordedAt: now,
    });
    toast.success(t.resultSaved);
    setResultValue("");
    setCustomNote("");
  }

  function handleAdjustScore(team: "a" | "b", delta: number) {
    setScore((prev) => ({ ...prev, [team]: Math.max(0, prev[team] + delta) }));
  }

  function handleSaveScore() {
    if (!id) return;
    const now = new Date().toISOString();
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
    .filter((h) => {
      if (discipline === "custom") {
        return h.disciplineType === "custom" &&
          (h.customDisciplineName ?? "").toLowerCase() === customDisciplineName.toLowerCase();
      }
      return h.disciplineType === discipline;
    })
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt) || a.id.localeCompare(b.id));

  // Flatten all results across heats, sorted by performance (best first)
  const filteredResults = filteredHeats.flatMap((h) =>
    h.results.map((r) => {
      const athlete = allAthletes.find((a) => a.id === r.childId);
      return {
        heatId: h.id,
        childId: r.childId,
        athleteName: athlete?.name ?? r.childId,
        yearOfBirth: athlete?.yearOfBirth,
        gender: athlete?.gender,
        value: r.value,
        unit: r.unit,
        note: r.note,
        recordedAt: r.recordedAt,
      };
    }),
  ).sort((a, b) => {
    // Note-only results (value 0 with a note) go to the end
    const aIsNoteOnly = a.value === 0 && a.note;
    const bIsNoteOnly = b.value === 0 && b.note;
    if (aIsNoteOnly && !bIsNoteOnly) return 1;
    if (!aIsNoteOnly && bIsNoteOnly) return -1;
    return disciplineConfig.sortAscending ? a.value - b.value : b.value - a.value;
  });

  // For custom disciplines, show the custom name as column header
  // Compute competition ranking (1,1,3 for ties)
  const ranks: (number | null)[] = [];
  for (let i = 0; i < filteredResults.length; i++) {
    const result = filteredResults[i];
    const isNoteOnly = result.value === 0 && result.note;
    if (isNoteOnly) {
      ranks.push(null);
      continue;
    }
    // Count non-note results before this one
    let pos = 0;
    for (let j = 0; j < i; j++) {
      const r = filteredResults[j];
      if (!(r.value === 0 && r.note)) pos++;
    }
    // Check if previous non-note result has same value (tie)
    if (i > 0) {
      const prev = filteredResults[i - 1];
      const prevIsNoteOnly = prev.value === 0 && prev.note;
      if (!prevIsNoteOnly && prev.value === result.value) {
        ranks.push(ranks[i - 1]);
        continue;
      }
    }
    ranks.push(pos + 1);
  }
  const rankedResults = filteredResults.map((result, i) => ({
    ...result,
    rank: ranks[i],
  }));

  // Rankings view: personal best per athlete (for timed/distance modes)
  const rankingEntries = useMemo(() => {
    if (!session || mode === "count" || mode === "custom") return [];
    return computeLeaderboard(session, discipline, allAthletes).entries;
  }, [session, discipline, allAthletes, mode]);

  // Attempt counts per athlete (shown in rankings view)
  const attemptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of filteredResults) {
      counts.set(r.childId, (counts.get(r.childId) ?? 0) + 1);
    }
    return counts;
  }, [filteredResults]);

  // Whether to show the toggle (only when multiple modes are meaningful)
  const showViewToggle = (mode === "timed" || mode === "distance") && filteredResults.length > 0;

  const disciplineDisplayName = discipline === "custom"
    ? (customDisciplineName || t.disciplines.custom)
    : (t.disciplines[discipline] ?? discipline);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{session.name}</h1>
          <span className="inline-block mt-1 rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground">
            {formatLocalDate(session.date)}
          </span>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" render={<Link to={ROUTES.LEADERBOARD(id)} />}>
          <Trophy className="h-4 w-4" />
          {t.leaderboard}
        </Button>
      </div>

      {/* ── Collapsible athletes panel ── */}
      <div className="rounded-lg border overflow-hidden">
        <div className="flex w-full items-center justify-between bg-secondary/50 px-4 py-3 text-sm font-semibold">
          <button
            className="flex flex-1 items-center gap-2 text-left"
            onClick={() => setAthletesOpen((v) => !v)}
            aria-expanded={athletesOpen}
          >
            {athletesOpen
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            {t.childrenTab}
            <span className="ml-1 text-muted-foreground font-normal">
              ({sessionAthletes.length})
            </span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            onClick={openPicker}
          >
            <Users className="h-3.5 w-3.5" />
            {t.selectAthletes}
          </Button>
        </div>

        {athletesOpen && (
          <div className="border-t px-4 py-3">
            {sessionAthletes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noAthletesInSession}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sessionAthletes.map((athlete) => (
                  <Link
                    key={athlete.id}
                    to={ROUTES.ATHLETE(athlete.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm font-medium hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <AthleteAvatar name={athlete.name} avatarBase64={athlete.avatarBase64} size="sm" className="h-5 w-5 text-[8px]" />
                    {athlete.name}
                    <AgeGroupBadge yearOfBirth={athlete.yearOfBirth} />
                    <GenderBadge gender={athlete.gender} />
                  </Link>
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
          <DisciplinePicker
            value={discipline}
            customName={customDisciplineName}
            onChange={handleDisciplineChange}
          />
        </div>

        {mode === "timed" && (
          <Button
            className="w-full h-14 text-base gap-2 rounded-xl btn-shimmer"
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
                placeholder={disciplineConfig.unit === "count" ? "#" : disciplineConfig.unit}
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                className="w-24"
              />
              <Button onClick={handleAddResult}>{t.save}</Button>
            </div>
          </div>
        )}

        {mode === "custom" && (
          <div className="space-y-3">
            <Label>{t.enterResult} — {disciplineDisplayName}</Label>
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
                placeholder={t.unitValue}
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                className="w-24"
              />
              <Select
                value={customUnit}
                onValueChange={(v) => setCustomUnit(v as typeof CUSTOM_UNITS[number])}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {t.units[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder={t.notePlaceholder}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleAddCustomResult}
              disabled={!selectedChildId || (!resultValue && !customNote.trim())}
            >
              {t.save}
            </Button>
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
          <div className="space-y-3">
            {/* View toggle */}
            {showViewToggle && (
              <div className="inline-flex rounded-lg border p-0.5 bg-muted/50 gap-0.5">
                {(["rankings", "all"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setResultsView(view)}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                      resultsView === view
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {view === "rankings" ? t.leaderboard : t.allRuns}
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">{t.rankCol}</th>
                    <th className="pb-2 pr-4">{t.nameCol}</th>
                    <th className="pb-2 text-right">
                      {mode === "count" ? t.scoreCol : disciplineDisplayName}
                    </th>
                    {mode === "custom" && <th className="pb-2 pl-2 text-right">{t.noteHeader}</th>}
                    {resultsView === "all" && <th className="pb-2 pl-2" />}
                  </tr>
                </thead>
                <tbody>
                  {resultsView === "rankings"
                    ? rankingEntries.map((entry, i) => {
                        const medalStyle = getMedalStyle(entry.rank);
                        const attempts = attemptCounts.get(entry.athleteId) ?? 1;
                        return (
                          <tr key={entry.athleteId} className={cn("border-b last:border-0", i % 2 === 1 && "bg-muted/30")}>
                            <td className="py-2 pr-4 font-medium">
                              {medalStyle ? (
                                <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", medalStyle)}>
                                  {entry.rank}
                                </span>
                              ) : entry.rank}
                            </td>
                            <td className="py-2 pr-4">
                              <span className="inline-flex items-center gap-1.5">
                                {entry.athlete?.name ?? entry.athleteId}
                                <AgeGroupBadge yearOfBirth={entry.athlete?.yearOfBirth} />
                                <GenderBadge gender={entry.athlete?.gender} />
                                {attempts > 1 && (
                                  <span className="text-[10px] text-muted-foreground">×{attempts}</span>
                                )}
                              </span>
                            </td>
                            <td className="py-2 text-right font-mono">
                              {formatValue(entry.bestValue, disciplineConfig.unit)}
                            </td>
                          </tr>
                        );
                      })
                    : rankedResults.map((result, i) => {
                        const rank = result.rank;
                        return (
                          <tr key={`${result.heatId}-${result.childId}-${i}`} className={cn("border-b last:border-0", i % 2 === 1 && "bg-muted/30")}>
                            <td className="py-2 pr-4 font-medium">
                              {rank == null ? "—" : getMedalStyle(rank) ? (
                                <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", getMedalStyle(rank))}>
                                  {rank}
                                </span>
                              ) : rank}
                            </td>
                            <td className="py-2 pr-4">
                              <span className="inline-flex items-center gap-1.5">
                                {result.athleteName || "—"}
                                <AgeGroupBadge yearOfBirth={result.yearOfBirth} />
                                <GenderBadge gender={result.gender} />
                              </span>
                            </td>
                            <td className="py-2 text-right font-mono">
                              {rank == null ? "—" : formatValue(result.value, result.unit)}
                            </td>
                            {mode === "custom" && (
                              <td className="py-2 pl-2 text-right text-muted-foreground text-xs max-w-32 truncate">
                                {result.note ?? ""}
                              </td>
                            )}
                            <td className="py-2 pl-2 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteHeatTarget(result.heatId)}
                                aria-label={t.deleteResult}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete result confirmation */}
      <AlertDialog
        open={deleteHeatTarget !== null}
        onOpenChange={(open) => !open && setDeleteHeatTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteResult}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteResultDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteHeatTarget) {
                  deleteHeat(id, deleteHeatTarget);
                  setDeleteHeatTarget(null);
                }
              }}
            >
              {t.deleteResult}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Athlete picker dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogDescription className="sr-only">
              {t.selectAthletes}
            </DialogDescription>
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
                    <AthleteAvatar
                      name={athlete.name}
                      avatarBase64={athlete.avatarBase64}
                      className={cn(
                        !athlete.avatarBase64 && (selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"),
                      )}
                    />
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
