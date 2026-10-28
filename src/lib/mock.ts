export type Channel = "whatsapp" | "email" | "sms" | "telegram" | "instagram" | "voice";
export type Status = "paid" | "overdue" | "due" | "promised" | "disputed";

export const channelMeta: Record<Channel, { label: string; dot: string; text: string; soft: string }> = {
  whatsapp: { label: "WhatsApp", dot: "bg-ch-whatsapp", text: "text-ch-whatsapp", soft: "bg-ch-whatsapp/12" },
  email: { label: "Email", dot: "bg-ch-email", text: "text-ch-email", soft: "bg-ch-email/12" },
  sms: { label: "SMS", dot: "bg-ch-sms", text: "text-ch-sms", soft: "bg-ch-sms/12" },
  telegram: { label: "Telegram", dot: "bg-ch-telegram", text: "text-ch-telegram", soft: "bg-ch-telegram/12" },
  instagram: { label: "Instagram", dot: "bg-ch-instagram", text: "text-ch-instagram", soft: "bg-ch-instagram/12" },
  voice: { label: "AI Voice", dot: "bg-ch-voice", text: "text-ch-voice", soft: "bg-ch-voice/15" },
};

export type Msg = {
  id: string;
  from: "payer" | "ai" | "owner" | "system";
  channel: Channel;
  text: string;
  time: string;
  attachment?: string;
  aiNote?: string;
  read?: boolean;
};

export type Conversation = {
  id: string;
  name: string;
  company: string;
  initials: string;
  invoice: string;
  amount: number;
  currency: string;
  due: string;
  status: Status;
  sentiment: "positive" | "neutral" | "frustrated";
  likelihood: number;
  channels: Channel[];
  unread: number;
  lastAt: string;
  messages: Msg[];
};

export const conversations: Conversation[] = [
  {
    id: "c1", name: "Priya Raman", company: "Lumen Studio", initials: "PR", invoice: "INV-2041", amount: 4800, currency: "USD",
    due: "Oct 18", status: "promised", sentiment: "positive", likelihood: 92, channels: ["email", "whatsapp", "voice"], unread: 2, lastAt: "2m",
    messages: [
      { id: "1", from: "ai", channel: "email", time: "Oct 19, 9:02", text: "Hi Priya, a friendly note that invoice INV-2041 for the brand refresh ($4,800) was due yesterday. Pay securely here: pay.dueno.app/2041", attachment: "INV-2041.pdf", read: true },
      { id: "2", from: "system", channel: "email", time: "Oct 19, 9:40", text: "Email opened 3 times · PDF viewed" },
      { id: "3", from: "ai", channel: "whatsapp", time: "Oct 22, 10:15", text: "Hi Priya 👋 following up on INV-2041 ($4,800). Would a split into two payments help?", read: true, aiNote: "Switched to WhatsApp — Priya replies 4× faster here" },
      { id: "4", from: "payer", channel: "whatsapp", time: "Oct 22, 10:31", text: "Hey! Sorry, finance is slow this month. Can I do half now and half on the 5th?" },
      { id: "5", from: "ai", channel: "whatsapp", time: "Oct 22, 10:31", text: "Absolutely. I've sent a link for $2,400 today and scheduled the second half for Nov 5. 🙌", aiNote: "Payment plan within your approved rules (max 2 installments)" },
      { id: "6", from: "system", channel: "whatsapp", time: "Oct 22, 11:02", text: "💸 $2,400 received via Stripe · verified" },
      { id: "7", from: "ai", channel: "voice", time: "Oct 26, 9:00", text: "AI voice check-in · 48s call · Priya confirmed Nov 5 for the balance.", aiNote: "Call transcript summarised" },
      { id: "8", from: "payer", channel: "whatsapp", time: "Oct 26, 10:29", text: "Thanks for the reminder call, all set for the 5th 😊" },
    ],
  },
  {
    id: "c2", name: "Marcus Bell", company: "Northwind Logistics", initials: "MB", invoice: "INV-2038", amount: 12650, currency: "USD",
    due: "Oct 02", status: "disputed", sentiment: "frustrated", likelihood: 61, channels: ["email", "sms"], unread: 1, lastAt: "14m",
    messages: [
      { id: "1", from: "ai", channel: "email", time: "Oct 3, 8:00", text: "Hello Marcus, invoice INV-2038 for Q3 route optimisation ($12,650) is now past due.", attachment: "INV-2038.pdf", read: true },
      { id: "2", from: "ai", channel: "sms", time: "Oct 9, 12:00", text: "Dueno for Karthik: INV-2038 ($12,650) is 7 days overdue. Pay: pay.dueno.app/2038", read: true },
      { id: "3", from: "payer", channel: "email", time: "Oct 26, 10:17", text: "We were billed for 40 hours but the SOW says 32. I can't approve this as is.", aiNote: "Dispute detected · escalated to you · reminders paused" },
      { id: "4", from: "ai", channel: "email", time: "Oct 26, 10:17", text: "Thanks Marcus, that's helpful. I've paused reminders and passed this to Karthik, who will review the hours with you today.", aiNote: "AI won't negotiate amounts — handed off" },
    ],
  },
  {
    id: "c3", name: "Aiko Tanaka", company: "Sora Coffee Co.", initials: "AT", invoice: "INV-2045", amount: 1320, currency: "USD",
    due: "Oct 30", status: "due", sentiment: "neutral", likelihood: 84, channels: ["instagram", "telegram"], unread: 0, lastAt: "1h",
    messages: [
      { id: "1", from: "ai", channel: "instagram", time: "Oct 25, 15:00", text: "Hi Aiko! Your menu photography invoice (INV-2045, $1,320) is due Oct 30. Here's the link whenever ready ☕", read: true },
      { id: "2", from: "payer", channel: "instagram", time: "Oct 25, 15:44", text: "Loved the shots!! Can you send it on Telegram? That's where my accountant is" },
      { id: "3", from: "ai", channel: "telegram", time: "Oct 25, 15:45", text: "Done — sent INV-2045 with the pay link to this chat. 📎", attachment: "INV-2045.pdf", aiNote: "Channel handoff requested by payer" },
      { id: "4", from: "payer", channel: "telegram", time: "Oct 26, 9:12", text: "Accountant here, scheduled for Wednesday." },
    ],
  },
  {
    id: "c4", name: "Diego Alvarez", company: "Alvarez & Hijos", initials: "DA", invoice: "INV-2029", amount: 3150, currency: "USD",
    due: "Sep 21", status: "overdue", sentiment: "neutral", likelihood: 47, channels: ["whatsapp", "sms", "voice"], unread: 0, lastAt: "3h",
    messages: [
      { id: "1", from: "ai", channel: "whatsapp", time: "Sep 22", text: "Hola Diego, la factura INV-2029 ($3,150) venció ayer. ¿Te ayudo con el pago?", aiNote: "Auto-detected Spanish", read: true },
      { id: "2", from: "ai", channel: "sms", time: "Oct 1", text: "Reminder: INV-2029 ($3,150) is 10 days overdue. pay.dueno.app/2029", read: true },
      { id: "3", from: "ai", channel: "voice", time: "Oct 20", text: "AI voice call · no answer · voicemail left (22s)" },
      { id: "4", from: "payer", channel: "whatsapp", time: "Oct 26, 7:40", text: "Perdón, estuve de viaje. Pago el viernes." },
      { id: "5", from: "ai", channel: "whatsapp", time: "Oct 26, 7:40", text: "¡Gracias Diego! Lo anoto para el viernes y te envío el recibo al confirmarse.", aiNote: "Promise-to-pay logged · Fri Oct 30" },
    ],
  },
  {
    id: "c5", name: "Hannah Weiss", company: "Bergmann GmbH", initials: "HW", invoice: "INV-2033", amount: 7900, currency: "EUR",
    due: "Oct 10", status: "paid", sentiment: "positive", likelihood: 100, channels: ["email"], unread: 0, lastAt: "1d",
    messages: [
      { id: "1", from: "ai", channel: "email", time: "Oct 11", text: "Guten Tag Hannah, kurze Erinnerung zu Rechnung INV-2033 (€7.900).", read: true },
      { id: "2", from: "payer", channel: "email", time: "Oct 24", text: "Bezahlt heute per SEPA. Danke!" },
      { id: "3", from: "system", channel: "email", time: "Oct 25", text: "💸 €7,900 received · verified by bank match" },
      { id: "4", from: "ai", channel: "email", time: "Oct 25", text: "Vielen Dank, Hannah! Ihre Quittung ist angehängt.", attachment: "Receipt-2033.pdf", read: true },
    ],
  },
  {
    id: "c6", name: "Sam Okafor", company: "Brightpath Edu", initials: "SO", invoice: "INV-2047", amount: 2200, currency: "USD",
    due: "Nov 04", status: "due", sentiment: "positive", likelihood: 88, channels: ["sms", "email"], unread: 0, lastAt: "2d",
    messages: [
      { id: "1", from: "ai", channel: "email", time: "Oct 24", text: "Hi Sam, here's invoice INV-2047 for the course videos ($2,200), due Nov 4.", attachment: "INV-2047.pdf", read: true },
      { id: "2", from: "payer", channel: "sms", time: "Oct 24", text: "Got it, thanks! will pay early next week" },
    ],
  },
];

