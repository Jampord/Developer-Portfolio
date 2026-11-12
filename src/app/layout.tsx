import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
import { site } from "@/lib/site";
import { siteUrl } from "@/lib/url";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DeferredCommandPalette, DeferredCursor } from "@/components/Deferred";
import { SkyClock } from "@/components/SkyClock";
import { themeScript } from "@/lib/theme-script";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const defaultTitle = `${site.name} — ${site.title}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: defaultTitle, template: `%s — ${site.name}` },
  description: site.tagline,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: defaultTitle,
    description: site.tagline,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: site.tagline,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${geist.variable} ${jetbrains.variable}`}
    >
      <head>
        {/* In clock mode the Pampanga clock picks the theme before first paint (and before next-themes reads it) */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SkyClock />
          <DeferredCursor />
          <DeferredCommandPalette />
          {/* Each route group's layout adds its own shell: (site) the portfolio frame, (lab) a bare page */}
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
