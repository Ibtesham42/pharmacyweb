import { Mail } from "lucide-react";
import { ContactForm } from "@/components/public/contact-form";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact Us",
  path: "/contact",
  description: "Get in touch with the PharmaCareers team for support, partnerships or feedback.",
});

export default function ContactPage() {
  return (
    <div className="container max-w-2xl py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]} />
      <header className="mb-6 mt-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Mail className="h-7 w-7 text-primary" /> Contact Us
        </h1>
        <p className="mt-1 text-muted-foreground">
          Questions, feedback or partnership enquiries? Send us a message.
        </p>
      </header>
      <ContactForm />
    </div>
  );
}
