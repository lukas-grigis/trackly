import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Play } from "lucide-react";
import { useSessionStore } from "@/store/session-store";
import type { DisciplineType } from "@/store/session-store";
import { DISCIPLINES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import ChildList from "@/components/session/ChildList";
import DisciplineSelect from "@/components/session/DisciplineSelect";
import ResultsTable from "@/components/session/ResultsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.getSession(id ?? ""));
  const updateSession = useSessionStore((s) => s.updateSession);
  const addResult = useSessionStore((s) => s.addResult);

  const [activeTab, setActiveTab] = useState("athletes");
  const [discipline, setDiscipline] = useState<DisciplineType | "">("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");

  // Add result form state
  const [resultChildId, setResultChildId] = useState("");
  const [resultValue, setResultValue] = useState("");

  if (!session) {
    return (
      <AppLayout>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Session not found.</p>
          <Link to="/" className="text-primary underline text-sm mt-2 inline-block">
            Back to home
          </Link>
        </div>
      </AppLayout>
    );
  }

  const openEdit = () => {
    setEditName(session.name);
    setEditDate(session.date);
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editName.trim()) return;
    updateSession(session.id, editName.trim(), editDate);
    setEditOpen(false);
  };

  const handleAddResult = () => {
    if (!discipline || !resultChildId || !resultValue) return;
    const config = DISCIPLINES[discipline];
    const numValue = parseFloat(resultValue);
    if (isNaN(numValue) || numValue <= 0) return;

    addResult(session.id, {
      childId: resultChildId,
      discipline,
      value: numValue,
      unit: config.unit,
      recordedAt: new Date().toISOString(),
    });
    setResultValue("");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">{session.name}</h1>
              <p className="text-sm text-muted-foreground">{session.date}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={openEdit}>
              <Pencil className="size-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="athletes">Athletes</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="athletes">
            <ChildList sessionId={session.id} children={session.children} />
          </TabsContent>

          <TabsContent value="results">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <DisciplineSelect value={discipline} onChange={setDiscipline} />

                <Button asChild size="lg" className={cn(session.children.length === 0 && "pointer-events-none opacity-50")}>
                  <Link to={`/session/${session.id}/race`}>
                    <Play className="size-4 mr-1" />
                    Start Race
                  </Link>
                </Button>
              </div>

              {/* Add individual result */}
              {discipline && (
                <div className="rounded-md border p-4 space-y-3">
                  <h3 className="text-sm font-medium">Add Result</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={resultChildId}
                      onValueChange={setResultChildId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select athlete" />
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
                      className="w-32"
                      type="number"
                      placeholder={
                        DISCIPLINES[discipline].isTimed
                          ? "Time (ms)"
                          : "Distance (cm)"
                      }
                      value={resultValue}
                      onChange={(e) => setResultValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddResult()}
                    />
                    <Button
                      onClick={handleAddResult}
                      disabled={!resultChildId || !resultValue}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Results table */}
              {discipline && (
                <ResultsTable
                  results={session.results}
                  children={session.children}
                  discipline={discipline}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Session</DialogTitle>
              <DialogDescription>
                Update the session name and date.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEdit} disabled={!editName.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
