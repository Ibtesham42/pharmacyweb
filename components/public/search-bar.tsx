"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SearchBar({
  defaultValue = "",
  placeholder = "Search jobs, articles, companies…",
  className,
  compact = false,
}: {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className={className} role="search">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
              compact ? "h-4 w-4" : "h-5 w-5",
            )}
          />
          <Input
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label="Search"
            className={cn("pl-10", compact ? "h-10 text-sm" : "h-12 text-base")}
          />
        </div>
        <Button type="submit" size={compact ? "default" : "lg"} className={compact ? "h-10" : "h-12"}>
          Search
        </Button>
      </div>
    </form>
  );
}
