"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { rememberProject, takeLanding, WORK_RETURN_ATTR } from "@/lib/landing";
import { NAVIGATE_EVENT } from "@/lib/navigate";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

/** Where a section link should land: the section's top, less the room it asks for above itself */
function sectionTop(hash: string): number | null {
  const el = document.getElementById(decodeURIComponent(hash.replace(/^#/, "")));
  if (!el) return null;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - margin));
}

/**
 * Smooth wheel scrolling, and the one place that decides where a link lands.
 *
 * The smooth scroller keeps its own idea of where the page is, so a jump made behind its back can
 * be undone on the next frame, and the router skips the jump altogether when the address already
 * ends in the section you asked for. Both are handled here: every arrival goes through `jumpTo`.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  /** The path we last settled on, so the first render leaves the browser's own position alone */
  const settled = useRef(pathname);
  /** Set by the back and forward buttons: the browser puts those pages back where they were */
  const restoring = useRef(false);
  /** The section a clicked link asked for, known before the address bar catches up */
  const wanted = useRef<string | null>(null);
  /** How far down each page was when it was left, so Back and Forward return to that spot */
  const leftAt = useRef(new Map<string, number>());

  const jumpTo = (top: number) => {
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
  };

  useEffect(() => {
    // Visitors who ask for less motion get normal, native scrolling
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: false });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onPop = () => {
      // The address has already changed, but the page on screen is still the one being left
      leftAt.current.set(settled.current, window.scrollY);
      restoring.current = true;
    };

    /** We are about to go to this address, by a link or from code */
    const heading = (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      restoring.current = false;
      wanted.current = url.hash || null;
      if (url.pathname !== window.location.pathname) leftAt.current.set(window.location.pathname, window.scrollY);

      // A section on the page we are already on: go there now, even if the address won't change
      if (url.pathname === window.location.pathname && url.hash) {
        const hash = url.hash;
        wanted.current = null;
        setTimeout(() => {
          const top = sectionTop(hash);
          if (top !== null) jumpTo(top);
        });
      }
    };

    const onClick = (e: MouseEvent) => {
      // The router has usually cancelled the click already; that is expected, so it isn't checked
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      // "Back to work" names the project it is coming back from (see lib/landing.ts)
      const project = link.getAttribute(WORK_RETURN_ATTR);
      if (project) rememberProject(project);
      heading(link.href);
    };
    const onNavigate = (e: Event) => heading((e as CustomEvent<string>).detail);

    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onClick);
    window.addEventListener(NAVIGATE_EVENT, onNavigate);
    return () => {
      window.removeEventListener(NAVIGATE_EVENT, onNavigate);
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // A new page starts at its top, or at the section the link named. It runs before the browser
  // paints the new page, so nothing is ever shown part-way down.
  useLayoutEffect(() => {
    if (settled.current === pathname) return;
    settled.current = pathname;

    // Back or Forward: go to where this page was left, not to its top or to a section it names
    if (restoring.current) {
      restoring.current = false;
      const top = leftAt.current.get(pathname);
      if (top === undefined) return;
      jumpTo(top);
      // The router makes its own jump after this; ours has to be the last word
      let frames = 3;
      let frame = requestAnimationFrame(function again() {
        jumpTo(top);
        if (--frames > 0) frame = requestAnimationFrame(again);
      });
      return () => cancelAnimationFrame(frame);
    }

    // The page itself can ask for a particular landing (Selected Work does, to come back to the
    // project you were reading); otherwise it is the section the link named, or the top
    const asked = takeLanding();
    const land = () => {
      const hash = wanted.current ?? window.location.hash;
      const top = asked ?? (hash ? sectionTop(hash) : 0);
      jumpTo(top ?? 0);
    };
    land();
    // Once more after layout has settled, in case images or the deck changed the page's height
    const frame = requestAnimationFrame(() => {
      land();
      wanted.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return <>{children}</>;
}
