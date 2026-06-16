import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Layers,
  Download,
  Activity,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { AppShell } from "@/components/app/app-shell";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  bloomDistribution,
  questionDistribution,
  sampleHistory,
  usageTrend,
} from "@/lib/sample-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BloomAI" },
      { name: "description", content: "Your BloomAI activity, usage and question bank insights." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell
      title="Welcome back, Dr. Rao"
      subtitle="Here's what's happening with your question banks."
      actions={
        <Button asChild className="bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90">
          <Link to="/generate">
            <Sparkles className="h-4 w-4" /> Generate
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="PDFs Uploaded" value="34" icon={FileText} trend={{ value: "12%", up: true }} accent="primary" />
        <StatCard label="Question Banks Generated" value="58" icon={Layers} trend={{ value: "18%", up: true }} accent="purple" />
        <StatCard label="Exports Downloaded" value="126" icon={Download} trend={{ value: "9%", up: true }} accent="cyan" />
        <StatCard label="AI Usage (tokens)" value="2.4M" icon={Activity} trend={{ value: "3%", up: false }} accent="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card rounded-2xl border-border p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Question Banks Generated</h3>
              <p className="text-sm text-muted-foreground">Last 6 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={usageTrend} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="bankFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" stroke="var(--color-muted-foreground)" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-popover-foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey="banks"
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                fill="url(#bankFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="shadow-card rounded-2xl border-border p-6">
          <h3 className="font-semibold">Question Distribution</h3>
          <p className="text-sm text-muted-foreground">By mark weightage</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={questionDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                strokeWidth={0}
              >
                {questionDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-popover-foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-2">
            {questionDistribution.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                  {d.name}
                </span>
                <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card rounded-2xl border-border p-6 lg:col-span-2">
          <h3 className="font-semibold">Bloom's Taxonomy Distribution</h3>
          <p className="text-sm text-muted-foreground">Across all generated questions</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bloomDistribution} margin={{ left: -20, right: 8 }}>
              <XAxis dataKey="level" tickLine={false} axisLine={false} className="text-xs" stroke="var(--color-muted-foreground)" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" stroke="var(--color-muted-foreground)" />
              <Tooltip
                cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-popover-foreground)",
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="var(--color-chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="shadow-card rounded-2xl border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent Activity</h3>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link to="/history">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <ul className="space-y-3">
            {sampleHistory.slice(0, 4).map((h) => (
              <li key={h.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.pdfName}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.questions} questions · {h.date}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}