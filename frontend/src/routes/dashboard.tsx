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
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/app-shell";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  const [stats, setStats] = useState({ total_pdfs: 0, total_generated: 0, total_exports: 0, total_tokens: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          fetch('http://localhost:5000/api/stats'),
          fetch('http://localhost:5000/api/history')
        ]);
        const statsData = await statsRes.json();
        const historyData = await historyRes.json();
        
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
        if (historyData.success && historyData.history) {
          setHistory(historyData.history);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute distributions
  const bloomDistribution = [
    { level: "Remember", count: 0 },
    { level: "Understand", count: 0 },
    { level: "Apply", count: 0 },
    { level: "Analyze", count: 0 },
    { level: "Evaluate", count: 0 },
    { level: "Create", count: 0 },
  ];

  let twoMarks = 0;
  let thirteenMarks = 0;
  let sixteenMarks = 0;

  history.forEach(bank => {
    bank.questions?.forEach((q: any) => {
      // Bloom
      const level = bloomDistribution.find(b => b.level.toLowerCase() === q.bloom?.toLowerCase());
      if (level) level.count++;
      
      // Marks
      if (q.marks === 2) twoMarks++;
      else if (q.marks === 13) thirteenMarks++;
      else if (q.marks === 16) sixteenMarks++;
    });
  });

  const questionDistribution = [
    { name: "2 Marks", value: twoMarks, fill: "var(--color-chart-1)" },
    { name: "13 Marks", value: thirteenMarks, fill: "var(--color-chart-2)" },
    { name: "16 Marks", value: sixteenMarks, fill: "var(--color-chart-3)" },
  ];

  const usageTrend = [
    { month: "Jan", banks: 0 },
    { month: "Feb", banks: 0 },
    { month: "Mar", banks: 0 },
    { month: "Apr", banks: 0 },
    { month: "May", banks: 0 },
    { month: "Jun", banks: history.length }, // Simplify to current month for now
  ];

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
        <StatCard label="PDFs Uploaded" value={stats.total_pdfs.toString()} icon={FileText} trend={{ value: "0%", up: true }} accent="primary" />
        <StatCard label="Question Banks Generated" value={stats.total_generated.toString()} icon={Layers} trend={{ value: "0%", up: true }} accent="purple" />
        <StatCard label="Exports Downloaded" value={stats.total_exports.toString()} icon={Download} trend={{ value: "0%", up: true }} accent="cyan" />
        <StatCard label="AI Usage (tokens)" value={stats.total_tokens.toString()} icon={Activity} trend={{ value: "0%", up: true }} accent="success" />
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
            {history.slice(0, 4).map((h: any) => (
              <li key={h.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.questions?.length || 0} questions · {new Date(h.created_at).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            )}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}