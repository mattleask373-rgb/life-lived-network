import { describe, expect, it } from "vitest";

import { SITE_ORIGIN } from "./seo";
import { breadcrumbListJsonLd, jsonLdScript } from "./structured-data";

describe("breadcrumb JSON-LD", () => {
  it("uses only supplied visible breadcrumbs and canonical absolute URLs", () => {
    const data = breadcrumbListJsonLd([
      { name: "Real World Atlas", path: "/" },
      { name: "Birmingham", path: "/gb/birmingham?utm_source=test" },
      { name: "Gardening", path: "/gb/birmingham/gardening#details" },
    ]);
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data["itemListElement"]).toEqual([
      { "@type": "ListItem", position: 1, name: "Real World Atlas", item: `${SITE_ORIGIN}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Birmingham",
        item: `${SITE_ORIGIN}/gb/birmingham`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Gardening",
        item: `${SITE_ORIGIN}/gb/birmingham/gardening`,
      },
    ]);
  });

  it("escapes HTML-significant and script-closing characters without changing JSON meaning", () => {
    const data = {
      "@type": "Thing",
      name: "</script><script>alert(1)</script> & more\u2028text",
    };
    const script = jsonLdScript(data);
    expect(script.type).toBe("application/ld+json");
    expect(script.children).not.toContain("</script>");
    expect(script.children).toContain("\\u003c/script\\u003e");
    expect(JSON.parse(script.children)).toEqual(data);
  });
});
