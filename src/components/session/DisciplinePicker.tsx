import { useState } from "react";
import { Icon } from "@iconify/react";
import {
  DISCIPLINE_CATEGORIES,
  getDisciplinesByCategory,
  type DisciplineCategory,
} from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  customName?: string;
  onChange: (discipline: string, customName?: string) => void;
}

export default function DisciplinePicker({ value, customName, onChange }: DisciplinePickerProps) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState(customName ?? "");
  const { t } = useTranslation();

  const isCustom = value === "custom";

  const currentCat: DisciplineCategory =
    (DISCIPLINE_CATEGORIES.find((cat) =>
      getDisciplinesByCategory(cat.key).some(([k]) => k === value),
    )?.key) ?? "running";

  const currentIcon = isCustom
    ? "mdi:pencil-outline"
    : DISCIPLINE_CATEGORIES.find((c) => c.key === currentCat)?.icon;
  const currentLabel = isCustom
    ? (customName || t.disciplines.custom)
    : (t.disciplines[value] ?? value);

  function handleSelect(key: string) {
    onChange(key);
    setOpen(false);
  }

  function handleCustomConfirm() {
    if (!customInput.trim()) return;
    onChange("custom", customInput.trim());
    setOpen(false);
  }

  function handleOpen() {
    setCustomInput(customName ?? "");
    setOpen(true);
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={handleOpen}
      >
        {currentIcon && <Icon icon={currentIcon} className="h-5 w-5 shrink-0" />}
        <span>{currentLabel}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm lg:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.disciplineLabel}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue={currentCat}>
            <TabsList className="grid w-full grid-cols-4">
              {DISCIPLINE_CATEGORIES.map(({ key, icon }) => (
                <TabsTrigger key={key} value={key} className="px-1">
                  <Icon icon={icon} className="h-5 w-5" />
                </TabsTrigger>
              ))}
            </TabsList>

            {DISCIPLINE_CATEGORIES.map(({ key }) => (
              <TabsContent key={key} value={key} className="mt-3">
                <div className="h-[272px] overflow-y-auto">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    {t.categories[key]}
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {getDisciplinesByCategory(key).filter(([dKey]) => dKey !== "custom").map(([dKey]) => (
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
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Custom / Other section */}
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t.disciplines.custom}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder={t.customDisciplinePlaceholder}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCustomConfirm(); }}
                className="flex-1"
              />
              <Button
                onClick={handleCustomConfirm}
                disabled={!customInput.trim()}
              >
                {t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
