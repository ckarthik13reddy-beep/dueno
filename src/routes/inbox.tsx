import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Check, CheckCheck, FileText, Instagram, Mail, MessageCircle, MessageSquare, Phone, Search, Send, Sparkles, User, Wand2 } from "lucide-react";
import { AppShell } from "@/components/dueno/AppShell";
import { Button } from "@/components/ui/button";
import { channelMeta, conversations as seed, money, statusStyle, type Channel, type Conversation } from "@/lib/mock";

export const Route = createFileRoute("/inbox")({
  validateSearch: (s: Record<string, unknown>) => ({ c: typeof s["c"] === "string" ? (s["c"] as string) : undefined } as { c?: string }),
  head: () => ({
    meta: [
      { title: "Unified inbox — Dueno" },
      { name: "description", content: "Every payer conversation across WhatsApp, email, SMS, Telegram, Instagram and voice in one thread." },
      { property: "og:title", content: "Unified inbox — Dueno" },
      { property: "og:description", content: "One thread per payer, across six channels, run by an AI agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InboxPage,
});

const icons: Record<Channel, typeof Mail> = { whatsapp: MessageCircle, email: Mail, sms: MessageSquare, telegram: Send, instagram: Instagram, voice: Phone };
const filters: ("all" | Channel)[] = ["all", "whatsapp", "email", "sms", "telegram", "instagram", "voice"];

function InboxPage() {
  const { c } = Route.useSearch();
  const [convos, setConvos] = useState<Conversation[]>(seed);
  const [activeId, setActiveId] = useState(c ?? seed[0]!.id);
  const [filter, setFilter] = useState<"all" | Channel>("all");
  const [draft, setDraft] = useState("");
  const [sendVia, setSendVia] = useState<Channel>("whatsapp");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const active = (convos.find((x) => x.id === activeId) ?? convos[0])!;
  const list = convos.filter((x) => filter === "all" || x.channels.includes(filter));

  useEffect(() => { setSendVia(active.channels[0] ?? "email"); }, [active.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active.messages.length, typing]);

  const push = (id: string, m: Conversation["messages"][number]) =>
    setConvos((cs) => cs.map((x) => (x.id === id ? { ...x, unread: 0, lastAt: "now", messages: [...x.messages, m] } : x)));

  const send = (text: string, from: "owner" | "ai" = "owner") => {
    if (!text.trim()) return;
    const id = active.id;
    push(id, { id: crypto.randomUUID(), from, channel: sendVia, text, time: "Just now", read: true });
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      push(id, { id: crypto.randomUUID(), from: "payer", channel: sendVia, text: "Thanks for the heads up, I'll take care of it 👍", time: "Just now", aiNote: "Positive intent · likelihood +6%" });
    }, 1800);
  };

  const suggestions = [
    `Hi ${active.name.split(" ")[0]}, just checking in on ${active.invoice} (${money(active.amount, active.currency)}). Here's your secure link: pay.dueno.app/${active.invoice.slice(4)}`,
    "Happy to split this into two payments if that helps — shall I set it up?",
    "Thanks! I'll send your receipt as soon as the payment is confirmed.",
  ];

  return (
    <AppShell flush>
      <div className="grid h-[calc(100vh-56px)] md:h-screen lg:grid-cols-[320px_1fr_300px] md:grid-cols-[300px_1fr]">
        {/* list */}
        <aside className="hidden flex-col border-r border-border bg-card md:flex">
          <div className="border-b border-border p-4">
            <h1 className="font-display text-xl font-bold">Inbox</h1>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"><Search className="h-4 w-4" /> Search payers, invoices…</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs capitalize transition ${filter === f ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>
                  {f !== "all" && <span className={`h-2 w-2 rounded-full ${channelMeta[f].dot}`} />}
                  {f === "all" ? "All" : channelMeta[f].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {list.map((x) => {
              const last = x.messages[x.messages.length - 1]!;
              return (
                <button key={x.id} onClick={() => setActiveId(x.id)}
                  className={`flex w-full gap-3 border-b border-border px-4 py-3 text-left transition hover:bg-muted/60 ${x.id === active.id ? "bg-muted" : ""}`}>
                  <div className="relative">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-sm font-semibold">{x.initials}</span>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${channelMeta[last.channel].dot}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2"><p className="truncate font-medium">{x.name}</p><span className="text-xs text-muted-foreground">{x.lastAt}</span></div>
                    <p className="truncate text-xs text-muted-foreground">{last.text}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyle[x.status]}`}>{x.status}</span>
                      {x.unread > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{x.unread}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* thread */}
        <section className="flex min-h-0 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-semibold">{active.initials}</span>
              <div>
                <p className="font-display font-semibold">{active.name}</p>
                <div className="flex gap-2">{active.channels.map((ch) => { const I = icons[ch]; return <I key={ch} className={`h-3.5 w-3.5 ${channelMeta[ch].text}`} />; })}<span className="text-xs text-muted-foreground">one thread · {active.channels.length} channels</span></div>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => send(suggestions[0]!, "ai")}><Bot className="h-4 w-4" /> Let AI nudge</Button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-muted/40 p-5">
            {active.messages.map((m) => {
              if (m.from === "system") return <p key={m.id} className="mx-auto w-fit rounded-full bg-card px-4 py-1.5 text-xs text-muted-foreground shadow-sm">{m.text}</p>;
              const out = m.from !== "payer";
              const I = icons[m.channel];
              const meta = channelMeta[m.channel];
              return (
                <div key={m.id} className={`flex max-w-[78%] flex-col gap-1 ${out ? "ml-auto items-end" : ""}`}>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    {m.from === "ai" ? <Bot className="h-3 w-3" /> : m.from === "owner" ? <User className="h-3 w-3" /> : null}
                    {m.from === "ai" ? "Dueno AI" : m.from === "owner" ? "You" : active.name}
                    <span className={`ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${meta.soft} ${meta.text}`}><I className="h-3 w-3" />{meta.label}</span>
                  </span>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${out ? "bg-primary text-primary-foreground" : "bg-card shadow-sm"} ${!out ? `border-l-4 ${meta.dot.replace("bg-", "border-")}` : ""}`}>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.attachment && <p className={`mt-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${out ? "bg-primary-foreground/15" : "bg-muted"}`}><FileText className="h-3.5 w-3.5" />{m.attachment}</p>}
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">{m.time}{out && (m.read ? <CheckCheck className="h-3 w-3 text-ch-telegram" /> : <Check className="h-3 w-3" />)}</span>
                  {m.aiNote && <span className="flex items-center gap-1 rounded-md bg-accent/20 px-2 py-0.5 text-[11px] text-accent-foreground"><Sparkles className="h-3 w-3" />{m.aiNote}</span>}
                </div>
              );
            })}
            {typing && <div className="w-fit rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm"><span className="animate-pulse">{active.name.split(" ")[0]} is typing…</span></div>}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border bg-card p-4">
            <div className="mb-2 flex gap-2 overflow-x-auto">
              {suggestions.map((s) => (
                <button key={s} onClick={() => setDraft(s)} className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"><Wand2 className="h-3 w-3 text-accent" />{s.slice(0, 38)}…</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(draft); }} className="flex items-end gap-2">
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                {active.channels.map((ch) => { const I = icons[ch]; return (
                  <button type="button" key={ch} title={channelMeta[ch].label} onClick={() => setSendVia(ch)}
                    className={`grid h-8 w-8 place-items-center rounded-md transition ${sendVia === ch ? `bg-card shadow-sm ${channelMeta[ch].text}` : "text-muted-foreground"}`}><I className="h-4 w-4" /></button>
                ); })}
              </div>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message via ${channelMeta[sendVia].label}…`}
                className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <Button type="submit" disabled={!draft.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </section>

        {/* context */}
        <aside className="hidden flex-col gap-4 overflow-y-auto border-l border-border bg-card p-5 lg:flex">
          <div className="rounded-xl bg-sidebar p-4 text-sidebar-foreground">
            <p className="text-xs text-sidebar-foreground/60">{active.invoice} · due {active.due}</p>
            <p className="mt-1 font-display text-3xl font-bold">{money(active.amount, active.currency)}</p>
            <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle[active.status]}`}>{active.status}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">AI payment likelihood</p>
            <div className="mt-2 flex items-center gap-3"><div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-success" style={{ width: `${active.likelihood}%` }} /></div><span className="font-display font-bold">{active.likelihood}%</span></div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Sentiment</p>
            <p className="mt-1 text-sm capitalize">{active.sentiment === "positive" ? "😊" : active.sentiment === "frustrated" ? "😤" : "😐"} {active.sentiment}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Agent playbook</p>
            <ol className="mt-2 space-y-2 border-l-2 border-border pl-4 text-sm">
              <li>Day 0 · Email with PDF</li><li>Day 3 · WhatsApp nudge</li><li>Day 7 · SMS + pay link</li><li className="text-muted-foreground">Day 14 · AI voice call</li><li className="text-muted-foreground">Day 21 · Escalate to you</li>
            </ol>
          </div>
          <div className="rounded-xl border border-border p-4 text-sm">
            <p className="flex items-center gap-1.5 font-medium"><Sparkles className="h-4 w-4 text-accent" /> AI summary</p>
            <p className="mt-1 text-muted-foreground">{active.name.split(" ")[0]} prefers {channelMeta[active.channels[active.channels.length - 1] ?? "email"].label} and usually replies within 20 minutes. Next best action: send a gentle reminder 1 day before the promised date.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
