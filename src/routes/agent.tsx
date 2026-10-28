import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, Languages, Mic, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/dueno/AppShell";
import { Card, PageHead, meta } from "@/components/dueno/Future";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/agent")({
  head: () => meta("Agent Studio", "Shape your AI collector's voice, tone, rules and guardrails."),
  component: Agent,
});

const tones = ["Warm", "Professional", "Firm", "Playful"];
const rules = [
  { t: "Offer payment plans up to 3 installments", on: true },
  { t: "Auto-apply 2% early-pay discount", on: true },
  { t: "Never discuss other clients or invoices", on: true, locked: true },
  { t: "Hand off disputes to me instantly", on: true, locked: true },
  { t: "Pause reminders on public holidays (per payer locale)", on: true },
  { t: "Allow AI to waive late fees under $50", on: false },
];

function Agent() {
  const [tone, setTone] = useState("Warm");
  const [firm, setFirm] = useState(40);
  return (
    <AppShell>
      <PageHead title="Agent Studio" sub="Train your AI coworker on your voice. It learns from every reply you send and gets better at getting you paid." />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <p className="font-display font-semibold">Personality</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tones.map((x) => <button key={x} onClick={() => setTone(x)} className={`rounded-full border px-4 py-1.5 text-sm ${tone === x ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>{x}</button>)}
            </div>
            <label className="mt-5 block text-sm text-muted-foreground">Persistence · {firm}%</label>
            <input type="range" value={firm} onChange={(e) => setFirm(+e.target.value)} className="mt-2 w-full accent-primary" />
          </Card>
          <Card>
            <p className="font-display font-semibold">Rules & guardrails</p>
            <ul className="mt-3 divide-y divide-border">
              {rules.map((r) => (
                <li key={r.t} className="flex items-center justify-between py-3 text-sm">
                  <span className="flex items-center gap-2">{r.locked && <ShieldCheck className="h-4 w-4 text-success" />}{r.t}</span>
                  <Switch defaultChecked={r.on} disabled={r.locked} />
                </li>
              ))}
            </ul>
          </Card>
          <div className="grid gap-5 sm:grid-cols-3">
            {[{ i: Mic, t: "Voice clone", d: "Calls sound like you, with consent" }, { i: Languages, t: "38 languages", d: "Auto-detect & reply natively" }, { i: Brain, t: "Memory", d: "Remembers each payer's habits" }].map(({ i: I, t, d }) => (
              <Card key={t}><I className="h-5 w-5 text-accent" /><p className="mt-2 font-semibold">{t}</p><p className="text-xs text-muted-foreground">{d}</p></Card>
            ))}
          </div>
        </div>
        <Card className="h-fit bg-sidebar text-sidebar-foreground">
          <p className="text-xs text-sidebar-foreground/60">Live preview · {tone}</p>
          <div className="mt-3 space-y-3 text-sm">
            <p className="rounded-2xl bg-sidebar-accent p-3">Hey, can I pay next month instead?</p>
            <p className="ml-6 rounded-2xl bg-sidebar-primary p-3 text-sidebar-primary-foreground">
              {tone === "Firm" ? "I understand. The invoice is already 12 days late, so I can offer two payments: half today, half on the 15th." : tone === "Playful" ? "Totally get it 🙌 How about we split it — half now, half on the 15th? Easy peasy." : tone === "Professional" ? "Thank you for letting us know. We can arrange two installments: 50% today and 50% on the 15th." : "Of course, no stress! Would splitting it into two payments — today and the 15th — make it easier? 😊"}
            </p>
          </div>
          <p className="mt-4 text-xs text-sidebar-foreground/60">Predicted pay rate with this setup: <b className="text-sidebar-foreground">{Math.min(97, 78 + Math.round(firm / 6))}%</b></p>
        </Card>
      </div>
    </AppShell>
  );
}
