"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RefItem } from "@/lib/post-form-types";

export type { RefItem };

export function ReferencesInput({
  value,
  onChange,
}: {
  value: RefItem[];
  onChange: (refs: RefItem[]) => void;
}) {
  function update(i: number, patch: Partial<RefItem>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-2">
      {value.map((ref, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="Label"
            value={ref.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className="w-1/3"
          />
          <Input
            placeholder="https://…"
            value={ref.url}
            onChange={(e) => update(i, { url: e.target.value })}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { label: "", url: "" }])}>
        <Plus className="h-4 w-4" /> Add reference
      </Button>
    </div>
  );
}
