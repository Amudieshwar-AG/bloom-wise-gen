import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  FileDown,
  FileText,
  RefreshCw,
  Copy,
  Check,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { QuestionCard } from "@/components/app/question-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/loading-spinner";
import { sampleQuestions, type Question } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Generated Questions — BloomAI" },
      { name: "description", content: "Your AI-generated, Bloom's-balanced question bank." },
    ],
  }),
  component: Results,
});

const filters = ["All", "2 Marks", "13 Marks", "16 Marks"] as const;
type Filter = (typeof filters)[number];

function Results() {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('generatedQuestions');
    if (stored) {
      try {
        setQuestions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse generated questions", e);
      }
    }
  }, []);

  const visible = useMemo(() => {
    return questions.filter((q) => {
      const markMatch =
        filter === "All" || `${q.marks} Marks` === filter;
      const searchMatch =
        q.text.toLowerCase().includes(query.toLowerCase()) ||
        q.bloom.toLowerCase().includes(query.toLowerCase());
      return markMatch && searchMatch;
    });
  }, [filter, query, questions]);

  const regenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setRegenerating(false);
      toast.success("Questions regenerated");
    }, 1800);
  };

  const copyAll = async () => {
    try {
      const text = visible
        .map((q) => `Q${q.number}. (${q.marks} marks) [${q.bloom}] ${q.text}`)
        .join("\n\n");
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      toast.success("All questions copied");
      setTimeout(() => setCopiedAll(false), 1600);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <AppShell
      title="Generated Question Bank"
      subtitle="DBMS · Unit 3 — Normalization · 8 questions"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyAll}>
            {copiedAll ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            Copy All
          </Button>
          <Button variant="outline" onClick={() => toast.success("Downloading DOCX…")}>
            <FileText className="h-4 w-4" /> DOCX
          </Button>
          <Button
            className="bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90"
            onClick={() => toast.success("Downloading PDF…")}
          >
            <FileDown className="h-4 w-4" /> PDF
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions..."
              className="rounded-full pl-9"
            />
          </div>
          <Button variant="outline" onClick={regenerate} disabled={regenerating} className="shrink-0">
            {regenerating ? (
              <LoadingSpinner size={16} />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Regenerate</span>
          </Button>
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-4">
          {visible.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <SearchX className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">No questions match your filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different filter or search term.</p>
        </div>
      )}
    </AppShell>
  );
}