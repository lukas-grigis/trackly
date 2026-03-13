import { useState } from "react";
import { useSessionStore } from "@/store/session-store";
import type { Session } from "@/store/session-store";
import { DISCIPLINES } from "@/lib/constants";
import { formatTime, formatDistance } from "@/lib/utils";
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
import { Plus, Download, Trash2 } from "lucide-react";
import SessionCard from "@/components/session/SessionCard";

function exportSessionCsv(session: Session) {
  const childMap = new Map(session.children.map((c) => [c.id, c.name]));
  const rows = [
    ["Child", "Discipline", "Value", "Unit", "Date"],
    ...session.results.map((r) => [
      childMap.get(r.childId) ?? "Unknown",
      DISCIPLINES[r.discipline].label,
      r.unit === "ms" ? formatTime(r.value) : formatDistance(r.value),
      r.unit,
      r.recordedAt,
    ]),
  ];
  const csv = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
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
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const clearAllData = useSessionStore((s) => s.clearAllData);

  const [open, setOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  function handleCreate() {
    if (!name.trim()) return;
    addSession(name.trim(), date);
    setName("");
    setDate(new Date().toISOString().slice(0, 10));
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="session-name">Name</Label>
                <Input
                  id="session-name"
                  placeholder="e.g. Spring Meet 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-date">Date</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleCreate}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No sessions yet. Create a new session to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="relative">
              <SessionCard session={session} onDelete={deleteSession} />
              {session.results.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 bottom-2 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportSessionCsv(session);
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  CSV
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="pt-4 border-t">
          <Dialog open={clearOpen} onOpenChange={setClearOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear All Data</DialogTitle>
                <DialogDescription>
                  This will permanently delete all sessions, athletes, and
                  results. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClearOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    clearAllData();
                    setClearOpen(false);
                  }}
                >
                  Delete Everything
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
