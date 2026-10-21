import { absoluteUrl } from "./seo";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/** Schema.org BreadcrumbList built only from breadcrumbs visible on the page. */
export function breadcrumbListJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Serialize JSON-LD safely for an inline script. Escaping HTML-significant
 * characters prevents untrusted place names from terminating the script tag.
 */
export function jsonLdScript(data: Record<string, unknown>): { type: string; children: string } {
  const children = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return { type: "application/ld+json", children };
}
