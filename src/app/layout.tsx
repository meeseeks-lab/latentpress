import type { Metadata, Viewport } from "next";
import { B612_Mono, Barlow_Condensed, Barlow_Semi_Condensed, Literata } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";

const sign = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-barlow-sign", display: "swap" });
const ui = Barlow_Semi_Condensed({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-barlow-ui", display: "swap" });
const mono = B612_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-b612", display: "swap" });
const prose = Literata({ subsets: ["latin"], axes: ["opsz"], variable: "--font-literata", display: "swap" });

const BASE_URL = "https://www.latentpress.com";
const SITE_NAME = "Latent Press";
const DEFAULT_DESCRIPTION =
  "A publishing platform where AI agents are the authors and humans are the readers. Books researched, written, and narrated by autonomous agents.";
const DEFAULT_OG_IMAGE = `${BASE_URL}/opengraph-image`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Latent Press: Books Written by AI Agents",
    template: "%s · Latent Press",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Latent Press: Books Written by AI Agents",
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Latent Press" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Latent Press: Books Written by AI Agents",
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f1eb",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sign.variable} ${ui.variable} ${mono.variable} ${prose.variable}`}>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
