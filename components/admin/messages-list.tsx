"use client";

import { useRouter } from "next/navigation";
import { Check, Undo2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markHandledAction } from "@/app/admin/(panel)/messages/actions";

interface Msg {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  createdAt: string;
}

export function MessagesList({ messages }: { messages: Msg[] }) {
  const router = useRouter();

  async function toggle(id: string, handled: boolean) {
    const res = await markHandledAction(id, handled);
    if (res.ok) router.refresh();
    else toast.error(res.error || "Failed");
  }

  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No messages yet.</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <Card key={m.id} className={m.handled ? "opacity-70" : ""}>
          <CardContent className="space-y-2 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{m.name}</span>
                <a href={`mailto:${m.email}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <Mail className="h-3.5 w-3.5" /> {m.email}
                </a>
                {m.handled && <Badge variant="success">Handled</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(m.createdAt).toLocaleString("en-IN")}
              </span>
            </div>
            {m.subject && <p className="text-sm font-medium">{m.subject}</p>}
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => toggle(m.id, !m.handled)}>
                {m.handled ? <><Undo2 className="h-4 w-4" /> Reopen</> : <><Check className="h-4 w-4" /> Mark handled</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
