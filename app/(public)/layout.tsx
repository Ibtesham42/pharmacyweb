import Script from "next/script";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { PageViewTracker } from "@/components/public/page-view-tracker";
import { BackToTop } from "@/components/public/back-to-top";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { listPublicCategories } from "@/services/categories";
import { safe } from "@/lib/utils";
import { AiChatFab } from "@/components/public/ai-chat-fab";
import { getAiSettings } from "@/services/ai/settings";
import { isGroqConfigured } from "@/lib/ai/groq";
import { AI_MODE_KEYS, DEFAULT_AI_SETTINGS } from "@/lib/ai/config";
import { getDonationSettings } from "@/services/donations";
import { DEFAULT_DONATION_SETTINGS } from "@/lib/donations/config";
import { getCurrentUser } from "@/lib/session";

// Site-wide AdSense loader on all public pages (required for Google's site
// review/approval and Auto ads). Individual units only render <ins> + push.
const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [categories, aiSettings, donationSettings, currentUser] = await Promise.all([
    safe(listPublicCategories(), []),
    safe(getAiSettings(), DEFAULT_AI_SETTINGS),
    safe(getDonationSettings(), DEFAULT_DONATION_SETTINGS),
    safe(getCurrentUser(), null),
  ]);
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "EDITOR";
  const navCategories = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  const aiModes = AI_MODE_KEYS.filter((m) => aiSettings.modes[m]);
  const aiEnabled =
    aiSettings.enabled && !aiSettings.maintenanceMode && isGroqConfigured() && aiModes.length > 0;

  return (
    <>
      {adsenseEnabled && adsenseClient && (
        <Script
          id="adsbygoogle-loader"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
        />
      )}
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <SiteHeader
        categories={navCategories}
        donateEnabled={donationSettings.enabled}
        authed={Boolean(currentUser)}
        isAdmin={isAdmin}
      />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter />
      <BackToTop />
      {aiEnabled && (
        <AiChatFab
          availableModes={aiModes}
          imageEnabled={aiSettings.imageAnalysisEnabled}
          documentEnabled={aiSettings.documentAnalysisEnabled}
          maxImageMB={aiSettings.maxImageMB}
          maxDocMB={aiSettings.maxDocMB}
        />
      )}
      <PageViewTracker />
    </>
  );
}
