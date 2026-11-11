import { SkipLink } from "@/components/SkipLink";
import { SmoothScroll } from "@/components/SmoothScroll";

// Lab pages are standalone showcases: no portfolio frame, nav or footer
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <SkipLink />
      <main id="main">{children}</main>
    </SmoothScroll>
  );
}
