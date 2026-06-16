import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  to = "/",
}: {
  className?: string;
  to?: string;
}) {
  return (
    <Link to={to} className={cn("group flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow transition-transform group-hover:scale-105">
        <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">
        Bloom<span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}