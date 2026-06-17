"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, LogIn, UserPlus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * Shown to guests in place of the real Download/Buy button. Opens a modal that
 * routes them to sign in / create an account, returning to `next` afterwards.
 */
export function DownloadGate({ next, label = "Download" }: { next: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const qs = `?next=${encodeURIComponent(next)}`;

  return (
    <>
      <Button type="button" className="w-full" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
              <Lock className="h-5 w-5" />
            </span>
            <DialogTitle className="text-center">Sign in to access this resource</DialogTitle>
            <DialogDescription className="text-center">
              Please sign in or create a free account to download. It only takes a moment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href={`/login${qs}`}>
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/signup${qs}`}>
                <UserPlus className="h-4 w-4" /> Create account
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
