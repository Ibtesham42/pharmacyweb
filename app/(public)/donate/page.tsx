import { Heart, Bot, BookOpen, Briefcase, Rocket } from "lucide-react";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { DonationForm } from "@/components/public/donation-form";
import { FeaturedSupporters } from "@/components/public/featured-supporters";
import { getDonationSettings, getPublicFeaturedSupporters } from "@/services/donations";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { DEFAULT_DONATION_SETTINGS } from "@/lib/donations/config";
import { buildMetadata } from "@/lib/seo";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Support Us",
  path: "/donate",
  description:
    "Support PharmaCareers — your voluntary donation helps keep pharmacy jobs, medical content, AI tools and learning resources free for the community.",
});

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string }>;
}) {
  const { src } = await searchParams;
  const settings = await safe(getDonationSettings(), DEFAULT_DONATION_SETTINGS);
  const razorpayAvailable = isRazorpayConfigured();
  const upiAvailable = Boolean(settings.upiId);
  const supporters =
    settings.featuredEnabled && settings.featuredOnDonatePage
      ? await safe(
          getPublicFeaturedSupporters({ limit: settings.featuredMaxShow, thresholds: settings.badgeThresholds }),
          [],
        )
      : [];

  if (!settings.enabled || (!razorpayAvailable && !upiAvailable)) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <Heart className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-2xl font-bold">Support Us</h1>
        <p className="mt-2 text-muted-foreground">
          Donations aren’t available right now. Please check back soon — thank you for your support!
        </p>
      </div>
    );
  }

  const helps = [
    { icon: Bot, text: "AI tools maintenance" },
    { icon: BookOpen, text: "Pharmacy educational content" },
    { icon: Briefcase, text: "Job-discovery resources" },
    { icon: Rocket, text: "Future platform improvements" },
  ];

  return (
    <div className="container max-w-4xl py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Support Us", path: "/donate" }]} />
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Heart className="h-6 w-6 text-primary" /> {settings.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{settings.message}</p>
          {settings.pageContent && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{settings.pageContent}</p>
          )}
          <ul className="mt-5 space-y-2.5">
            {helps.map((h) => (
              <li key={h.text} className="flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <h.icon className="h-4 w-4" />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-muted-foreground">
            Donations are voluntary and non-refundable. This is community support, not a purchase.
          </p>
        </div>

        <div>
          <DonationForm
            source={src}
            razorpayAvailable={razorpayAvailable}
            upiAvailable={upiAvailable}
            suggestedAmounts={settings.suggestedAmounts}
            minAmountPaise={settings.minAmountPaise}
          />
        </div>
      </div>

      {supporters.length > 0 && (
        <div className="mt-12 border-t pt-10">
          <FeaturedSupporters supporters={supporters} />
        </div>
      )}
    </div>
  );
}
