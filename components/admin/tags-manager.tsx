"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { deleteTagAction } from "@/app/admin/(panel)/tags/actions";

export function TagsManager({ tags }: { tags: { id: string; name: string; count: number }[] }) {
  const router = useRouter();

  async function remove(id: string) {
    if (!confirm("Delete this tag?")) return;
    const res = await deleteTagAction(id);
    if (res.ok) {
      toast.success("Deleted");
      router.refresh();
    } else toast.error(res.error || "Failed");
  }

  if (tags.length === 0) {
    return <p className="text-sm text-muted-foreground">No tags yet. Tags are created when you add them to posts.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <Badge key={t.id} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-2 text-sm">
          {t.name}
          <span className="text-muted-foreground">({t.count})</span>
          <button onClick={() => remove(t.id)} aria-label={`Delete ${t.name}`} className="ml-1 hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
