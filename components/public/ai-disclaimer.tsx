import { AlertTriangle } from "lucide-react";
import { MEDICAL_DISCLAIMER } from "@/lib/ai/config";
import { cn } from "@/lib/utils";

/** Permanent medical safety disclaimer shown wherever the AI assistant appears. */
export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{MEDICAL_DISCLAIMER}</span>
    </p>
  );
}
