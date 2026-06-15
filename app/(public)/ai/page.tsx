import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { AiChat } from "@/components/public/ai-chat";
import { getAiSettings } from "@/services/ai/settings";
import { isGroqConfigured } from "@/lib/ai/groq";
import { AI_MODE_KEYS, DEFAULT_AI_SETTINGS } from "@/lib/ai/config";
import { buildMetadata } from "@/lib/seo";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "AI Assistant",
  path: "/ai",
  description:
    "Ask the AI assistant about pharmacy, medicines (educational), healthcare careers and pharmacy jobs in India. Educational information only — not medical advice.",
});

export default async function AiPage() {
  const settings = await safe(getAiSettings(), DEFAULT_AI_SETTINGS);
  const availableModes = AI_MODE_KEYS.filter((m) => settings.modes[m]);
  const enabled =
    settings.enabled && !settings.maintenanceMode && isGroqConfigured() && availableModes.length > 0;

  return (
    <div className="container max-w-3xl py-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "AI Assistant", path: "/ai" }]} />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">AI Healthcare Assistant</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Educational help for pharmacy, medicines, healthcare careers and pharmacy jobs.
      </p>
      <div className="mt-4 rounded-xl border bg-card p-3 sm:p-4">
        <div className="h-[68vh]">
          <AiChat
            enabled={enabled}
            availableModes={availableModes}
            imageEnabled={enabled && settings.imageAnalysisEnabled}
            documentEnabled={enabled && settings.documentAnalysisEnabled}
            maxImageMB={settings.maxImageMB}
            maxDocMB={settings.maxDocMB}
          />
        </div>
      </div>
    </div>
  );
}
