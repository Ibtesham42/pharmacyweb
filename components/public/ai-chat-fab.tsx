"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { AiChat } from "@/components/public/ai-chat";
import { cn } from "@/lib/utils";
import type { AiModeKey } from "@/lib/ai/config";

/** Global floating AI chat button + panel (rendered only when AI is enabled). */
export function AiChatFab({
  availableModes,
  imageEnabled = false,
  documentEnabled = false,
  maxImageMB = 8,
  maxDocMB = 15,
}: {
  availableModes: AiModeKey[];
  imageEnabled?: boolean;
  documentEnabled?: boolean;
  maxImageMB?: number;
  maxDocMB?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-40 sm:inset-x-auto sm:bottom-24 sm:right-4">
          <div className="mx-auto flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border bg-background shadow-2xl sm:h-[600px] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <MessageCircle className="h-4 w-4 text-primary" /> AI Assistant
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-md p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 px-4 pb-3">
              <AiChat
                enabled
                availableModes={availableModes}
                compact
                imageEnabled={imageEnabled}
                documentEnabled={documentEnabled}
                maxImageMB={maxImageMB}
                maxDocMB={maxDocMB}
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className={cn(
          "fixed bottom-6 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          open && "hidden",
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </>
  );
}
