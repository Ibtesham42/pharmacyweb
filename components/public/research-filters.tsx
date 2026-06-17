"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ALL = "__all__";

export function ResearchFilters({
  years,
  categories,
}: {
  years: number[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/library?${params.toString()}`);
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString() ?? "";
    setParam("q", q.trim());
  }

  const hasFilters = sp.get("year") || sp.get("category") || sp.get("q");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={onSearch} className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={sp.get("q") ?? ""}
          placeholder="Search title, author, abstract…"
          className="h-9 w-56 rounded-md border bg-background pl-8 pr-3 text-sm"
        />
      </form>

      <Select value={sp.get("year") ?? ALL} onValueChange={(v) => setParam("year", v)}>
        <SelectTrigger className="h-9 w-[120px]">
          <SelectValue placeholder="Any year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any year</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sp.get("category") ?? ALL} onValueChange={(v) => setParam("category", v)}>
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue placeholder="All subjects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All subjects</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/library")}>
          <X className="h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
