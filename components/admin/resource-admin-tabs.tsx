import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/resources/bundles", label: "Bundles" },
  { href: "/admin/resources/memberships", label: "Memberships" },
  { href: "/admin/resources/categories", label: "Categories" },
  { href: "/admin/resources/purchases", label: "Purchases" },
  { href: "/admin/resources/reviews", label: "Reviews" },
  { href: "/admin/resources/settings", label: "Settings" },
];

export function ResourceAdminTabs({ active, pendingReviews = 0 }: { active: string; pendingReviews?: number }) {
  return (
    <div className="flex flex-wrap gap-1 border-b pb-2">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
            active === t.href && "bg-primary text-primary-foreground hover:bg-primary",
          )}
        >
          {t.label}
          {t.label === "Reviews" && pendingReviews > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800">
              {pendingReviews}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
