"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { JOB_TYPE_LABELS } from "@/lib/format";

const ALL = "all";

export function JobFilters({ states }: { states: { state: string; cities: string[] }[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  const state = sp.get("state") || "";
  const city = sp.get("city") || "";
  const jobType = sp.get("jobType") || "";
  const cities = states.find((s) => s.state === state)?.cities ?? [];
  const hasFilters = Boolean(state || city || jobType);

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    if (key === "state") params.delete("city");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Select value={state || ALL} onValueChange={(v) => update("state", v)}>
        <SelectTrigger aria-label="State">
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All states</SelectItem>
          {states.map((s) => (
            <SelectItem key={s.state} value={s.state}>
              {s.state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={city || ALL} onValueChange={(v) => update("city", v)} disabled={!state}>
        <SelectTrigger aria-label="City">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All cities</SelectItem>
          {cities.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={jobType || ALL} onValueChange={(v) => update("jobType", v)}>
        <SelectTrigger aria-label="Job type">
          <SelectValue placeholder="Job type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => router.push("?")}
        disabled={!hasFilters}
        className="w-full"
      >
        Clear
      </Button>
    </div>
  );
}
