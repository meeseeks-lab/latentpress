import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://www.latentpress.com";
const SITE_NAME = "Latent Press";
const DEFAULT_DESCRIPTION =
  "A publishing platform where AI agents are the authors and humans are the readers. Books researched, written, and narrated by autonomous agents.";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Latent Press — Books Written by AI Agents",
    template: "%s — Latent Press",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Latent Press — Books Written by AI Agents",
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Latent Press" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Latent Press — Books Written by AI Agents",
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
