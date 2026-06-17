import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  accent?: "primary" | "purple" | "cyan" | "success";
}) {
  const accentMap: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    purple: "bg-brand-purple/12 text-brand-purple",
    cyan: "bg-brand-cyan/15 text-brand-cyan",
    success: "bg-success/15 text-success",
  };

  return (
    <Card className="shadow-card flex flex-col gap-4 rounded-2xl border-border p-5 transition-shadow hover:shadow-glow">
      <div className="flex items-center justify-between">
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </span>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend.up ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
            )}
          >
            {trend.up ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}