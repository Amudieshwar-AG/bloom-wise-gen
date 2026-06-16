import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bloomColors, type Question } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

export function QuestionCard({ question }: { question: Question }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `Q${question.number}. (${question.marks} marks) ${question.text}`,
      );
      setCopied(true);
      toast.success("Question copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy question");
    }
  };

  return (
    <Card className="shadow-card group rounded-2xl border-border p-5 transition-shadow hover:shadow-glow">
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-brand text-sm font-bold text-primary-foreground">
          {question.number}
        </span>
        <Badge variant="secondary" className="rounded-full font-semibold">
          {question.marks} Marks
        </Badge>
        <Badge
          variant="outline"
          className={cn("rounded-full border font-medium", bloomColors[question.bloom])}
        >
          {question.bloom}
        </Badge>
        {question.hasAnswer && (
          <Badge variant="outline" className="rounded-full border-success/30 bg-success/10 font-medium text-success">
            Answer included
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={copy}
          aria-label="Copy question"
          className="ml-auto h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-card-foreground">{question.text}</p>
    </Card>
  );
}