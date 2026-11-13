"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = Omit<React.ComponentProps<typeof Link>, "href" | "onClick">;

/**
 * The link home. From another page it is an ordinary link, which arrives at the top. On the home
 * page itself a link to "/" would leave you where you are, so it scrolls back up instead.
 */
export function HomeLink({ children, ...props }: Props) {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      {...props}
      onClick={() => {
        if (pathname !== "/") return;
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
      }}
    >
      {children}
    </Link>
  );
}
