/**
 * Locality public SEO helpers — truthful meta + JSON-LD only.
 * Complements public locality API (PR #110) without inventing ratings or inventory.
 */

import { publicPage, type PageMeta } from "./seo";
import {
  breadcrumbJsonLd,
  jsonLdScriptContent,
  websiteJsonLd,
  type JsonLd,
} from "./seo-jsonld";

export type LocalitySeoInput = Readonly<{
  name: string;
  countrySegment: string;
  slug: string;
  blurb?: string;
  /** Real non-demonstration entry count from canonical discovery. */
  realEntryCount: number;
  indexable: boolean;
}>;

export function localityPageMeta(input: LocalitySeoInput): ReturnType<typeof publicPage> {
  const path = `/${input.countrySegment}/${input.slug}`;
  const description =
    input.blurb?.trim() ||
    (input.realEntryCount > 0
      ? `${input.name}: ${input.realEntryCount} recorded local possibilities.`
      : `${input.name}: locality on Life Lived Network.`);

  const meta: PageMeta = {
    path,
    title: `${input.name} · Life Lived Network`,
    description: description.slice(0, 160),
  };

  const head = publicPage(meta);
  // Thin or demo-only localities should not be indexed.
  if (!input.indexable) {
    const robots = head.meta.find((m) => m.name === "robots");
    if (robots) robots.content = "noindex, follow";
    else head.meta.push({ name: "robots", content: "noindex, follow" });
  }
  return head;
}

export function localityJsonLd(input: LocalitySeoInput): string {
  const path = `/${input.countrySegment}/${input.slug}`;
  const nodes: JsonLd[] = [websiteJsonLd()];
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: input.name, path },
  ]);
  if (crumbs) nodes.push(crumbs);
  // Place node only with name + url — no invented geo/rating/opening hours.
  nodes.push({
    "@context": "https://schema.org",
    "@type": "Place",
    name: input.name,
    url: `https://life-lived-network.lovable.app${path}`,
  });
  return jsonLdScriptContent(nodes);
}
