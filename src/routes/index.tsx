import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, Mail, MessageCircle, MessageSquare, Phone, Send, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dueno — The AI coworker that gets your invoices paid" },
      { name: "description", content: "Dueno chases unpaid invoices across WhatsApp, email, SMS, Telegram, Instagram and voice — automatically." },
      { property: "og:title", content: "Dueno — The AI coworker that gets your invoices paid" },
      { property: "og:description", content: "One AI agent. Six channels. Paid 3× faster." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const chans = [
  { icon: MessageCircle, label: "WhatsApp", c: "text-ch-whatsapp" },
  { icon: Mail, label: "Email", c: "text-ch-email" },
  { icon: MessageSquare, label: "SMS", c: "text-ch-sms" },
  { icon: Send, label: "Telegram", c: "text-ch-telegram" },
  { icon: Instagram, label: "Instagram", c: "text-ch-instagram" },
  { icon: Phone, label: "AI Voice", c: "text-ch-voice" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="font-display text-2xl font-bold">dueno<span className="text-accent">.</span></span>
        <Button asChild><Link to="/dashboard">Open live demo <ArrowRight className="h-4 w-4" /></Link></Button>
      </header>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 md:pt-20">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium"><Bot className="h-3.5 w-3.5 text-accent" /> Your AI accounts-receivable coworker</p>
        <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold leading-[1.02] md:text-7xl">
          Get paid on <span className="text-gradient-ink">every channel</span> your clients actually read.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">Dueno follows up, answers questions, negotiates within your rules and sends receipts — over WhatsApp, email, SMS, Telegram, Instagram and voice.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to="/inbox" search={{}}>See the multichannel inbox</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/dashboard">View dashboard</Link></Button>
        </div>
        <div className="mt-14 grid grid-cols-3 gap-3 md:grid-cols-6">
          {chans.map(({ icon: I, label, c }) => (
            <div key={label} className="surface-panel flex flex-col items-center gap-2 p-4 text-sm font-medium">
              <I className={`h-6 w-6 ${c}`} />{label}
            </div>
          ))}
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[["3.2×", "faster payment vs. manual chasing"], ["94%", "of payer replies handled by AI"], ["41h", "saved per month, per business"]].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-sidebar p-6 text-sidebar-foreground">
              <p className="font-display text-4xl font-bold text-sidebar-primary">{v}</p><p className="mt-1 text-sm text-sidebar-foreground/70">{l}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
