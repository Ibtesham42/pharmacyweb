"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPES } from "@/lib/marketplace/config";

const ALL = "__all__";

export function ResourceFilters({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/store?${params.toString()}`);
  }

  const hasFilters = sp.get("type") || sp.get("category") || sp.get("access") || sp.get("q");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={sp.get("type") ?? ALL} onValueChange={(v) => setParam("type", v)}>
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          {RESOURCE_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {RESOURCE_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sp.get("category") ?? ALL} onValueChange={(v) => setParam("category", v)}>
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sp.get("access") ?? ALL} onValueChange={(v) => setParam("access", v)}>
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Any price" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any price</SelectItem>
          <SelectItem value="FREE">Free</SelectItem>
          <SelectItem value="PAID">Paid</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/store")}>
          <X className="h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