export const kpis = [
  { label: "Collected this month", value: "$48,320", delta: "+38%" },
  { label: "Avg. days to pay", value: "6.4", delta: "−11 days" },
  { label: "AI-handled replies", value: "94%", delta: "312 msgs" },
  { label: "Hours saved", value: "41h", delta: "≈ $3,280" },
];

export const cashflow = [
  { m: "May", before: 18, dueno: 18 },
  { m: "Jun", before: 21, dueno: 24 },
  { m: "Jul", before: 19, dueno: 29 },
  { m: "Aug", before: 22, dueno: 34 },
  { m: "Sep", before: 20, dueno: 41 },
  { m: "Oct", before: 23, dueno: 48 },
];

export const channelMix: { channel: Channel; value: number }[] = [
  { channel: "whatsapp", value: 41 },
  { channel: "email", value: 27 },
  { channel: "sms", value: 12 },
  { channel: "voice", value: 9 },
  { channel: "telegram", value: 6 },
  { channel: "instagram", value: 5 },
];

export const activity = [
  { t: "2m", text: "Priya Raman replied on WhatsApp — AI confirmed Nov 5 plan" },
  { t: "14m", text: "Dispute flagged on INV-2038 · reminders paused" },
  { t: "1h", text: "Aiko asked to switch to Telegram — handed off" },
  { t: "3h", text: "Diego promised payment Fri (Spanish, auto-translated)" },
  { t: "1d", text: "€7,900 from Bergmann GmbH verified · receipt sent" },
];

export const money = (n: number, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

export const statusStyle: Record<Status, string> = {
  paid: "bg-success/15 text-success",
  overdue: "bg-destructive/12 text-destructive",
  due: "bg-secondary text-secondary-foreground",
  promised: "bg-accent/25 text-accent-foreground",
  disputed: "bg-warning/25 text-warning-foreground",
};
