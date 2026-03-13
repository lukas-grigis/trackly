import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSessionStore, type DisciplineType } from "@/store/session-store";
import { DISCIPLINES, DISCIPLINE_OPTIONS } from "@/lib/constants";
import { formatTime, formatDistance } from "@/lib/utils";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus } from "lucide-react";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.sessions.find((sess) => sess.id === id));
  const addChild = useSessionStore((s) => s.addChild);
  const removeChild = useSessionStore((s) => s.removeChild);
  const addResult = useSessionStore((s) => s.addResult);

  const [childName, setChildName] = useState("");
  const [childYear, setChildYear] = useState("");
  const [discipline, setDiscipline] = useState<DisciplineType>("sprint_60");
  const [selectedChild, setSelectedChild] = useState("");
  const [resultValue, setResultValue] = useState("");

  if (!session || !id) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Session nicht gefunden.
      </div>
    );
  }

  const disciplineConfig = DISCIPLINES[discipline];

  function handleAddChild() {
    if (!childName.trim() || !id) return;
    const year = childYear ? parseInt(childYear, 10) : undefined;
    addChild(id, childName.trim(), year);
    setChildName("");
    setChildYear("");
  }

  function handleAddResult() {
    if (!selectedChild || !resultValue || !id) return;
    const value = parseFloat(resultValue);
    if (isNaN(value)) return;
    addResult(id, {
      childId: selectedChild,
      discipline,
      value,
      unit: disciplineConfig.unit,
      recordedAt: new Date().toISOString(),
    });
    setResultValue("");
  }

  const filteredResults = session.results
    .filter((r) => r.discipline === discipline)
    .sort((a, b) =>
      disciplineConfig.sortAscending ? a.value - b.value : b.value - a.value,
    );

  const childMap = new Map(session.children.map((c) => [c.id, c]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{session.name}</h1>
      <p className="text-sm text-muted-foreground">{session.date}</p>

      <Tabs defaultValue="children">
        <TabsList className="w-full">
          <TabsTrigger value="children" className="flex-1">
            Kinder
          </TabsTrigger>
          <TabsTrigger value="results" className="flex-1">
            Ergebnisse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="children" className="space-y-4 pt-2">
          {session.children.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Kinder hinzugefügt.
            </p>
          ) : (
            <ul className="space-y-2">
              {session.children.map((child) => (
                <li
                  key={child.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <span className="font-medium">{child.name}</span>
                    {child.yearOfBirth && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        *{child.yearOfBirth}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeChild(id, child.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Kind hinzufügen</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Name"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChild()}
                className="flex-1"
              />
              <Input
                placeholder="Jahrgang"
                type="number"
                value={childYear}
                onChange={(e) => setChildYear(e.target.value)}
                className="w-24"
              />
              <Button size="icon" onClick={handleAddChild}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Disziplin</Label>
            <Select
              value={discipline}
              onValueChange={(v) => setDiscipline(v as DisciplineType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISCIPLINE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {disciplineConfig.isTimed ? (
            <Button
              className="w-full"
              onClick={() => navigate(ROUTES.RACE(id))}
              disabled={session.children.length === 0}
            >
              Rennen starten
            </Button>
          ) : (
            <div className="space-y-2">
              <Label>Ergebnis eintragen</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedChild}
                  onValueChange={(v) => { if (v) setSelectedChild(v); }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Kind wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {session.children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
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
                <Button onClick={handleAddResult}>Speichern</Button>
              </div>
            </div>
          )}

          <Separator />

          {filteredResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Ergebnisse für diese Disziplin.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 text-right">Ergebnis</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result, i) => (
                    <tr key={result.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{i + 1}</td>
                      <td className="py-2 pr-4">
                        {childMap.get(result.childId)?.name ?? "Unbekannt"}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {disciplineConfig.isTimed
                          ? formatTime(result.value)
                          : formatDistance(result.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
