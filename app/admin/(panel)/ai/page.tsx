import { getAiSettings } from "@/services/ai/settings";
import { getAiUsageStats, listConversationLogs, listErrorLogs } from "@/services/ai/usage";
import { isGroqConfigured } from "@/lib/ai/groq";
import { AiSettingsForm } from "@/components/admin/ai-settings-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AI_MODE_LABELS, type AiModeKey } from "@/lib/ai/config";
import { formatDate } from "@/lib/format";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

const fmt = new Intl.NumberFormat("en-IN");

export default async function AdminAiPage() {
  const [settings, stats, conversations, errors] = await Promise.all([
    getAiSettings(),
    safe(getAiUsageStats(), {
      totalRequests: 0,
      dailyRequests: 0,
      activeUsers: 0,
      tokenUsage: 0,
      apiErrors: 0,
      avgResponseMs: 0,
    }),
    safe(listConversationLogs(50), []),
    safe(listErrorLogs(50), []),
  ]);
  const groqConfigured = isGroqConfigured();

  const cards = [
    { label: "Total requests", value: fmt.format(stats.totalRequests) },
    { label: "Today", value: fmt.format(stats.dailyRequests) },
    { label: "Active users (today)", value: fmt.format(stats.activeUsers) },
    { label: "Tokens used", value: fmt.format(stats.tokenUsage) },
    { label: "API errors", value: fmt.format(stats.apiErrors) },
    { label: "Avg response", value: `${stats.avgResponseMs} ms` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Settings</h1>
        <p className="text-sm text-muted-foreground">
          Groq-powered healthcare assistant — configuration, usage and logs.
        </p>
      </div>

      {!groqConfigured && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <strong>GROQ_API_KEY is not set.</strong> Add it to your environment (and Vercel), then
          redeploy, to enable AI responses.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <AiSettingsForm settings={settings} groqConfigured={groqConfigured} />
        </TabsContent>

        <TabsContent value="conversations">
          {conversations.length === 0 ? (
            <Empty text="No conversations yet." />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-2 font-medium">Title</th>
                    <th className="p-2 font-medium">Mode</th>
                    <th className="p-2 font-medium">Messages</th>
                    <th className="p-2 font-medium">Client</th>
                    <th className="p-2 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-2">{c.title || "Untitled"}</td>
                      <td className="p-2">{AI_MODE_LABELS[c.mode as AiModeKey]}</td>
                      <td className="p-2">{c._count.messages}</td>
                      <td className="p-2 font-mono text-xs text-muted-foreground">
                        {c.clientId.slice(0, 8)}…
                      </td>
                      <td className="p-2 text-muted-foreground">{formatDate(c.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="errors">
          {errors.length === 0 ? (
            <Empty text="No errors logged." />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-2 font-medium">Status</th>
                    <th className="p-2 font-medium">Model</th>
                    <th className="p-2 font-medium">Message</th>
                    <th className="p-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((e) => (
                    <tr key={e.id} className="border-t">
                      <td className="p-2">{e.status}</td>
                      <td className="p-2">{e.model}</td>
                      <td className="p-2 text-muted-foreground">{e.errorMessage || "—"}</td>
                      <td className="p-2 text-muted-foreground">{formatDate(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
