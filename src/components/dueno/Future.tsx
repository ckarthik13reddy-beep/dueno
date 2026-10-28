import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export function PageHead({ title, sub, badge = "Coming 2027" }: { title: string; sub: string; badge?: string }) {
  return (
    <div className="mb-8">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/25 px-3 py-1 text-xs font-medium text-accent-foreground"><Sparkles className="h-3 w-3" />{badge}</span>
      <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{sub}</p>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>{children}</div>;
}

export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Dueno` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Dueno` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
