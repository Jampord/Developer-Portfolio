import type { Metadata } from "next";
import { DeskcloudHero } from "@/features/deskcloud/components/DeskcloudHero";
import { Faq } from "@/features/deskcloud/components/Faq";
import { Features } from "@/features/deskcloud/components/Features";
import { HowItWorks } from "@/features/deskcloud/components/HowItWorks";
import { WaitlistSection } from "@/features/deskcloud/components/WaitlistSection";
import { en } from "@/features/deskcloud/content/en";
import { site } from "@/lib/site";

const { title, description } = en.meta;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/lab/deskcloud" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${title} — ${site.name}`,
    description,
    url: "/lab/deskcloud",
  },
  twitter: { card: "summary_large_image", title: `${title} — ${site.name}`, description },
};

export default function DeskcloudPage() {
  return (
    <div className="mx-auto w-[calc(100%-2rem)] max-w-6xl">
      <DeskcloudHero />
      <HowItWorks />
      <Features />
      <Faq />
      <WaitlistSection />
    </div>
  );
}
