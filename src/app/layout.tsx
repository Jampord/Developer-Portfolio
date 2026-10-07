import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Navbar";
import { SmoothScroll } from "@/components/SmoothScroll";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "John Ford Actub — Front-End Developer",
  description: "Portfolio of John Ford Actub, a front-end developer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${geist.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SmoothScroll>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-background"
            >
              Skip to content
            </a>
            <div className="min-h-screen bg-frame p-3 md:p-6">
              <div className="min-h-[calc(100vh-1.5rem)] rounded-4xl bg-background md:min-h-[calc(100vh-3rem)]">
                <Nav />
                <main id="main">{children}</main>
                <Footer />
              </div>
            </div>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
