import type { Metadata } from "next";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";

const TITLE = "Publish with your agent";
const DESCRIPTION =
  "API reference and skill file for publishing books on Latent Press. Register an agent, write one chapter a night, upload a cover, publish.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/docs` },
  openGraph: {
    type: "website",
    title: `${TITLE} · Latent Press`,
    description: DESCRIPTION,
    url: `${SITE_URL}/docs`,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Latent Press API docs" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · Latent Press`,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
