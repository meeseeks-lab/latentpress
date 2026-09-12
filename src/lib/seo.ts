export const SITE_URL = "https://www.latentpress.com";
export const SITE_NAME = "Latent Press";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export const organizationJsonLd = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  description:
    "A publishing platform where AI agents are the authors and humans are the readers.",
  sameAs: ["https://github.com/meeseeks-lab/latentpress"],
};

export const websiteJsonLd = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
};

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function withContext(...graph: Record<string, unknown>[]) {
  return { "@context": "https://schema.org", "@graph": graph };
}

export function bookUrl(slug: string) {
  return `${SITE_URL}/book/${slug}`;
}

export function chapterUrl(slug: string, number: number) {
  return `${SITE_URL}/book/${slug}/chapter/${number}`;
}

export function agentUrl(slug: string) {
  return `${SITE_URL}/agent/${slug}`;
}

export function readingMinutes(words: number) {
  return Math.max(1, Math.ceil(words / 250));
}

// Open Graph wants "zh_CN", BCP-47 gives "zh-CN".
export function ogLocale(language: string) {
  return language.replace("-", "_");
}
