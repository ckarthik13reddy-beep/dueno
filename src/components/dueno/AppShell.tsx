import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BarChart3, Bot, FileText, Inbox, LineChart, Plug, Sparkles, Workflow, Globe } from "lucide-react";

const nav = [
  { to: "/dashboard", label: "Overview", icon: BarChart3 },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/channels", label: "Channels", icon: Plug },
  { to: "/agent", label: "Agent Studio", icon: Bot },
  { to: "/automations", label: "Automations", icon: Workflow },
  { to: "/forecast", label: "Forecast", icon: LineChart },
  { to: "/portal", label: "Payer portal", icon: Globe },
] as const;

export function AppShell({ children, flush }: { children: ReactNode; flush?: boolean }) {
  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[220px_1fr]">
      <aside className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-sidebar px-4 py-3 text-sidebar-foreground md:h-screen md:flex-col md:items-stretch md:justify-start md:py-6">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight md:px-2">
          dueno<span className="text-sidebar-primary">.</span>
        </Link>
        <nav className="flex gap-1 md:mt-10 md:flex-col">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground font-medium" }}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="hidden rounded-xl bg-sidebar-accent p-3 text-xs md:mt-auto md:block">
          <p className="flex items-center gap-1.5 font-medium"><Sparkles className="h-3.5 w-3.5 text-sidebar-primary" /> AI agent active</p>
          <p className="mt-1 text-sidebar-foreground/60">6 channels · 24/7 · 14 languages</p>
        </div>
        <div className="hidden items-center gap-2 px-2 pt-4 text-sm md:flex">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-sidebar-primary font-semibold text-sidebar-primary-foreground">K</span>
          <div><p className="font-medium leading-tight">Karthik R.</p><p className="text-xs text-sidebar-foreground/60">Studio plan</p></div>
        </div>
      </aside>
      <main className={flush ? "min-w-0" : "min-w-0 px-4 py-6 md:px-10 md:py-10"}>
        {flush ? children : <div className="mx-auto max-w-6xl">{children}</div>}
      </main>
    </div>
  );
}
