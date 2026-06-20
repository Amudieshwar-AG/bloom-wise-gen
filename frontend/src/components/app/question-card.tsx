import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bloomColors, type Question } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export function QuestionCard({ question }: { question: Question }) {
  const [copied, setCopied] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

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
      <div className="mt-3 text-[15px] leading-relaxed text-card-foreground [&>p]:mb-2 last:[&>p]:mb-0">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {question.text}
        </ReactMarkdown>
      </div>
      {question.modelAnswer && (
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAnswer(!showAnswer)}
            className="text-xs text-muted-foreground mb-3"
          >
            {showAnswer ? "Hide Answer" : "View Answer"}
          </Button>
          
          {showAnswer && (
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground border border-border/50">
              <p className="font-semibold text-foreground/80 mb-1">Answer:</p>
              <div className="leading-relaxed [&>p]:mb-2 last:[&>p]:mb-0">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {question.modelAnswer}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}