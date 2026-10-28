import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, Instagram, Mail, MessageCircle, MessageSquare, Phone, Send } from "lucide-react";
import { AppShell } from "@/components/dueno/AppShell";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/channels")({
  head: () => ({
    meta: [
      { title: "Channels — Dueno" },
      { name: "description", content: "Connect WhatsApp, email, SMS, Telegram, Instagram, voice and payments in one place." },
      { property: "og:title", content: "Channels — Dueno" },
      { property: "og:description", content: "Every channel your payers use, connected in one click." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Channels,
});

const items = [
  { icon: MessageCircle, name: "WhatsApp Business", detail: "+1 415 555 0142 · verified", c: "text-ch-whatsapp", stat: "41% of replies" },
  { icon: Mail, name: "Email", detail: "billing@karthik.studio · DKIM ✓", c: "text-ch-email", stat: "62% open rate" },
  { icon: MessageSquare, name: "SMS", detail: "Sender ID: DUENO", c: "text-ch-sms", stat: "98% delivered" },
  { icon: Send, name: "Telegram", detail: "@dueno_karthik_bot", c: "text-ch-telegram", stat: "6% of replies" },
  { icon: Instagram, name: "Instagram DMs", detail: "@karthik.studio", c: "text-ch-instagram", stat: "5% of replies" },
  { icon: Phone, name: "AI Voice calls", detail: "Natural voice · 14 languages", c: "text-ch-voice", stat: "31 calls this month" },
  { icon: CreditCard, name: "Stripe payments", detail: "Cards, Apple Pay, SEPA, UPI", c: "text-primary", stat: "$48.3k processed" },
];

function Channels() {
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(items.map((i) => [i.name, true])));
  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold">Channels</h1>
      <p className="mt-1 text-muted-foreground">Dueno picks the best channel for each payer automatically.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map(({ icon: I, name, detail, c, stat }) => (
          <div key={name} className="surface-panel flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-muted"><I className={`h-6 w-6 ${c}`} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{detail}</p>
              <p className="mt-1 text-xs font-medium text-success">{on[name] ? `Connected · ${stat}` : "Paused"}</p>
            </div>
            <Switch checked={on[name] ?? false} onCheckedChange={(v) => setOn((s) => ({ ...s, [name]: v }))} />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
