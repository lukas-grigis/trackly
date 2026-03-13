import { useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import { useSessionStore } from "@/store/session-store";
import type { Session } from "@/store/session-store";
import { DISCIPLINES } from "@/lib/constants";
import { formatTime, formatDistance } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import SessionCard from "@/components/session/SessionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function exportSessionCSV(session: Session) {
  const rows: string[] = ["Child,Discipline,Value,Unit,Date"];

  const childMap = new Map(session.children.map((c) => [c.id, c.name]));

  for (const result of session.results) {
    const childName = childMap.get(result.childId) ?? "Unknown";
    const config = DISCIPLINES[result.discipline];
    const formatted = config.isTimed
      ? formatTime(result.value)
      : formatDistance(result.value);

    rows.push(
      [
        `"${childName}"`,
        `"${config.label}"`,
        `"${formatted}"`,
        result.unit,
        result.recordedAt,
      ].join(",")
    );
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.name.replace(/\s+/g, "_")}_results.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HomePage() {
  const sessions = useSessionStore((s) => s.sessions);
  const addSession = useSessionStore((s) => s.addSession);
  const clearAllData = useSessionStore((s) => s.clearAllData);

  const [createOpen, setCreateOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  const handleCreate = () => {
    if (!newName.trim()) return;
    addSession(newName.trim(), newDate);
    setNewName("");
    setNewDate(new Date().toISOString().slice(0, 10));
    setCreateOpen(false);
  };

  const handleClear = () => {
    clearAllData();
    setClearOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sessions</h1>
          <div className="flex gap-2">
            {/* Clear all */}
            <Dialog open={clearOpen} onOpenChange={setClearOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={sessions.length === 0}>
                  <Trash2 className="size-4 mr-1" />
                  Clear All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Data</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all sessions, athletes, and results.
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setClearOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleClear}>
                    Delete Everything
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* New session */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-1" />
                  New Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Session</DialogTitle>
                  <DialogDescription>
                    Create a new athletics session.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="session-name">Name</Label>
                    <Input
                      id="session-name"
                      placeholder="e.g. Spring Sports Day"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-date">Date</Label>
                    <Input
                      id="session-date"
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={!newName.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No sessions yet. Create one to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <div key={session.id} className="relative">
                <SessionCard session={session} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-4 right-4"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    exportSessionCSV(session);
                  }}
                  title="Export CSV"
                >
                  <Download className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
