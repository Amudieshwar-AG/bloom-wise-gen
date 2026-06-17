import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — BloomAI" },
      { name: "description", content: "Manage your BloomAI profile and preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <AppShell title="Settings" subtitle="Manage your profile and generation preferences.">
      <div className="grid max-w-3xl gap-6">
        <Card className="shadow-card rounded-2xl border-border p-6">
          <h3 className="font-semibold">Profile</h3>
          <p className="text-sm text-muted-foreground">Update your account information.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" defaultValue="Dr. Anita Rao" className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="a.rao@university.edu" className="rounded-xl" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="dept">Department</Label>
              <Input id="dept" defaultValue="Computer Science & Engineering" className="rounded-xl" />
            </div>
          </div>
        </Card>

        <Card className="shadow-card rounded-2xl border-border p-6">
          <h3 className="font-semibold">Preferences</h3>
          <div className="mt-5 space-y-4">
            <PrefRow
              title="Dark mode"
              desc="Switch between light and dark themes"
              checked={theme === "dark"}
              onToggle={toggleTheme}
            />
            <PrefRow title="Default answers ON" desc="Include model answers by default" checked />
            <PrefRow title="Email notifications" desc="Get notified when generation completes" checked />
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button
            className="bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90"
            onClick={() => toast.success("Settings saved")}
          >
            Save changes
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function PrefRow({
  title,
  desc,
  checked,
  onToggle,
}: {
  title: string;
  desc: string;
  checked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch defaultChecked={checked} onCheckedChange={onToggle} />
    </div>
  );
}