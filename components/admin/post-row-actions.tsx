"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { PostStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { deletePostAction, setPostStatusAction } from "@/app/admin/(panel)/posts/actions";

export function PostRowActions({ id, status }: { id: string; status: PostStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function togglePublish() {
    const next: PostStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    startTransition(async () => {
      const res = await setPostStatusAction(id, next);
      if (res.ok) {
        toast.success(next === "PUBLISHED" ? "Published" : "Moved to draft");
        router.refresh();
      } else toast.error(res.error || "Failed");
    });
  }

  async function remove() {
    if (!confirm("Delete this post? It will be hidden from the site.")) return;
    setBusy(true);
    const res = await deletePostAction(id);
    setBusy(false);
    if (res.ok) {
      toast.success("Deleted");
      router.refresh();
    } else toast.error(res.error || "Failed");
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <Link href={`/admin/posts/${id}`} aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePublish} disabled={pending} aria-label="Toggle publish">
        {status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={remove} disabled={busy} aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
