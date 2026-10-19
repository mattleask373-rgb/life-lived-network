import { absoluteUrl } from "./seo";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/** Visible breadcrumb facts, converted to a canonical Schema.org BreadcrumbList. */
export function breadcrumbListSchema(items: BreadcrumbItem[]) {
  const validItems = items.filter((item) => item.name.trim() && item.path.trim());
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: validItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Safely embeds user/source text in an inline JSON-LD script element. */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
