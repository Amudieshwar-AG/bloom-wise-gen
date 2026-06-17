import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Upload,
  Brain,
  Layers,
  Gauge,
  FileDown,
  Settings2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BloomAI — Smarter Exams. Better Outcomes." },
      {
        name: "description",
        content:
          "BloomAI turns your study material into balanced examination question banks using AI and Bloom's Taxonomy. Built for faculty in colleges and universities.",
      },
      { property: "og:title", content: "BloomAI — Smarter Exams. Better Outcomes." },
      {
        property: "og:description",
        content:
          "Upload PDFs, configure your paper, and generate Bloom's-balanced question banks in seconds.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Upload,
    title: "PDF Upload",
    desc: "Drag and drop your lecture notes, textbooks, or study material. We parse it instantly.",
  },
  {
    icon: Brain,
    title: "AI Question Generation",
    desc: "State-of-the-art models craft clear, exam-ready questions grounded in your content.",
  },
  {
    icon: Layers,
    title: "Bloom's Taxonomy",
    desc: "Every question is mapped across the six cognitive levels for a balanced paper.",
  },
  {
    icon: Gauge,
    title: "Difficulty Control",
    desc: "Target easy, medium, or hard. Medium-difficulty selection by default for fair exams.",
  },
  {
    icon: FileDown,
    title: "DOCX / PDF Export",
    desc: "Download polished, print-ready question banks in the format your department needs.",
  },
  {
    icon: Settings2,
    title: "Flexible Patterns",
    desc: "Configure 2, 13, and 16-mark questions with split patterns to match your blueprint.",
  },
];

const steps = [
  { num: "01", title: "Upload PDF", desc: "Add your study material in a single drag and drop." },
  { num: "02", title: "Configure Pattern", desc: "Set marks, splits, difficulty, and answer options." },
  { num: "03", title: "AI Generates", desc: "BloomAI builds a balanced bank in seconds." },
  { num: "04", title: "Download", desc: "Export to PDF or DOCX, ready for the exam hall." },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ backgroundImage: "var(--gradient-hero)" }} />
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Powered Question Bank Generator
          </span>
          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Smarter Exams.{" "}
            <span className="text-gradient">Better Outcomes.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            BloomAI helps faculty turn study material into balanced examination
            question banks — automatically mapped to Bloom's Taxonomy, ready to export.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 bg-gradient-brand px-7 text-base text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Link to="/generate">
                Generate Question Bank <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <a href="#features">Learn More</a>
            </Button>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" /> No credit card required · Free for educators
          </p>

          <div className="shadow-card mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-border bg-card p-2">
            <div className="rounded-xl bg-gradient-brand-cyan p-px">
              <div className="rounded-xl bg-card p-6 text-left sm:p-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { k: "0", v: "Question banks generated" },
                    { k: "0", v: "Bloom's levels covered" },
                    { k: "0 sec", v: "Average generation time" },
                  ].map((s) => (
                    <div key={s.v} className="rounded-xl bg-muted/50 p-4">
                      <p className="text-2xl font-bold text-gradient">{s.k}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Everything you need to build better exams</h2>
          <p className="mt-4 text-muted-foreground">
            A focused toolkit that turns raw study material into pedagogically sound assessments.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card
              key={f.title}
              className="shadow-soft group rounded-2xl border-border p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-gradient-brand group-hover:text-primary-foreground">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">From PDF to exam-ready in four simple steps.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                <div className="shadow-soft rounded-2xl border border-border bg-background p-6">
                  <span className="font-display text-3xl font-extrabold text-gradient">{s.num}</span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground md:block" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button
              asChild
              size="lg"
              className="h-12 bg-gradient-brand px-7 text-base text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Link to="/generate">
                Start generating now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
