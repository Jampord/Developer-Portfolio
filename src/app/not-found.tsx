import { SiteShell } from "@/components/SiteShell";

// Unmatched URLs only get the root layout, so this page adds the portfolio shell itself
export default function NotFound() {
  return (
    <SiteShell>
      <div className="flex min-h-[70vh] items-center justify-center gap-5 px-4">
        <h1 className="border-r border-foreground/30 pr-5 text-2xl font-medium">404</h1>
        <p className="text-sm">This page could not be found.</p>
      </div>
    </SiteShell>
  );
}
