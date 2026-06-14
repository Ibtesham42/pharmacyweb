import { listCategories } from "@/services/categories";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await listCategories();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          _count: c._count,
        }))}
      />
    </div>
  );
}
