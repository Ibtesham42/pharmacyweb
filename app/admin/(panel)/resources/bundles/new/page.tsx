import { listSelectableResources } from "@/services/resources";
import { BundleForm, emptyBundleInitial } from "@/components/admin/bundle-form";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewBundlePage() {
  const resources = await safe(listSelectableResources(), []);
  return <BundleForm mode="create" initial={emptyBundleInitial()} resources={resources} />;
}
