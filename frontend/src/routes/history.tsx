import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, Download, Trash2, FileText, FileX } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { sampleHistory, type HistoryEntry } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — BloomAI" },
      { name: "description", content: "Review and manage your previously generated question banks." },
    ],
  }),
  component: HistoryPage,
});

const statusStyles: Record<HistoryEntry["status"], string> = {
  Completed: "border-success/30 bg-success/10 text-success",
  Processing: "border-primary/30 bg-primary/10 text-primary",
  Failed: "border-destructive/30 bg-destructive/10 text-destructive",
};

function HistoryPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [pending, setPending] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/history');
        const data = await res.json();
        if (data.success) {
          setRows(data.history);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const confirmDelete = () => {
    if (!pending) return;
    setRows((r) => r.filter((row) => row.id !== pending.id));
    toast.success(`Deleted "${pending.filename}"`);
    setPending(null);
  };

  return (
    <AppShell title="History" subtitle="All your generated question banks in one place.">
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-24 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <FileX className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">No history yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Generated question banks will appear here.</p>
          <Button
            className="mt-5 bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90"
            onClick={() => navigate({ to: "/generate" })}
          >
            Generate your first bank
          </Button>
        </div>
      ) : (
        <Card className="shadow-card overflow-hidden rounded-2xl border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>PDF Name</TableHead>
                <TableHead className="hidden sm:table-cell">Generated</TableHead>
                <TableHead className="hidden md:table-cell">Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.filename}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{new Date(row.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{new Date(row.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="hidden md:table-cell">{row.questions?.length || 0}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("rounded-full border font-medium", statusStyles["Completed"])}>
                      Completed
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="View"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => navigate({ to: "/results" })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Download"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => toast.success("Downloading…")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setPending(row)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question bank?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{pending?.pdfName}”. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}