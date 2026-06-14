import { listMedia } from "@/services/media";
import { MediaLibrary } from "@/components/admin/media-library";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const { items } = await listMedia({ page: 1 });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Media Library</h1>
      <MediaLibrary
        items={items.map((m) => ({ id: m.id, type: m.type, url: m.url, fileName: m.fileName }))}
      />
    </div>
  );
}
