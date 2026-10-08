import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  jsonLdScriptContent,
  organizationJsonLd,
  websiteJsonLd,
} from "./seo-jsonld";
import { SITE_ORIGIN } from "./seo";

describe("truthful JSON-LD", () => {
  it("emits WebSite with origin", () => {
    const node = websiteJsonLd({ description: "Local possibility" });
    expect(node["@type"]).toBe("WebSite");
    expect(node.url).toBe(SITE_ORIGIN);
    expect(node.description).toBe("Local possibility");
  });

  it("emits Organization without inventing a logo", () => {
    const node = organizationJsonLd();
    expect(node["@type"]).toBe("Organization");
    expect(node.logo).toBeUndefined();
  });

  it("rejects breadcrumb crumbs with empty names", () => {
    expect(breadcrumbJsonLd([{ name: "", path: "/" }])).toBeNull();
  });

  it("builds BreadcrumbList with absolute items", () => {
    const node = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Journey", path: "/journey" },
    ]);
    expect(node?.["@type"]).toBe("BreadcrumbList");
    const items = node?.itemListElement as Array<Record<string, unknown>>;
    expect(items[1].item).toBe(`${SITE_ORIGIN}/journey`);
  });

  it("serializes a single node without array wrapper", () => {
    const s = jsonLdScriptContent([websiteJsonLd()]);
    expect(s.startsWith("{")).toBe(true);
  });
});
