import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { CareerCopilot } from "@/components/public/career-copilot";
import { getAiSettings } from "@/services/ai/settings";
import { isGroqConfigured } from "@/lib/ai/groq";
import { AI_MODE_KEYS, DEFAULT_AI_SETTINGS } from "@/lib/ai/config";
import { buildMetadata } from "@/lib/seo";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Pharmacy Career Copilot",
  path: "/copilot",
  description:
    "AI career copilot for pharmacy & healthcare: chat, résumé analysis, job matching, interview prep, study help, and a personalized learning plan. Educational guidance only.",
});

export default async function CopilotPage() {
  const settings = await safe(getAiSettings(), DEFAULT_AI_SETTINGS);
  const availableModes = AI_MODE_KEYS.filter((m) => settings.modes[m]);
  const enabled =
    settings.enabled && !settings.maintenanceMode && isGroqConfigured() && availableModes.length > 0;
  const careerEnabled = enabled && settings.careerToolsEnabled;

  return (
    <div className="container max-w-4xl py-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Career Copilot", path: "/copilot" }]} />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Pharmacy Career Copilot</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Chat, résumé analysis, job matching, interview prep, study help, and a personalized learning
        plan — in one place.
      </p>
      <div className="mt-4">
        <CareerCopilot
          enabled={enabled}
          careerEnabled={careerEnabled}
          availableModes={availableModes}
          imageEnabled={enabled && settings.imageAnalysisEnabled}
          documentEnabled={enabled && settings.documentAnalysisEnabled}
          maxImageMB={settings.maxImageMB}
          maxDocMB={settings.maxDocMB}
        />
      </div>
    </div>
  );
}
