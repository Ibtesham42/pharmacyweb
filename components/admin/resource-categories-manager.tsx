"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  createResourceCategoryAction,
  updateResourceCategoryAction,
  deleteResourceCategoryAction,
} from "@/app/admin/(panel)/resources/actions";

type Cat = { id: string; name: string; description: string | null; sortOrder: number; _count: { resources: number } };

export function ResourceCategoriesManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [busy, setBusy] = useState(false);

  function reset() {
    setEditingId(null);
    setName("");
    setDescription("");
    setSortOrder("0");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = { name, description, sortOrder: Number(sortOrder) || 0 };
    const res = editingId
      ? await updateResourceCategoryAction(editingId, payload)
      : await createResourceCategoryAction(payload);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(editingId ? "Updated" : "Created");
    reset();
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this category? Its resources become uncategorised.")) return;
    const res = await deleteResourceCategoryAction(id);
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
            <h2 className="font-semibold">{editingId ? "Edit" : "New"} category</h2>
            <div className="space-y-1.5">
              <Label htmlFor="rc-name">Name</Label>
              <Input id="rc-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-desc">Description</Label>
              <Textarea id="rc-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-sort">Sort order</Label>
              <Input id="rc-sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="max-w-[120px]" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>
                {editingId ? "Update" : "Create"}
              </Button>
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
                  <p className="flex items-center gap-2 font-medium">
                    {c.name} <Badge variant="secondary">{c._count.resources}</Badge>
                  </p>
                  {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
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
                      setSortOrder(String(c.sortOrder));
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}>
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
