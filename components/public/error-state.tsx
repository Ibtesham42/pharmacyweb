import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  icon: Icon = AlertTriangle,
  onRetry,
  showHome = true,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onRetry?: () => void;
  showHome?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <Icon className="mb-3 h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {(onRetry || showHome) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button onClick={onRetry} size="sm">
              Try again
            </Button>
          )}
          {showHome && (
            <Button asChild variant="outline" size="sm">
              <Link href="/">Go home</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
