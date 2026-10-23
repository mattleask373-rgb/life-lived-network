import { writeFile } from "node:fs/promises";

import { renderSeoStaticAssets, validatePublicSiteOrigin } from "../src/lib/seo-static-assets";

const origin = validatePublicSiteOrigin(process.env["VITE_SITE_ORIGIN"]);
const assets = renderSeoStaticAssets(origin);

await Promise.all([
  writeFile(new URL("../public/robots.txt", import.meta.url), assets.robots, "utf8"),
  writeFile(new URL("../public/sitemap.xml", import.meta.url), assets.sitemap, "utf8"),
]);

console.log("Generated static robots.txt and sitemap.xml for " + origin);
