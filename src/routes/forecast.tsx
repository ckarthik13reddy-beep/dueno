import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, TrendingUp, Wallet } from "lucide-react";
import { AppShell } from "@/components/dueno/AppShell";
import { Card, PageHead, meta } from "@/components/dueno/Future";

export const Route = createFileRoute("/forecast")({
  head: () => meta("Cash forecast", "AI predicts exactly when each invoice will be paid and your cash for the next 90 days."),
  component: Forecast,
});

const data = [
  { w: "Nov 2", v: 8.2, lo: 7.1, hi: 9 }, { w: "Nov 9", v: 14.5, lo: 12.8, hi: 16 }, { w: "Nov 16", v: 19.1, lo: 16, hi: 21.5 },
  { w: "Nov 23", v: 26.4, lo: 22, hi: 29 }, { w: "Nov 30", v: 31, lo: 26, hi: 35 }, { w: "Dec 7", v: 38.7, lo: 32, hi: 43 },
  { w: "Dec 14", v: 44.2, lo: 36, hi: 50 }, { w: "Dec 21", v: 49.8, lo: 40, hi: 57 },
];

const risks = [
  { n: "Northwind Logistics", a: "$12,650", p: "61%", r: "Open dispute on hours" },
  { n: "Alvarez & Hijos", a: "$3,150", p: "47%", r: "Missed 2 promises before" },
  { n: "Pixel & Pine", a: "$2,900", p: "58%", r: "Company hiring freeze (news)" },
];

function Forecast() {
  return (
    <AppShell>
      <PageHead title="Cash forecast" sub="Every invoice gets a predicted pay date. Know your runway before it's a problem." />
      <div className="grid gap-5 sm:grid-cols-3">
        {[{ i: Wallet, l: "Expected in 30 days", v: "$31,040" }, { i: TrendingUp, l: "Forecast accuracy", v: "94.2%" }, { i: AlertTriangle, l: "At-risk amount", v: "$18,700" }].map(({ i: I, l, v }) => (
          <Card key={l}><I className="h-5 w-5 text-accent" /><p className="mt-2 text-sm text-muted-foreground">{l}</p><p className="font-display text-3xl font-bold">{v}</p></Card>
        ))}
      </div>
      <Card className="mt-5">
        <p className="font-display font-semibold">Cumulative cash in ($k) · 80% confidence band</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="w" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip />
              <Area dataKey="hi" stroke="none" fill="var(--accent)" fillOpacity={0.25} />
              <Area dataKey="lo" stroke="none" fill="var(--card)" fillOpacity={1} />
              <Area dataKey="v" stroke="var(--primary)" strokeWidth={2.5} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="mt-5">
        <p className="font-display font-semibold">At-risk invoices</p>
        <ul className="mt-3 divide-y divide-border text-sm">
          {risks.map((x) => <li key={x.n} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3"><span><b>{x.n}</b><span className="block text-xs text-muted-foreground">{x.r}</span></span><span>{x.a}</span><span className="text-destructive">{x.p}</span></li>)}
        </ul>
      </Card>
    </AppShell>
  );
}
