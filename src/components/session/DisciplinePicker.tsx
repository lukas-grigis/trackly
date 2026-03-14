import { useState } from "react";
import {
  DISCIPLINE_CATEGORIES,
  getDisciplinesByCategory,
  type DisciplineCategory,
} from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface DisciplinePickerProps {
  value: string;
  onChange: (discipline: string) => void;
}

export default function DisciplinePicker({ value, onChange }: DisciplinePickerProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  // Determine which category the current value belongs to for default tab
  const currentCat: DisciplineCategory =
    (DISCIPLINE_CATEGORIES.find((cat) =>
      getDisciplinesByCategory(cat.key).some(([k]) => k === value),
    )?.key) ?? "running";

  const currentLabel = t.disciplines[value] ?? value;
  const CurrentIcon =
    DISCIPLINE_CATEGORIES.find((c) => c.key === currentCat)?.icon;

  function handleSelect(key: string) {
    onChange(key);
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={() => setOpen(true)}
      >
        {CurrentIcon && <CurrentIcon className="h-4 w-4 shrink-0" />}
        <span>{currentLabel}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.disciplineLabel}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue={currentCat}>
            <TabsList className="grid w-full grid-cols-4">
              {DISCIPLINE_CATEGORIES.map(({ key, icon: Icon }) => (
                <TabsTrigger key={key} value={key} className="px-1">
                  <Icon className="h-4 w-4" />
                </TabsTrigger>
              ))}
            </TabsList>

            {DISCIPLINE_CATEGORIES.map(({ key }) => (
              <TabsContent key={key} value={key} className="mt-3">
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  {t.categories[key]}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {getDisciplinesByCategory(key).map(([dKey]) => (
                    <Button
                      key={dKey}
                      variant="outline"
                      className={cn(
                        "tap-target h-11 justify-start text-sm",
                        value === dKey && "border-primary bg-primary/10 font-semibold",
                      )}
                      onClick={() => handleSelect(dKey)}
                    >
                      {t.disciplines[dKey] ?? dKey}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
