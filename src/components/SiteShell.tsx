import { Footer } from "@/components/Footer";
import { FrameShell } from "@/components/FrameShell";
import { Nav } from "@/components/Navbar";
import { SkipLink } from "@/components/SkipLink";
import { SmoothScroll } from "@/components/SmoothScroll";

// The portfolio shell: frame, nav and footer. Used by the (site) layout and the 404 page.
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <SkipLink />
      <FrameShell>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </FrameShell>
    </SmoothScroll>
  );
}
