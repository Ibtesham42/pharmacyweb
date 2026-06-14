import { listContactMessages } from "@/services/contact";
import { MessagesList } from "@/components/admin/messages-list";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const { items } = await listContactMessages({ page: 1 });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>
      <MessagesList
        messages={items.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          subject: m.subject,
          message: m.message,
          handled: m.handled,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
