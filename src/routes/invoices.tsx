import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Upload } from "lucide-react";
import { AppShell } from "@/components/dueno/AppShell";
import { Button } from "@/components/ui/button";
import { channelMeta, conversations, money, statusStyle } from "@/lib/mock";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — Dueno" },
      { name: "description", content: "All invoices, their status and the channels Dueno uses to collect them." },
      { property: "og:title", content: "Invoices — Dueno" },
      { property: "og:description", content: "All invoices, their status and the channels Dueno uses to collect them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Invoices,
});

function Invoices() {
  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Invoices</h1>
        <div className="flex gap-2"><Button variant="outline"><Upload className="h-4 w-4" /> Import spreadsheet</Button><Button><Plus className="h-4 w-4" /> New invoice</Button></div>
      </div>
      <div className="surface-panel mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr><th className="px-5 py-3">Invoice</th><th>Payer</th><th>Channels</th><th>Due</th><th>Status</th><th>AI likelihood</th><th className="px-5 text-right">Amount</th></tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-5 py-3 font-medium"><Link to="/inbox" search={{ c: c.id }} className="hover:underline">{c.invoice}</Link></td>
                <td>{c.name}<p className="text-xs text-muted-foreground">{c.company}</p></td>
                <td><div className="flex gap-1">{c.channels.map((ch) => <span key={ch} title={channelMeta[ch].label} className={`h-2.5 w-2.5 rounded-full ${channelMeta[ch].dot}`} />)}</div></td>
                <td className="text-muted-foreground">{c.due}</td>
                <td><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle[c.status]}`}>{c.status}</span></td>
                <td><div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-success" style={{ width: `${c.likelihood}%` }} /></div><span className="text-xs tabular-nums">{c.likelihood}%</span></div></td>
                <td className="px-5 text-right font-display font-semibold tabular-nums">{money(c.amount, c.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
