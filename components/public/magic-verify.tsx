"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MagicVerify({ token, next }: { token?: string; next: string }) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      if (!token) return setError(true);
      const res = await signIn("magiclink", { token, redirect: false });
      if (res && !res.error) {
        router.push(next);
        router.refresh();
      } else {
        setError(true);
      }
    })();
  }, [token, next, router]);

  if (!error) {
    return (
      <p className="flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Signing you in…
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">That sign-in link was invalid or has expired.</p>
      <Button asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
