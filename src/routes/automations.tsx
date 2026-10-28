import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Mail, MessageCircle, MessageSquare, Phone, Receipt, UserCheck, Zap } from "lucide-react";
import { AppShell } from "@/components/dueno/AppShell";
import { Card, PageHead, meta } from "@/components/dueno/Future";

export const Route = createFileRoute("/automations")({
  head: () => meta("Automations", "Visual workflows that chase invoices across every channel automatically."),
  component: Automations,
});

const flow = [
  { i: Receipt, t: "Invoice created", d: "From QuickBooks, Xero or upload", c: "text-primary" },
  { i: Mail, t: "Day 0 · Email + PDF", d: "62% open rate", c: "text-ch-email" },
  { i: MessageCircle, t: "Day 3 · WhatsApp nudge", d: "If email unopened", c: "text-ch-whatsapp" },
  { i: MessageSquare, t: "Day 7 · SMS + pay link", d: "Branch: promised → wait", c: "text-ch-sms" },
  { i: Phone, t: "Day 14 · AI voice call", d: "Offers payment plan", c: "text-ch-voice" },
  { i: UserCheck, t: "Day 21 · Escalate to you", d: "With full summary", c: "text-foreground" },
];

const recipes = [
  ["Thank-you + review ask after payment", "1,204 runs"],
  ["Retainer auto-invoice on the 1st", "86 runs"],
  ["Sync paid invoices to Xero", "412 runs"],
  ["Slack ping when > $5k is paid", "37 runs"],
  ["Late fee after 30 days (with approval)", "Paused"],
];

function Automations() {
  return (
    <AppShell>
      <PageHead title="Automations" sub="Drag-and-drop collection workflows. The AI picks the best channel and time for each payer." />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="bg-muted/40">
          <p className="mb-4 font-display font-semibold">Default collection flow</p>
          <div className="mx-auto flex max-w-md flex-col items-center">
            {flow.map(({ i: I, t, d, c }, n) => (
              <div key={t} className="flex w-full flex-col items-center">
                <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <I className={`h-5 w-5 ${c}`} /><div><p className="font-medium">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div>
                </div>
                {n < flow.length - 1 && <ArrowDown className="my-1 h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-5">
          <Card>
            <p className="flex items-center gap-2 font-display font-semibold"><Zap className="h-4 w-4 text-accent" /> Active recipes</p>
            <ul className="mt-3 space-y-3 text-sm">{recipes.map(([a, b]) => <li key={a} className="flex justify-between gap-3"><span>{a}</span><span className="shrink-0 text-muted-foreground">{b}</span></li>)}</ul>
          </Card>
          <Card>
            <p className="font-display font-semibold">Integrations</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">{["QuickBooks", "Xero", "Stripe", "Slack", "Zapier", "HubSpot", "Notion", "Google Sheets"].map((x) => <span key={x} className="rounded-full bg-secondary px-3 py-1">{x}</span>)}</div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
