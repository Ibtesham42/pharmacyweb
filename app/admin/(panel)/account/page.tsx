import { getCurrentUser } from "@/lib/session";
import { getAccount } from "@/services/account";
import { AccountForm } from "@/components/admin/account-form";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  const account = user ? await getAccount(user.id) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Account</h1>
      <AccountForm name={account?.name ?? ""} email={account?.email ?? ""} />
    </div>
  );
}
