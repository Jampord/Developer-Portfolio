import type { Metadata } from "next";
import Link from "next/link";
import { EngineSandbox } from "@/features/deskcloud/components/EngineSandbox";

// Work in progress: an engine preview until the real page lands (see docs/deskcloud-plan.md)
export const metadata: Metadata = {
  title: "Deskcloud",
  alternates: { canonical: "/lab/deskcloud" },
  robots: { index: false },
};

export default function DeskcloudPage() {
  return (
    <>
      <EngineSandbox />
      <div className="mx-auto flex w-[calc(100%-2rem)] max-w-6xl flex-col items-start gap-3 py-10">
        <p className="font-mono text-sm text-muted">Lab · engine preview</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Deskcloud</h1>
        <p className="text-muted">Clouds part around the dashed boxes. The full page is coming soon.</p>
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          ← Back to portfolio
        </Link>
      </div>
    </>
  );
}
