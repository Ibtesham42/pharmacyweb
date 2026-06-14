"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/admin/(panel)/categories/actions";

interface Cat {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { posts: number };
}

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setEditingId(null);
    setName("");
    setDescription("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = { name, description };
    const res = editingId
      ? await updateCategoryAction(editingId, payload)
      : await createCategoryAction(payload);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(editingId ? "Updated" : "Created");
    reset();
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this category? Posts will become uncategorized.")) return;
    const res = await deleteCategoryAction(id);
    if (res.ok) {
      toast.success("Deleted");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardContent className="p-5">
          <form onSubmit={submit} className="space-y-3">
            <h2 className="font-semibold">{editingId ? "Edit category" : "New category"}</h2>
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>{editingId ? "Update" : "Create"}</Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={reset}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <ul className="divide-y">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">
                    {c.name} <Badge variant="secondary">{c._count.posts}</Badge>
                  </p>
                  {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                  <p className="text-xs text-muted-foreground">/{c.slug}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingId(c.id);
                      setName(c.name);
                      setDescription(c.description ?? "");
                    }}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
