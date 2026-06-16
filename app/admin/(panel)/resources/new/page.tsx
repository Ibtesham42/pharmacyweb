import { listResourceCategories } from "@/services/resource-categories";
import { ResourceForm, emptyResourceInitial } from "@/components/admin/resource-form";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  const categories = await safe(listResourceCategories(), []);
  return (
    <ResourceForm
      mode="create"
      initial={emptyResourceInitial()}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
