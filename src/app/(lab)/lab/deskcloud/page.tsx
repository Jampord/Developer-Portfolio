import type { Metadata } from "next";
import Link from "next/link";
import { DemoDesktop } from "@/features/deskcloud/components/DemoDesktop";
import { en } from "@/features/deskcloud/content/en";

// Work in progress: the live demo until the full page lands (see docs/deskcloud-plan.md)
export const metadata: Metadata = {
  title: "Deskcloud",
  alternates: { canonical: "/lab/deskcloud" },
  robots: { index: false },
};

export default function DeskcloudPage() {
  const t = en.preview;
  return (
    <>
      <DemoDesktop />
      <div className="mx-auto flex w-[calc(100%-2rem)] max-w-6xl flex-col items-start gap-3 py-10">
        <p className="font-mono text-sm text-muted">{t.eyebrow}</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">{t.title}</h1>
        <p className="text-muted">{t.body}</p>
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          {t.back}
        </Link>
      </div>
    </>
  );
}
