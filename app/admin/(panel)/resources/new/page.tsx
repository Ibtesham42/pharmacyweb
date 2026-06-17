import { listResourceCategories } from "@/services/resource-categories";
import { ResourceForm } from "@/components/admin/resource-form";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  const categories = await safe(listResourceCategories(), []);
  // Note: `initial` is intentionally omitted — ResourceForm defaults it on the
  // client. A Server Component must not call the client-only emptyResourceInitial().
  return <ResourceForm mode="create" categories={categories.map((c) => ({ id: c.id, name: c.name }))} />;
}
