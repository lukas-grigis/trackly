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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Plus, Users, Camera, Pencil } from 'lucide-react';

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

// ---------------------------------------------------------------------------
// Reusable form fields for add & edit dialogs
// ---------------------------------------------------------------------------

interface AthleteFormFieldsProps {
  name: string;
  onNameChange: (name: string) => void;
  year: number | null;
  onYearChange: (year: number | null) => void;
  gender: Gender | undefined;
  onGenderChange: (gender: Gender | undefined) => void;
  onSubmit: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}

function AthleteFormFields({
  name,
  onNameChange,
  year,
  onYearChange,
  gender,
  onGenderChange,
  onSubmit,
  t,
}: AthleteFormFieldsProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const isCustomYear = year !== null && !YEAR_OPTIONS.includes(year);

  function handleCustomConfirm() {
    const parsed = parseInt(customInput, 10);
    if (parsed > 1900 && parsed <= CURRENT_YEAR) {
      onYearChange(parsed);
    }
    setCustomOpen(false);
    setCustomInput('');
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>{t.childNameLabel}</Label>
        <Input
          autoFocus
          placeholder={t.childNameLabel}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className="mt-1"
        />
      </div>

      {/* Birth year chips — responsive grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
        {YEAR_OPTIONS.map((y) => (
          <button
            key={y}
            type="button"
            title={String(y)}
            onClick={() => {
              onYearChange(year === y ? null : y);
              setCustomOpen(false);
            }}
            className={cn(
              'rounded-md border py-2 text-xs font-medium tabular-nums transition-colors',
              year === y
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground'
            )}
          >
            {`'${String(y).slice(2)}`}
          </button>
        ))}
        {/* Custom entry slot */}
        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className={cn(
            'rounded-md border py-2 text-xs font-medium transition-colors',
            isCustomYear || customOpen
              ? 'border-accent bg-accent text-accent-foreground'
              : 'border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground'
          )}
        >
          {isCustomYear ? year : '···'}
        </button>
      </div>

      {/* Custom year input */}
      {customOpen && (
        <div className="flex gap-2">
          <Input
            autoFocus
            type="number"
            placeholder={t.birthYearExample}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomConfirm()}
            className="w-full max-w-32 text-base md:text-sm"
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
            onClick={() => onGenderChange(gender === g ? undefined : g)}
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Photo section used in add & edit dialogs
// ---------------------------------------------------------------------------

interface PhotoSectionProps {
  avatar: string | undefined;
  name: string;
  onPhotoSelect: (file: File) => void;
  onPhotoRemove: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}

function PhotoSection({ avatar, name, onPhotoSelect, onPhotoRemove, t }: PhotoSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      {avatar ? (
        <AthleteAvatar name={name || '?'} avatarBase64={avatar} />
      ) : (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 text-muted-foreground/40">
          <Camera className="h-4 w-4" />
        </span>
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        {avatar ? t.changePhoto : t.addPhoto}
      </Button>
      {avatar && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={onPhotoRemove}
        >
          {t.removePhoto}
        </Button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPhotoSelect(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function AthletesPage() {
  const athletes = useSessionStore((s) => s.athletes);
  const addAthlete = useSessionStore((s) => s.addAthlete);
  const updateAthlete = useSessionStore((s) => s.updateAthlete);
  const removeAthlete = useSessionStore((s) => s.removeAthlete);
  const { t } = useTranslation();

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [year, setYear] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

  // Delete confirmation
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  // Edit dialog state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState<number | null>(null);
  const [editGender, setEditGender] = useState<Gender | undefined>(undefined);
  const [editAvatar, setEditAvatar] = useState<string | undefined>(undefined);

  const handleAddPhotoSelect = useCallback(async (file: File) => {
    try {
      const dataUrl = await processImage(file);
      setAvatar(dataUrl);
    } catch {
      toast.warning(t.photoStorageFailed);
    }
  }, [t]);

  const handleEditPhotoSelect = useCallback(async (file: File) => {
    if (!editId) return;
    try {
      const dataUrl = await processImage(file);
      setEditAvatar(dataUrl);
    } catch {
      toast.warning(t.photoStorageFailed);
    }
  }, [editId, t]);

  function resetAddForm() {
    setName('');
    setYear(null);
    setGender(undefined);
    setAvatar(undefined);
  }

  function handleAdd() {
    if (!name.trim()) return;
    try {
      addAthlete(name.trim(), year ?? undefined, gender, avatar);
    } catch {
      addAthlete(name.trim(), year ?? undefined, gender);
      if (avatar) toast.warning(t.photoStorageFailed);
    }
    toast.success(t.athleteAdded);
    resetAddForm();
    setAddOpen(false);
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
    setEditAvatar(athlete.avatarBase64);
  }

  function handleEditSave() {
    if (!editId || !editName.trim()) return;
    try {
      updateAthlete(editId, editName.trim(), editYear ?? undefined, editGender, editAvatar);
    } catch {
      updateAthlete(editId, editName.trim(), editYear ?? undefined, editGender);
      if (editAvatar) toast.warning(t.photoStorageFailed);
    }
    toast.success(t.athleteUpdated);
    setEditId(null);
  }

  return (
    <div className="space-y-4">
      {/* Header with prominent Add button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold heading-tight">{t.athletesNav}</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.addChild}
        </Button>
      </div>

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
                <div className="shrink-0">
                  <AthleteAvatar name={athlete.name} avatarBase64={athlete.avatarBase64} />
                </div>
                <Link
                  to={ROUTES.ATHLETE(athlete.id)}
                  className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 hover:underline underline-offset-2"
                >
                  <span className="font-medium truncate" title={athlete.name}>
                    {athlete.name}
                  </span>
                  <AgeGroupBadge yearOfBirth={athlete.yearOfBirth} />
                  <GenderBadge gender={athlete.gender} />
                  {athlete.yearOfBirth && <span className="text-sm text-muted-foreground">*{athlete.yearOfBirth}</span>}
                </Link>
              </div>
              <div className="flex items-center gap-1 shrink-0">
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

      {/* Add Athlete Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (!open) resetAddForm();
          setAddOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addChild}</DialogTitle>
            <DialogDescription className="sr-only">{t.addChild}</DialogDescription>
          </DialogHeader>
          <AthleteFormFields
            name={name}
            onNameChange={setName}
            year={year}
            onYearChange={setYear}
            gender={gender}
            onGenderChange={setGender}
            onSubmit={handleAdd}
            t={t}
          />
          <PhotoSection
            avatar={avatar}
            name={name}
            onPhotoSelect={handleAddPhotoSelect}
            onPhotoRemove={() => setAvatar(undefined)}
            t={t}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleAdd} className="sm:flex-1">
              <Plus className="h-4 w-4 mr-2" />
              {t.addChild}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Athlete Dialog (proper Dialog, not AlertDialog) */}
      <Dialog open={editId !== null} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editAthlete}</DialogTitle>
            <DialogDescription className="sr-only">{t.editAthlete}</DialogDescription>
          </DialogHeader>
          <AthleteFormFields
            name={editName}
            onNameChange={setEditName}
            year={editYear}
            onYearChange={setEditYear}
            gender={editGender}
            onGenderChange={setEditGender}
            onSubmit={handleEditSave}
            t={t}
          />
          <PhotoSection
            avatar={editAvatar}
            name={editName}
            onPhotoSelect={handleEditPhotoSelect}
            onPhotoRemove={() => setEditAvatar(undefined)}
            t={t}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>
              {t.cancel}
            </Button>
            <Button onClick={handleEditSave} className="sm:flex-1">
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation — AlertDialog is correct for destructive actions */}
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
    </div>
  );
}
