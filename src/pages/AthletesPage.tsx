import { useState } from "react";
import { toast } from "sonner";
import { useSessionStore } from "@/store/session-store";
import { useTranslation } from "@/lib/i18n";
import { cn, getAgeGroup } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { Trash2, Plus, Users } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();
// Ages 3–21 → 19 chips; the 20th slot is a custom entry
const YEAR_OPTIONS = Array.from({ length: 19 }, (_, i) => CURRENT_YEAR - 3 - i);

function InitialAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
      {initial}
    </span>
  );
}

export default function AthletesPage() {
  const athletes = useSessionStore((s) => s.athletes);
  const addAthlete = useSessionStore((s) => s.addAthlete);
  const removeAthlete = useSessionStore((s) => s.removeAthlete);
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  function handleCustomConfirm() {
    const parsed = parseInt(customInput, 10);
    if (parsed > 1900 && parsed <= CURRENT_YEAR) {
      setYear(parsed);
    }
    setCustomOpen(false);
    setCustomInput("");
  }

  const isCustomYear = year !== null && !YEAR_OPTIONS.includes(year);

  function handleAdd() {
    if (!name.trim()) return;
    addAthlete(name.trim(), year ?? undefined);
    toast.success(t.athleteAdded);
    setName("");
    setYear(null);
    setCustomOpen(false);
    setCustomInput("");
  }

  function handleRemove(id: string) {
    removeAthlete(id);
    toast.success(t.athleteRemoved);
    setRemoveTarget(null);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold heading-tight">{t.athletesNav}</h1>

      {athletes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <Users className="h-14 w-14 text-muted-foreground/40 animate-float" strokeWidth={1.25} />
          <p className="text-sm text-muted-foreground max-w-xs">{t.noAthletes}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {athletes.map((athlete) => (
            <li
              key={athlete.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <InitialAvatar name={athlete.name} />
                <div className="flex items-center gap-2">
                  <span className="font-medium">{athlete.name}</span>
                  {athlete.yearOfBirth && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {getAgeGroup(athlete.yearOfBirth)}
                    </span>
                  )}
                  {athlete.yearOfBirth && (
                    <span className="text-sm text-muted-foreground">
                      *{athlete.yearOfBirth}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setRemoveTarget(athlete.id)}
                aria-label={t.removeChild}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Separator />

      <div className="space-y-3">
        <Label>{t.addChild}</Label>

        {/* Name + add button */}
        <div className="flex gap-2">
          <Input
            placeholder={t.childNameLabel}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleAdd} aria-label={t.addChild}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Birth year chips — 2 rows × 10 */}
        <div className="grid grid-cols-10 gap-1">
          {YEAR_OPTIONS.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => { setYear(year === y ? null : y); setCustomOpen(false); }}
              className={cn(
                "rounded-md border py-1.5 text-xs font-medium tabular-nums transition-colors",
                year === y
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
              )}
            >
              {y}
            </button>
          ))}
          {/* 20th slot: custom entry */}
          <button
            type="button"
            onClick={() => { setCustomOpen((v) => !v); }}
            className={cn(
              "rounded-md border py-1.5 text-xs font-medium transition-colors",
              isCustomYear || customOpen
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {isCustomYear ? year : "···"}
          </button>
        </div>

        {/* Custom year input, shown inline below the grid */}
        {customOpen && (
          <div className="flex gap-2">
            <Input
              autoFocus
              type="number"
              placeholder="e.g. 1998"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomConfirm()}
              className="w-32 text-sm"
            />
            <Button size="sm" onClick={handleCustomConfirm}>
              {t.done}
            </Button>
          </div>
        )}
      </div>

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.removeChildConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.removeChildDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeTarget && handleRemove(removeTarget)}
            >
              {t.removeChild}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
