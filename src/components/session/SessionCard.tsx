import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Session } from "@/store/session-store";
import { useSessionStore } from "@/store/session-store";
import { useTranslation } from "@/lib/i18n";
import { formatLocalDate } from "@/lib/locale";

interface SessionCardProps {
  session: Session;
  onDelete: (id: string) => void;
}

export default function SessionCard({ session, onDelete }: SessionCardProps) {
  const navigate = useNavigate();
  const updateSession = useSessionStore((s) => s.updateSession);
  const { t } = useTranslation();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(session.name);
  const [editDate, setEditDate] = useState(session.date);

  function handleSaveEdit() {
    if (!editName.trim()) return;
    updateSession(session.id, editName.trim(), editDate);
    setEditOpen(false);
  }

  function openEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditName(session.name);
    setEditDate(session.date);
    setEditOpen(true);
  }

  return (
    <>
      <Card
        className="cursor-pointer border-l-4 border-l-primary transition-all hover:shadow-md hover:-translate-y-0.5"
        onClick={() => navigate(`/session/${session.id}`)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{session.name}</CardTitle>
              <CardDescription>{formatLocalDate(session.date)}</CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={openEdit}
                aria-label={t.editSession}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteOpen(true);
                }}
                aria-label={t.deleteSession}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Badge className="bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30">
            {session.athleteIds.length} {t.athletes}
          </Badge>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            {session.heats.reduce((sum, h) => sum + h.results.length, 0)} {t.results}
          </Badge>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteSessionConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteSessionDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(session.id)}
            >
              {t.deleteSession}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t.editSession}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-session-name">{t.sessionName}</Label>
              <Input
                id="edit-session-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-session-date">{t.sessionDate}</Label>
              <Input
                id="edit-session-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSaveEdit}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
