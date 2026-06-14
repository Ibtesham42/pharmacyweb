import { PostType } from "@prisma/client";
import { listCategories } from "@/services/categories";
import { getLocations } from "@/services/settings";
import { emptyInitial } from "@/lib/post-form-types";
import { PostForm } from "@/components/admin/post-form";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const valid = (["JOB", "NEWS", "ARTICLE"].includes(type ?? "") ? type : "JOB") as PostType;
  const [categories, locations] = await Promise.all([listCategories(), getLocations()]);

  return (
    <PostForm
      mode="create"
      initial={emptyInitial(valid)}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      states={locations.states}
    />
  );
}
