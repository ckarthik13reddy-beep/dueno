import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, CreditCard, FileText, Lock } from "lucide-react";
import { AppShell } from "@/components/dueno/AppShell";
import { Card, PageHead, meta } from "@/components/dueno/Future";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal")({
  head: () => meta("Payer portal", "A branded, one-tap checkout your clients see when they pay you."),
  component: Portal,
});

const methods = ["Card", "Apple Pay", "UPI", "SEPA", "Crypto (USDC)", "Pay in 3"];

function Portal() {
  const [m, setM] = useState("Card");
  const [paid, setPaid] = useState(false);
  return (
    <AppShell>
      <PageHead title="Payer portal" sub="What your client sees: a branded page, with their invoice, chat and one-tap payment. Every payer only ever sees their own invoices." />
      <div className="mx-auto max-w-md">
        <Card className="p-0 overflow-hidden">
          <div className="bg-sidebar p-6 text-sidebar-foreground">
            <p className="text-xs text-sidebar-foreground/60">Karthik Studio · INV-2041</p>
            <p className="mt-1 font-display text-4xl font-bold">$2,400</p>
            <p className="text-sm text-sidebar-foreground/70">Installment 2 of 2 · due Nov 5</p>
          </div>
          <div className="space-y-4 p-6">
            {paid ? (
              <div className="py-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-success" /><p className="mt-3 font-display text-xl font-bold">Paid — thank you!</p><p className="text-sm text-muted-foreground">Receipt sent to WhatsApp & email.</p></div>
            ) : (<>
              <p className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm"><FileText className="h-4 w-4" /> Brand refresh — final delivery</p>
              <div className="grid grid-cols-3 gap-2">
                {methods.map((x) => <button key={x} onClick={() => setM(x)} className={`rounded-lg border px-2 py-2 text-xs ${m === x ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>{x}</button>)}
              </div>
              <Button className="w-full" size="lg" onClick={() => setPaid(true)}><CreditCard className="h-4 w-4" /> Pay with {m}</Button>
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Bank-grade encryption · demo only</p>
            </>)}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
