"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Heart, Copy, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

type Method = "RAZORPAY" | "UPI_MANUAL";

type RazorpayResp = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};
type RazorpayOptions = {
  key?: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (resp: RazorpayResp) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type ManualState = {
  donationId: string;
  receiptNo: string;
  upiId: string;
  qrImageUrl: string;
  amountPaise: number;
  upiLink: string;
};

export function DonationForm({
  source,
  razorpayAvailable,
  upiAvailable,
  suggestedAmounts,
  minAmountPaise,
}: {
  source?: string;
  razorpayAvailable: boolean;
  upiAvailable: boolean;
  suggestedAmounts: number[];
  minAmountPaise: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(
    suggestedAmounts.length ? String(Math.round(suggestedAmounts[0] / 100)) : "",
  );
  const [method, setMethod] = useState<Method>(razorpayAvailable ? "RAZORPAY" : "UPI_MANUAL");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [supporterConsent, setSupporterConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState<ManualState | null>(null);
  const [ref, setRef] = useState("");

  async function openRazorpay(donationId: string, rp: NonNullable<RazorpayCreate["razorpay"]>) {
    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) {
      toast.error("Could not load the payment window. Please try UPI.");
      return;
    }
    const rzp = new window.Razorpay({
      key: rp.keyId,
      amount: rp.amountPaise,
      currency: "INR",
      name: "PharmaCareers",
      description: "Donation",
      order_id: rp.orderId,
      prefill: { name: rp.name, email: rp.email },
      theme: { color: "#0d9488" },
      handler: async (resp) => {
        try {
          const v = await fetch("/api/donations/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              donationId,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            }),
          });
          const data = (await v.json()) as { receiptUrl?: string; error?: string };
          if (!v.ok || !data.receiptUrl) throw new Error(data.error || "Verification failed");
          router.push(data.receiptUrl);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Verification failed");
        }
      },
    });
    rzp.open();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const amountPaise = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < minAmountPaise) {
      toast.error(`Minimum donation is ${formatINR(minAmountPaise)}.`);
      return;
    }
    if (name.trim().length < 2 || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/donations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone, city, state, amountPaise, method, source,
          anonymous, supporterConsent, reason, feedback, website,
        }),
      });
      const data = (await res.json()) as RazorpayCreate & ManualCreate & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not start the donation.");
      if (method === "RAZORPAY" && data.razorpay) {
        await openRazorpay(data.donationId!, data.razorpay);
      } else if (data.upi) {
        setManual({
          donationId: data.donationId!,
          receiptNo: data.receiptNo!,
          upiId: data.upi.upiId,
          qrImageUrl: data.upi.qrImageUrl,
          amountPaise: data.upi.amountPaise,
          upiLink: data.upi.upiLink,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function submitManualRef() {
    if (!manual || ref.trim().length < 4) {
      toast.error("Enter the UPI reference / UTR number.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/donations/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId: manual.donationId, transactionRef: ref }),
      });
      const data = (await res.json()) as { receiptUrl?: string; error?: string };
      if (!res.ok || !data.receiptUrl) throw new Error(data.error || "Could not submit.");
      router.push(data.receiptUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // ── UPI manual step ──
  if (manual) {
    return (
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Pay {formatINR(manual.amountPaise)} via UPI</h2>
          <p className="text-sm text-muted-foreground">
            Scan the QR or pay to the UPI ID below, then enter your transaction reference to finish.
          </p>
          {manual.qrImageUrl && (
            <div className="flex justify-center">
              <Image
                src={manual.qrImageUrl}
                alt="UPI QR code"
                width={220}
                height={220}
                className="rounded-lg border"
                unoptimized
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
            <span className="font-mono">{manual.upiId}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(manual.upiId).then(
                  () => toast.success("UPI ID copied"),
                  () => toast.error("Could not copy"),
                );
              }}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
          <a href={manual.upiLink} className="block">
            <Button type="button" variant="outline" className="w-full">
              <Smartphone className="h-4 w-4" /> Open UPI app to pay
            </Button>
          </a>
          <div className="space-y-1.5 pt-2">
            <Label>UPI reference / UTR number</Label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 4xxxxxxxxxxx" />
          </div>
          <Button type="button" onClick={submitManualRef} disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
            I've paid — submit
          </Button>
          <p className="text-xs text-muted-foreground">
            Your donation will show as "pending verification" until an admin confirms the transfer.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Main form ──
  const rupees = Math.round(Number(amount) * 100) || 0;

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Amount */}
      <div className="space-y-2">
        <Label>Choose an amount (₹)</Label>
        <div className="flex flex-wrap gap-2">
          {suggestedAmounts.map((p) => {
            const r = Math.round(p / 100);
            const active = String(r) === amount;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(r))}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary",
                )}
              >
                ₹{r}
              </button>
            );
          })}
        </div>
        <Input
          type="number"
          min={Math.round(minAmountPaise / 100)}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Custom amount"
          className="max-w-[200px]"
        />
      </div>

      {/* Method */}
      <div className="space-y-2">
        <Label>Payment method</Label>
        <div className="flex flex-wrap gap-2">
          {razorpayAvailable && (
            <MethodButton active={method === "RAZORPAY"} onClick={() => setMethod("RAZORPAY")}>
              Card / Netbanking / UPI
            </MethodButton>
          )}
          {upiAvailable && (
            <MethodButton active={method === "UPI_MANUAL"} onClick={() => setMethod("UPI_MANUAL")}>
              UPI / QR code
            </MethodButton>
          )}
        </div>
      </div>

      {/* Donor details */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Email *">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Phone (optional)">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="City (optional)">
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label="State (optional)">
          <Input value={state} onChange={(e) => setState(e.target.value)} />
        </Field>
        <Field label="Reason for donating (optional)">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>

      <Field label="Feedback / suggestions (optional)">
        <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
      </Field>

      <div className="space-y-2">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Keep my name private (donate anonymously)</span>
          <Switch checked={anonymous} onCheckedChange={setAnonymous} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">You may feature me as a supporter</span>
          <Switch checked={supporterConsent} onCheckedChange={setSupporterConsent} />
        </label>
      </div>

      {/* Honeypot */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <Button type="submit" disabled={busy || rupees < minAmountPaise} className="w-full sm:w-auto">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
        Donate {rupees >= minAmountPaise ? formatINR(rupees) : ""}
      </Button>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Secure payment. We never store card details; payment
        secrets stay on the server.
      </p>
    </form>
  );
}

type RazorpayCreate = {
  donationId?: string;
  receiptNo?: string;
  razorpay?: { orderId: string; keyId?: string; amountPaise: number; name: string; email: string };
};
type ManualCreate = {
  donationId?: string;
  receiptNo?: string;
  upi?: { upiId: string; qrImageUrl: string; amountPaise: number; upiLink: string };
};

function MethodButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-accent" : "hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
