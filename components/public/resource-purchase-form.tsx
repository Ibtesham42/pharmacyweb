"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ShoppingCart, Loader2, Copy, Smartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

type Method = "RAZORPAY" | "UPI_MANUAL";

type RazorpayResp = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
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

type ManualState = { purchaseId: string; upiId: string; qrImageUrl: string; amountPaise: number; upiLink: string };

export function ResourcePurchaseForm({
  slug,
  pricePaise,
  razorpayAvailable,
  upiAvailable,
  defaultName = "",
  defaultEmail = "",
}: {
  slug: string;
  pricePaise: number;
  razorpayAvailable: boolean;
  upiAvailable: boolean;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [method, setMethod] = useState<Method>(razorpayAvailable ? "RAZORPAY" : "UPI_MANUAL");
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState<ManualState | null>(null);
  const [ref, setRef] = useState("");

  async function openRazorpay(purchaseId: string, rp: NonNullable<CreateResp["razorpay"]>) {
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
      description: rp.resourceTitle,
      order_id: rp.orderId,
      prefill: { name: rp.name, email: rp.email },
      theme: { color: "#0d9488" },
      handler: async (resp) => {
        try {
          const v = await fetch("/api/resources/purchase/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              purchaseId,
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
    if (name.trim().length < 2 || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/resources/${slug}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, method }),
      });
      const data = (await res.json()) as CreateResp & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not start the purchase.");
      if (method === "RAZORPAY" && data.razorpay) {
        await openRazorpay(data.purchaseId!, data.razorpay);
      } else if (data.upi) {
        setManual({ purchaseId: data.purchaseId!, ...data.upi });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function submitManual() {
    if (!manual || ref.trim().length < 4) {
      toast.error("Enter the UPI reference / UTR number.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/resources/purchase/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId: manual.purchaseId, transactionRef: ref }),
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

  if (manual) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Pay {formatINR(manual.amountPaise)} via UPI, then enter your reference to finish. Access unlocks
          after an admin verifies the payment.
        </p>
        {manual.qrImageUrl && (
          <div className="flex justify-center">
            <Image src={manual.qrImageUrl} alt="UPI QR" width={180} height={180} className="rounded-lg border" unoptimized />
          </div>
        )}
        <div className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
          <span className="font-mono">{manual.upiId}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(manual.upiId).then(() => toast.success("Copied"))}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
        </div>
        <a href={manual.upiLink} className="block">
          <Button type="button" variant="outline" className="w-full">
            <Smartphone className="h-4 w-4" /> Open UPI app
          </Button>
        </a>
        <div className="space-y-1.5">
          <Label>UPI reference / UTR</Label>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 4xxxxxxxxxxx" />
        </div>
        <Button type="button" onClick={submitManual} disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} I've paid — submit
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Full name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Email (receipt + downloads)</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      {razorpayAvailable && upiAvailable && (
        <div className="flex gap-2">
          <MethodBtn active={method === "RAZORPAY"} onClick={() => setMethod("RAZORPAY")}>
            Card / Netbanking / UPI
          </MethodBtn>
          <MethodBtn active={method === "UPI_MANUAL"} onClick={() => setMethod("UPI_MANUAL")}>
            UPI / QR
          </MethodBtn>
        </div>
      )}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
        Buy now · {formatINR(pricePaise)}
      </Button>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Secure payment. Card details never touch our servers.
      </p>
    </form>
  );
}

type CreateResp = {
  purchaseId?: string;
  receiptNo?: string;
  razorpay?: { orderId: string; keyId?: string; amountPaise: number; name: string; email: string; resourceTitle: string };
  upi?: { upiId: string; qrImageUrl: string; amountPaise: number; upiLink: string };
};

function MethodBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
        active ? "border-primary bg-accent" : "hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}
