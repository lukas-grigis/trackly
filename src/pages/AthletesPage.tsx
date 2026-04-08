import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useSessionStore, type Gender } from '@/store/session-store';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AgeGroupBadge } from '@/components/AgeGroupBadge';
import { GenderBadge } from '@/components/GenderBadge';
import { AthleteAvatar } from '@/components/ui/athlete-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/routes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Plus, Users, Camera, X, Pencil } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
// Ages 3–21 → 19 chips; the 20th slot is a custom entry
const YEAR_OPTIONS = Array.from({ length: 19 }, (_, i) => CURRENT_YEAR - 3 - i);

/** Center-crop and resize an image file to ≤128×128 JPEG, returned as a data URL. */
function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement('canvas');
      const dim = Math.min(size, 128);
      canvas.width = dim;
      canvas.height = dim;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas'));
        return;
      }
      ctx.drawImage(img, sx, sy, size, size, 0, 0, dim, dim);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('load'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function AthletesPage() {
  const athletes = useSessionStore((s) => s.athletes);
  const addAthlete = useSessionStore((s) => s.addAthlete);
  const updateAthlete = useSessionStore((s) => s.updateAthlete);
  const removeAthlete = useSessionStore((s) => s.removeAthlete);
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [year, setYear] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [customOpen, setCustomOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);

  // Edit athlete state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState<number | null>(null);
  const [editGender, setEditGender] = useState<Gender | undefined>(undefined);
  const [editCustomOpen, setEditCustomOpen] = useState(false);
  const [editCustomInput, setEditCustomInput] = useState('');

  const handleFileSelect = useCallback(
    async (file: File, athleteId?: string) => {
      try {
        const dataUrl = await processImage(file);
        if (athleteId) {
          const athlete = athletes.find((a) => a.id === athleteId);
          if (!athlete) return;
          try {
            updateAthlete(athleteId, athlete.name, athlete.yearOfBirth, athlete.gender, dataUrl);
          } catch {
            toast.warning(t.photoStorageFailed);
          }
        } else {
          setAvatar(dataUrl);
        }
      } catch {
        toast.warning(t.photoStorageFailed);
      }
    },
    [athletes, updateAthlete, t]
  );

  function handleCustomConfirm() {
    const parsed = parseInt(customInput, 10);
    if (parsed > 1900 && parsed <= CURRENT_YEAR) {
      setYear(parsed);
    }
    setCustomOpen(false);
    setCustomInput('');
  }

  const isCustomYear = year !== null && !YEAR_OPTIONS.includes(year);

  function handleAdd() {
    if (!name.trim()) return;
    try {
      addAthlete(name.trim(), year ?? undefined, gender, avatar);
    } catch {
      // Storage failure — save without photo
      addAthlete(name.trim(), year ?? undefined, gender);
      if (avatar) toast.warning(t.photoStorageFailed);
    }
    toast.success(t.athleteAdded);
    setName('');
    setYear(null);
    setGender(undefined);
    setAvatar(undefined);
    setCustomOpen(false);
    setCustomInput('');
  }

  function handleRemovePhoto(athleteId: string) {
    const athlete = athletes.find((a) => a.id === athleteId);
    if (!athlete) return;
    updateAthlete(athleteId, athlete.name, athlete.yearOfBirth, athlete.gender, undefined);
  }

  function handleRemove(id: string) {
    removeAthlete(id);
    toast.success(t.athleteRemoved);
    setRemoveTarget(null);
  }

  function startEdit(athleteId: string) {
    const athlete = athletes.find((a) => a.id === athleteId);
    if (!athlete) return;
    setEditId(athleteId);
    setEditName(athlete.name);
    setEditYear(athlete.yearOfBirth ?? null);
    setEditGender(athlete.gender);
    setEditCustomOpen(false);
    setEditCustomInput('');
  }

  function handleEditSave() {
    if (!editId || !editName.trim()) return;
    const athlete = athletes.find((a) => a.id === editId);
    if (!athlete) return;
    updateAthlete(editId, editName.trim(), editYear ?? undefined, editGender, athlete.avatarBase64);
    toast.success(t.athleteUpdated);
    setEditId(null);
  }

  function handleEditCustomConfirm() {
    const parsed = parseInt(editCustomInput, 10);
    if (parsed > 1900 && parsed <= CURRENT_YEAR) {
      setEditYear(parsed);
    }
    setEditCustomOpen(false);
    setEditCustomInput('');
  }

  const isEditCustomYear = editYear !== null && !YEAR_OPTIONS.includes(editYear);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold heading-tight">{t.athletesNav}</h1>

      {athletes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Users className="h-16 w-16 text-muted-foreground/40 animate-float" strokeWidth={1.25} />
          <p className="text-sm text-muted-foreground max-w-xs">{t.noAthletes}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {athletes.map((athlete, i) => (
            <li
              key={athlete.id}
              className="animate-card-enter-stagger flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/30"
              style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  className="relative group shrink-0"
                  onClick={() => {
                    setReplaceTarget(athlete.id);
                    replaceFileInputRef.current?.click();
                  }}
                  aria-label={athlete.avatarBase64 ? t.changePhoto : t.addPhoto}
                >
                  <AthleteAvatar name={athlete.name} avatarBase64={athlete.avatarBase64} />
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-3.5 w-3.5" />
                  </span>
                </button>
                <Link
                  to={ROUTES.ATHLETE(athlete.id)}
                  className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 hover:underline underline-offset-2"
                >
                  <span className="font-medium truncate">{athlete.name}</span>
                  <AgeGroupBadge yearOfBirth={athlete.yearOfBirth} />
                  <GenderBadge gender={athlete.gender} />
                  {athlete.yearOfBirth && <span className="text-sm text-muted-foreground">*{athlete.yearOfBirth}</span>}
                </Link>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {athlete.avatarBase64 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemovePhoto(athlete.id)}
                    aria-label={t.removePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => startEdit(athlete.id)}
                  aria-label={t.editAthlete}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setRemoveTarget(athlete.id)}
                  aria-label={t.removeChild}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleAdd} aria-label={t.addChild}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Birth year chips — responsive grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {YEAR_OPTIONS.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setYear(year === y ? null : y);
                setCustomOpen(false);
              }}
              className={cn(
                'rounded-md border py-1.5 text-xs font-medium tabular-nums transition-colors',
                year === y
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground'
              )}
            >
              {y}
            </button>
          ))}
          {/* 20th slot: custom entry */}
          <button
            type="button"
            onClick={() => {
              setCustomOpen((v) => !v);
            }}
            className={cn(
              'rounded-md border py-1.5 text-xs font-medium transition-colors',
              isCustomYear || customOpen
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground'
            )}
          >
            {isCustomYear ? year : '···'}
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
              onKeyDown={(e) => e.key === 'Enter' && handleCustomConfirm()}
              className="w-32 text-base md:text-sm"
            />
            <Button size="sm" onClick={handleCustomConfirm}>
              {t.done}
            </Button>
          </div>
        )}

        {/* Gender toggle */}
        <div className="flex gap-2">
          {(['male', 'female', 'nonbinary'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(gender === g ? undefined : g)}
              aria-label={t.genderLabels[g]}
              title={t.genderLabels[g]}
              className={cn(
                'flex-1 rounded-md border py-2 text-base transition-colors',
                gender === g
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground'
              )}
            >
              {g === 'male' ? '♂' : g === 'female' ? '♀' : '⚧'}
            </button>
          ))}
        </div>

        {/* Photo capture */}
        <div className="flex items-center gap-3">
          {avatar ? (
            <AthleteAvatar name={name || '?'} avatarBase64={avatar} />
          ) : (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 text-muted-foreground/40">
              <Camera className="h-4 w-4" />
            </span>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            {avatar ? t.changePhoto : t.addPhoto}
          </Button>
          {avatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setAvatar(undefined)}
            >
              {t.removePhoto}
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replaceTarget) handleFileSelect(file, replaceTarget);
          e.target.value = '';
          setReplaceTarget(null);
        }}
      />

      <AlertDialog open={removeTarget !== null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
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

      {/* Edit athlete dialog */}
      <AlertDialog open={editId !== null} onOpenChange={(open) => !open && setEditId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.editAthlete}</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">{t.editAthlete}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={t.childNameLabel}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
            />
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {YEAR_OPTIONS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setEditYear(editYear === y ? null : y);
                    setEditCustomOpen(false);
                  }}
                  className={cn(
                    'rounded-md border py-1.5 text-xs font-medium tabular-nums transition-colors',
                    editYear === y
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground'
                  )}
                >
                  {y}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEditCustomOpen((v) => !v)}
                className={cn(
                  'rounded-md border py-1.5 text-xs font-medium transition-colors',
                  isEditCustomYear || editCustomOpen
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground'
                )}
              >
                {isEditCustomYear ? editYear : '···'}
              </button>
            </div>
            {editCustomOpen && (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  type="number"
                  placeholder="e.g. 1998"
                  value={editCustomInput}
                  onChange={(e) => setEditCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditCustomConfirm()}
                  className="w-32 text-base md:text-sm"
                />
                <Button size="sm" onClick={handleEditCustomConfirm}>
                  {t.done}
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              {(['male', 'female', 'nonbinary'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setEditGender(editGender === g ? undefined : g)}
                  aria-label={t.genderLabels[g]}
                  title={t.genderLabels[g]}
                  className={cn(
                    'flex-1 rounded-md border py-2 text-base transition-colors',
                    editGender === g
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground'
                  )}
                >
                  {g === 'male' ? '♂' : g === 'female' ? '♀' : '⚧'}
                </button>
              ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditSave}>{t.save}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
