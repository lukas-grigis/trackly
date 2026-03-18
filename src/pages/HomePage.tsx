import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSessionStore } from "@/store/session-store";
import type { Session } from "@/store/session-store";
import { escapeCsvField, formatValue } from "@/lib/utils";
import { exportSessionPdf } from "@/lib/pdfExport";
import { useTranslation } from "@/lib/i18n";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Download, FileText, Trash2, ClipboardList, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import SessionCard from "@/components/session/SessionCard";

function exportSessionCsv(
  session: Session,
  disciplineLabel: (key: string) => string,
  athleteName: (id: string) => string,
  headers: { athlete: string; discipline: string; value: string; unit: string; date: string },
) {
  const rows = [
    [headers.athlete, headers.discipline, headers.value, headers.unit, headers.date].map(escapeCsvField),
    ...session.heats.flatMap((h) =>
      h.results.map((r) =>
        [
          athleteName(r.athleteId),
          disciplineLabel(h.disciplineType),
          formatValue(r.value, r.unit),
          r.unit,
          r.recordedAt,
        ].map(escapeCsvField),
      ),
    ),
  ];
  const csv = rows.map((row) => row.join(",")).join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.name.replace(/\s+/g, "_")}_results.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HomePage() {
  const navigate = useNavigate();
  const rawSessions = useSessionStore((s) => s.sessions);
  const sessions = useMemo(
    () => [...rawSessions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [rawSessions],
  );
  const allAthletes = useSessionStore((s) => s.athletes);
  const addSession = useSessionStore((s) => s.addSession);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const clearAllData = useSessionStore((s) => s.clearAllData);
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);

  function handleOpenCreate() {
    // Pre-select all athletes by default (presence = everyone unless unchecked)
    setSelectedAthleteIds(allAthletes.map((a) => a.id));
    setOpen(true);
  }

  function toggleAthlete(id: string) {
    setSelectedAthleteIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  function handleCreate() {
    if (!name.trim()) return;
    const newId = addSession(name.trim(), date, selectedAthleteIds);
    toast.success(t.sessionCreated);
    setName("");
    setDate(new Date().toISOString().slice(0, 10));
    setSelectedAthleteIds([]);
    setOpen(false);
    navigate(ROUTES.SESSION(newId));
  }

  function handleDelete(id: string) {
    deleteSession(id);
    toast.success(t.sessionDeleted);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold heading-tight">{t.sessions}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t.newSession}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.newSession}</DialogTitle>
              <DialogDescription className="sr-only">
                {t.createSession}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="session-name">{t.sessionName}</Label>
                <Input
                  id="session-name"
                  placeholder={t.sessionNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-date">{t.sessionDate}</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Athlete presence check */}
              {allAthletes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t.presenceLabel}</Label>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAthleteIds(
                          selectedAthleteIds.length === allAthletes.length
                            ? []
                            : allAthletes.map((a) => a.id),
                        )
                      }
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {selectedAthleteIds.length === allAthletes.length
                        ? t.deselectAll
                        : t.selectAll}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {allAthletes.map((athlete) => {
                      const selected = selectedAthleteIds.includes(athlete.id);
                      return (
                        <button
                          key={athlete.id}
                          type="button"
                          onClick={() => toggleAthlete(athlete.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                          )}
                        >
                          {athlete.name}
                          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedAthleteIds.length} / {allAthletes.length}
                  </p>
                </div>
              )}

              <Button className="w-full" onClick={handleCreate}>
                {t.createSession}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ClipboardList
            className="h-16 w-16 text-muted-foreground/40 animate-float"
            strokeWidth={1.25}
          />
          <p className="text-muted-foreground max-w-xs">{t.noSessions}</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t.newSession}
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sessions.map((session) => (
            <div key={session.id} className="relative animate-card-enter">
              <SessionCard session={session} onDelete={handleDelete} />
              <div className="absolute right-2 bottom-2 flex gap-1">
                {session.athleteIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    disabled={session.heats.length === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (session.heats.length === 0) { toast.warning(t.noExportData); return; }
                      exportSessionPdf(
                        session,
                        allAthletes,
                        (key) => t.disciplines[key] ?? key,
                        t,
                      );
                      toast.success(t.pdfExported);
                    }}
                    aria-label={t.exportPdf}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    {t.exportPdf}
                  </Button>
                )}
                {session.heats.some((h) => h.results.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportSessionCsv(
                        session,
                        (key) => t.disciplines[key] ?? key,
                        (id) =>
                          allAthletes.find((a) => a.id === id)?.name ?? id,
                        { athlete: t.csvAthlete, discipline: t.csvDiscipline, value: t.csvValue, unit: t.csvUnit, date: t.csvDate },
                      );
                      toast.success(t.csvExported);
                    }}
                    aria-label={t.exportCsv}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    {t.exportCsv}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
              <Trash2 className="h-4 w-4 mr-1" />
              {t.clearAllData}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.clearAllDataConfirm}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.clearAllDataDesc}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    clearAllData();
                    toast.success(t.allDataCleared);
                  }}
                >
                  {t.deleteEverything}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
