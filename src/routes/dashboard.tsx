import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, Zap } from "lucide-react";
import { AppShell } from "@/components/dueno/AppShell";
import { activity, cashflow, channelMeta, channelMix, conversations, kpis, money, statusStyle } from "@/lib/mock";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — Dueno" },
      { name: "description", content: "Collections, cash flow and AI agent performance at a glance." },
      { property: "og:title", content: "Overview — Dueno" },
      { property: "og:description", content: "Collections, cash flow and AI agent performance at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const open = conversations.filter((c) => c.status !== "paid");
  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Good evening, Karthik</p>
          <h1 className="font-display text-3xl font-bold">$32,120 outstanding · <span className="text-success">$48,320 collected</span></h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success"><span className="h-2 w-2 animate-pulse rounded-full bg-success" /> AI agent live on 6 channels</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="surface-panel p-5">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums">{k.value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success"><TrendingUp className="h-3 w-3" />{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="surface-panel p-5">
          <h2 className="font-display font-semibold">Collected per month ($k)</h2>
          <p className="text-xs text-muted-foreground">Before Dueno vs. with Dueno</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip />
                <Area dataKey="before" stroke="var(--color-chart-5)" fill="var(--color-chart-5)" fillOpacity={0.15} />
                <Area dataKey="dueno" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.35} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="surface-panel p-5">
          <h2 className="font-display font-semibold">Where payers reply</h2>
          <div className="mt-4 space-y-3">
            {channelMix.map(({ channel, value }) => (
              <div key={channel}>
                <div className="flex justify-between text-sm"><span>{channelMeta[channel].label}</span><span className="tabular-nums text-muted-foreground">{value}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className={`h-2 rounded-full ${channelMeta[channel].dot}`} style={{ width: `${value * 2}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="surface-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="font-display font-semibold">Needs attention</h2>
            <Link to="/inbox" search={{}} className="text-sm text-muted-foreground hover:text-foreground">Open inbox →</Link>
          </div>
          {open.map((c) => (
            <Link key={c.id} to="/inbox" search={{ c: c.id }} className="flex items-center gap-4 border-b border-border px-5 py-3 last:border-0 hover:bg-muted/50">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm font-semibold">{c.initials}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name} <span className="font-normal text-muted-foreground">· {c.company}</span></p>
                <div className="mt-0.5 flex gap-1">{c.channels.map((ch) => <span key={ch} className={`h-1.5 w-4 rounded-full ${channelMeta[ch].dot}`} />)}</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle[c.status]}`}>{c.status}</span>
              <span className="w-24 text-right font-display font-semibold tabular-nums">{money(c.amount, c.currency)}</span>
            </Link>
          ))}
        </section>
        <section className="rounded-2xl bg-sidebar p-5 text-sidebar-foreground shadow-lift">
          <h2 className="flex items-center gap-2 font-display font-semibold"><Zap className="h-4 w-4 text-sidebar-primary" /> Live agent activity</h2>
          <ul className="mt-4 space-y-4 text-sm">
            {activity.map((a) => (
              <li key={a.text} className="flex gap-3"><span className="w-8 shrink-0 text-xs text-sidebar-foreground/50">{a.t}</span><span className="text-sidebar-foreground/85">{a.text}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
