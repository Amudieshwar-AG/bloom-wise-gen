import { Link } from "@tanstack/react-router";
import { Github, Mail, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer id="footer" className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              AI-powered question bank generator built for faculty. Balanced exams,
              grounded in Bloom's Taxonomy.
            </p>
          </div>

          <FooterCol
            title="About"
            items={[
              { label: "Our Mission", href: "#" },
              { label: "How it Works", href: "#how-it-works" },
              { label: "Features", href: "#features" },
            ]}
          />
          <FooterCol
            title="Contact"
            items={[
              { label: "support@bloomai.app", href: "mailto:support@bloomai.app", icon: <Mail className="h-3.5 w-3.5" /> },
              { label: "Help Center", href: "#" },
            ]}
          />
          <FooterCol
            title="Resources"
            items={[
              { label: "GitHub", href: "https://github.com", icon: <Github className="h-3.5 w-3.5" /> },
              { label: "Documentation", href: "#" },
              { label: "Changelog", href: "#" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            © {new Date().getFullYear()} BloomAI. All rights reserved.
          </p>
          <p className="rounded-full bg-muted px-3 py-1 font-medium">Version 1.0.0</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string; icon?: React.ReactNode }[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold text-foreground">{title}</h4>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.icon}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}