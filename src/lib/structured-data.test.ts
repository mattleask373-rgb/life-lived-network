import { describe, expect, it } from "vitest";

import { breadcrumbListSchema, safeJsonLd } from "./structured-data";

describe("BreadcrumbList structured data", () => {
  it("uses canonical absolute item URLs and sequential positions", () => {
    const schema = breadcrumbListSchema([
      { name: "Real World Atlas", path: "/" },
      { name: "Example Place", path: "/gb/example-place?utm_source=test" },
    ]);

    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Real World Atlas",
        item: expect.stringMatching(/\/$/),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Example Place",
        item: expect.stringMatching(/\/gb\/example-place$/),
      },
    ]);
  });

  it("drops blank crumbs and escapes script-closing text before embedding", () => {
    const schema = breadcrumbListSchema([
      { name: " ", path: "/" },
      { name: "Example </script><script>alert(1)</script>", path: "/gb/example" },
    ]);
    const embedded = safeJsonLd(schema);

    expect(schema.itemListElement).toHaveLength(1);
    expect(embedded).not.toContain("</script>");
    expect(embedded).toContain("\\u003c/script>");
  });
});
