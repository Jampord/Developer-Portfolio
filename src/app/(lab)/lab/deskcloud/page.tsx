import type { Metadata } from "next";
import Link from "next/link";

// Placeholder until the Deskcloud page lands (see docs/deskcloud-plan.md)
export const metadata: Metadata = {
  title: "Deskcloud",
  alternates: { canonical: "/lab/deskcloud" },
  robots: { index: false },
};

export default function DeskcloudPage() {
  return (
    <div className="mx-auto flex min-h-screen w-[calc(100%-2rem)] max-w-6xl flex-col items-start justify-center gap-4">
      <p className="font-mono text-sm text-muted">Lab</p>
      <h1 className="font-display text-5xl font-semibold tracking-tight md:text-7xl">Deskcloud</h1>
      <p className="text-lg text-muted">Coming soon.</p>
      <Link href="/" className="text-primary underline-offset-4 hover:underline">
        ← Back to portfolio
      </Link>
    </div>
  );
}
