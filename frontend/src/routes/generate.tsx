import { useState, useRef, type DragEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  Sparkles,
  Wand2,
  Minus,
  Plus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "Generate Question Bank — BloomAI" },
      { name: "description", content: "Upload study material and configure your AI-generated question bank." },
    ],
  }),
  component: GeneratePage,
});

type Difficulty = "Easy" | "Medium" | "Hard";

function GeneratePage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileData, setFileData] = useState<{ file: File; name: string; size: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [twoMark, setTwoMark] = useState(10);
  const [thirteenMark, setThirteenMark] = useState(5);
  const [thirteenPattern, setThirteenPattern] = useState("single");
  const [sixteenMark, setSixteenMark] = useState(3);
  const [sixteenPattern, setSixteenPattern] = useState("single");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [questionType, setQuestionType] = useState<string>("mixed");
  const [withAnswers, setWithAnswers] = useState(true);
  const [loading, setLoading] = useState(false);

  const acceptFile = (f: File) => {
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    setFileData({ file: f, name: f.name, size: `${(f.size / 1024 / 1024).toFixed(2)} MB` });
    toast.success("PDF uploaded successfully");
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const generate = async () => {
    if (!fileData) {
      toast.error("Upload a PDF before generating");
      return;
    }
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('pdf', fileData.file);
      formData.append('twoMark', String(twoMark));
      formData.append('thirteenMark', String(thirteenMark));
      formData.append('thirteenPattern', thirteenPattern);
      formData.append('sixteenMark', String(sixteenMark));
      formData.append('sixteenPattern', sixteenPattern);
      formData.append('difficulty', difficulty);
      formData.append('withAnswers', String(withAnswers));
      formData.append('questionType', questionType);

      const response = await fetch('http://localhost:5000/api/questions/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = 'Failed to generate questions';
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      // Save to sessionStorage to access on the results page
      sessionStorage.setItem('generatedQuestions', JSON.stringify(data.questions));

      toast.success("Question bank generated!");
      navigate({ to: "/results" });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];

  return (
    <AppShell
      title="Generate Question Bank"
      subtitle="Upload material, set your pattern, and let BloomAI do the rest."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: upload + config */}
        <div className="space-y-6 lg:col-span-3">
          {/* Upload */}
          <Card className="shadow-card rounded-2xl border-border p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">1</span>
              <h3 className="font-semibold">Upload PDF</h3>
            </div>

            {!fileData ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/40 hover:border-primary/50 hover:bg-muted/60",
                )}
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow">
                  <UploadCloud className="h-7 w-7" />
                </span>
                <p className="mt-4 font-medium">Drag & drop your PDF here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or <span className="font-medium text-primary">browse files</span> · Max 20MB
                </p>
              </button>
            ) : (
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                  <FileText className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{fileData.name}</p>
                  <p className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded · {fileData.size}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFileData(null)}
                  aria-label="Remove file"
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) acceptFile(f);
              }}
            />
          </Card>

          {/* Config */}
          <Card className="shadow-card rounded-2xl border-border p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">2</span>
              <h3 className="font-semibold">Question Configuration</h3>
            </div>

            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="two">2-Mark Questions</Label>
                <NumberInput
                  id="two"
                  min={0}
                  value={twoMark}
                  onChange={(v) => setTwoMark(v)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="thirteen">13-Mark Questions</Label>
                  <NumberInput
                    id="thirteen"
                    min={0}
                    value={thirteenMark}
                    onChange={(v) => setThirteenMark(v)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>13-Mark Pattern</Label>
                  <Select value={thirteenPattern} onValueChange={setThirteenPattern}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single 13</SelectItem>
                      <SelectItem value="8+5">8 + 5</SelectItem>
                      <SelectItem value="7+6">7 + 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="sixteen">16-Mark Questions</Label>
                  <NumberInput
                    id="sixteen"
                    min={0}
                    value={sixteenMark}
                    onChange={(v) => setSixteenMark(v)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>16-Mark Pattern</Label>
                  <Select value={sixteenPattern} onValueChange={setSixteenPattern}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single 16</SelectItem>
                      <SelectItem value="8+8">8 + 8</SelectItem>
                      <SelectItem value="10+6">10 + 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="questionType">Question Type Focus</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger className="rounded-xl" id="questionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed (Default)</SelectItem>
                    <SelectItem value="theory">Theory Only</SelectItem>
                    <SelectItem value="maths">Maths & Numerical Problems</SelectItem>
                    <SelectItem value="algorithms">Algorithms & DSA</SelectItem>
                    <SelectItem value="derivations">Derivations & Proofs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <div className="grid grid-cols-3 gap-2">
                  {difficulties.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                        difficulty === d
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Generate Answers</p>
                  <p className="text-xs text-muted-foreground">Include model answers for each question</p>
                </div>
                <Switch checked={withAnswers} onCheckedChange={setWithAnswers} />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: summary + generate */}
        <div className="lg:col-span-2">
          <Card className="shadow-card sticky top-24 rounded-2xl border-border p-6">
            <h3 className="font-semibold">Summary</h3>
            <p className="text-sm text-muted-foreground">Review your configuration</p>
            <dl className="mt-5 space-y-3 text-sm">
              <Row label="2-Mark questions" value={String(twoMark)} />
              <Row label="13-Mark questions" value={`${thirteenMark} (${labelFor(thirteenPattern)})`} />
              <Row label="16-Mark questions" value={`${sixteenMark} (${labelFor(sixteenPattern)})`} />
              <Row label="Difficulty" value={difficulty} />
              <Row label="Type Focus" value={labelForType(questionType)} />
              <Row label="Answers" value={withAnswers ? "Included" : "Excluded"} />
              <div className="border-t border-border pt-3">
                <Row
                  label="Total marks"
                  value={String(twoMark * 2 + thirteenMark * 13 + sixteenMark * 16)}
                  bold
                />
              </div>
            </dl>

            <Button
              onClick={generate}
              disabled={loading}
              size="lg"
              className="mt-6 h-12 w-full bg-gradient-brand text-base text-primary-foreground shadow-glow hover:opacity-90"
            >
              {loading ? (
                <>
                  <LoadingSpinner size={18} /> Generating…
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" /> Generate Question Bank
                </>
              )}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by Bloom's Taxonomy AI
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn(bold ? "text-base font-bold" : "font-medium")}>{value}</dd>
    </div>
  );
}

function labelFor(p: string) {
  const map: Record<string, string> = {
    single: "Single",
    "8+5": "8 + 5",
    "7+6": "7 + 6",
    "8+8": "8 + 8",
    "10+6": "10 + 6",
  };
  return map[p] ?? p;
}

function labelForType(t: string) {
  const map: Record<string, string> = {
    mixed: "Mixed (Default)",
    theory: "Theory Only",
    maths: "Maths & Numerical Problems",
    algorithms: "Algorithms & DSA",
    derivations: "Derivations & Proofs",
  };
  return map[t] ?? t;
}

function NumberInput({ id, value, onChange, min = 0 }: { id?: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="relative flex items-center w-full rounded-xl border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring transition-shadow overflow-hidden">
      <input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="flex flex-col border-l border-input">
        <button
          type="button"
          className="flex h-5 w-8 items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors border-b border-input"
          onClick={() => onChange(value + 1)}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          className="flex h-5 w-8 items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-50"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}