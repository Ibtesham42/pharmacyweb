import { listSelectableResources } from "@/services/resources";
import { BundleForm } from "@/components/admin/bundle-form";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewBundlePage() {
  const resources = await safe(listSelectableResources(), []);
  // `initial` omitted on purpose — BundleForm defaults it on the client. A Server
  // Component must not call the client-only emptyBundleInitial().
  return <BundleForm mode="create" resources={resources} />;
}
