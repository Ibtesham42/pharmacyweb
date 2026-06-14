import { getHomepage, getSetting } from "@/services/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [homepage, contact] = await Promise.all([
    getHomepage(),
    getSetting<{ email?: string; phone?: string; address?: string }>("contact"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsForm
        homepage={homepage}
        contact={{
          email: contact?.email ?? "",
          phone: contact?.phone ?? "",
          address: contact?.address ?? "",
        }}
      />
    </div>
  );
}
