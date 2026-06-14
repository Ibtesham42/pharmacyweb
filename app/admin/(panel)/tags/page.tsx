import { listTags } from "@/services/tags";
import { Card, CardContent } from "@/components/ui/card";
import { TagsManager } from "@/components/admin/tags-manager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const tags = await listTags();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tags</h1>
      <Card>
        <CardContent className="p-5">
          <TagsManager tags={tags.map((t) => ({ id: t.id, name: t.name, count: t._count.posts }))} />
        </CardContent>
      </Card>
    </div>
  );
}
