import { SkipLink } from "@/components/SkipLink";
import { SmoothScroll } from "@/components/SmoothScroll";
import { LabFooter } from "@/features/deskcloud/components/LabFooter";
import { LabHeader } from "@/features/deskcloud/components/LabHeader";

// Lab pages are standalone showcases: no portfolio frame, nav or footer
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <SkipLink />
      <LabHeader />
      <main id="main">{children}</main>
      <LabFooter />
    </SmoothScroll>
  );
}
