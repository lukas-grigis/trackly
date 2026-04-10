import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { DISCIPLINES, DISCIPLINE_CATEGORIES, getDisciplinesByCategory, type DisciplineCategory } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAVORITES_KEY = 'trackly-fav-disciplines';

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed: string[] = JSON.parse(raw);
    return parsed.filter((key) => key in DISCIPLINES);
  } catch {
    return [];
  }
}

function saveFavorites(favs: string[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch {
    /* ignore */
  }
}

interface DisciplinePickerProps {
  value: string;
  customName?: string;
  onChange: (discipline: string, customName?: string) => void;
}

export default function DisciplinePicker({ value, customName, onChange }: DisciplinePickerProps) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState(customName ?? '');
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const { t } = useTranslation();

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const isCustom = value === 'custom';
  const currentConfig = DISCIPLINES[value];
  const currentIcon = isCustom ? 'mdi:pencil-outline' : currentConfig?.icon;
  const currentLabel = isCustom ? customName || t.disciplines.custom : (t.disciplines[value] ?? value);

  function handleSelect(key: string) {
    onChange(key);
    setOpen(false);
  }

  function handleCustomConfirm() {
    if (!customInput.trim()) return;
    onChange('custom', customInput.trim());
    setOpen(false);
  }

  function toggleFavorite(key: string) {
    setFavorites((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  }

  function handleOpen() {
    setCustomInput(customName ?? '');
    setOpen(true);
  }

  // Determine default tab: if current discipline belongs to a category, open that
  const currentCat: DisciplineCategory =
    DISCIPLINE_CATEGORIES.find((cat) => getDisciplinesByCategory(cat.key).some(([k]) => k === value))?.key ?? 'sprint';

  const defaultTab = favorites.length > 0 ? 'favorites' : currentCat;

  // Shared discipline button renderer
  function DisciplineButton({ dKey, showFav = true }: { dKey: string; showFav?: boolean }) {
    const config = DISCIPLINES[dKey];
    if (!config) return null;
    const isFav = favorites.includes(dKey);
    return (
      <button
        key={dKey}
        type="button"
        onClick={() => handleSelect(dKey)}
        className={cn(
          'tap-target group relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm text-left transition-all',
          value === dKey
            ? 'border-primary bg-primary/10 font-semibold text-primary'
            : 'border-border bg-card hover:border-primary/30 hover:bg-primary/5'
        )}
      >
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base',
            value === dKey ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon icon={config.icon} width={18} height={18} />
        </span>
        <span className="flex-1 truncate">{t.disciplines[dKey] ?? dKey}</span>
        {showFav && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(dKey);
            }}
            className={cn(
              'shrink-0 rounded-full p-1 transition-colors',
              isFav
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-amber-500'
            )}
            aria-label={isFav ? t.removeFavorite : t.addFavorite}
          >
            <Star className="h-3.5 w-3.5" fill={isFav ? 'currentColor' : 'none'} />
          </button>
        )}
      </button>
    );
  }

  const favDisciplines = favorites.filter((f) => f in DISCIPLINES && f !== 'custom');

  return (
    <>
      <Button variant="outline" className="w-full justify-start gap-2.5 h-11" onClick={handleOpen}>
        {currentIcon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon icon={currentIcon} width={16} height={16} />
          </span>
        )}
        <span className="truncate">{currentLabel}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm sm:max-w-md lg:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.disciplineLabel}</DialogTitle>
            <DialogDescription className="sr-only">{t.disciplineLabel}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={defaultTab}>
            <TabsList className={cn('grid w-full', favDisciplines.length > 0 ? 'grid-cols-6' : 'grid-cols-5')}>
              {favDisciplines.length > 0 && (
                <TabsTrigger value="favorites" className="px-1 gap-1">
                  <Star className="h-4 w-4" fill="currentColor" />
                </TabsTrigger>
              )}
              {DISCIPLINE_CATEGORIES.map(({ key, icon }) => (
                <TabsTrigger key={key} value={key} className="px-1">
                  <Icon icon={icon} className="h-5 w-5" />
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Favorites tab */}
            {favDisciplines.length > 0 && (
              <TabsContent value="favorites" className="mt-3">
                <div className="max-h-[320px] overflow-y-auto">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{t.favorites}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {favDisciplines.map((dKey) => (
                      <DisciplineButton key={dKey} dKey={dKey} />
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Category tabs */}
            {DISCIPLINE_CATEGORIES.map(({ key }) => (
              <TabsContent key={key} value={key} className="mt-3">
                <div className="max-h-[320px] overflow-y-auto">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{t.categories[key] ?? key}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getDisciplinesByCategory(key)
                      .filter(([dKey]) => dKey !== 'custom')
                      .map(([dKey]) => (
                        <DisciplineButton key={dKey} dKey={dKey} />
                      ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Custom section */}
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">{t.disciplines.custom}</p>
            <div className="flex gap-2">
              <Input
                placeholder={t.customDisciplinePlaceholder}
                aria-label={t.customDisciplinePlaceholder}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomConfirm();
                }}
                className="flex-1"
              />
              <Button onClick={handleCustomConfirm} disabled={!customInput.trim()}>
                {t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
