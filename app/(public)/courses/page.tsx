import { GraduationCap } from "lucide-react";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Courses — Coming Soon",
  path: "/courses",
  description: "Online courses for pharmacy and medical professionals — coming soon.",
  noindex: true,
});

export default function CoursesPage() {
  return (
    <div className="container max-w-2xl py-16 text-center">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Courses", path: "/courses" }]} />
      <GraduationCap className="mx-auto mt-8 h-12 w-12 text-primary" />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Courses — Coming Soon</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Online courses with video lessons and downloadable material are on the way. Stay tuned!
      </p>
    </div>
  );
}
