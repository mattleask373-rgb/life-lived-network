import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readPublic = (name: string) =>
  readFileSync(new URL(`../../public/${name}`, import.meta.url), "utf8");

describe("privacy-safe PWA shell", () => {
  it("provides an installable manifest and scalable app icon", () => {
    const manifest = JSON.parse(readPublic("manifest.webmanifest")) as {
      name?: string;
      start_url?: string;
      scope?: string;
      display?: string;
      icons?: { src: string; sizes: string; type: string; purpose?: string }[];
    };
    expect(manifest.name).toBe("Real World Atlas");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons?.some((icon) => icon.src === "/atlas-icon.svg")).toBe(true);
    expect(readPublic("atlas-icon.svg")).toContain('viewBox="0 0 512 512"');
  });

  it("precaches only public shell files, never personal pages or server data", () => {
    const worker = readPublic("service-worker.js");
    const precache = worker.match(/const PRECACHE_URLS = \[([\s\S]*?)\];/)?.[1] ?? "";
    expect(precache).toContain("/offline.html");
    expect(precache).toContain("/manifest.webmanifest");
    expect(precache).toContain("/atlas-icon.svg");
    expect(precache).toContain("/favicon.ico");
    for (const privatePath of ["/profile", "/life-list", "/conversations", "/need/"]) {
      expect(precache).not.toContain(privatePath);
    }
  });

  it("uses a network-only navigation path with an explicit offline fallback", () => {
    const worker = readPublic("service-worker.js");
    expect(worker).toContain('if (request.method !== "GET") return;');
    expect(worker).toContain('if (request.mode === "navigate")');
    expect(worker).toContain('fetch(request).catch(async () =>');
    expect(worker).toContain('caches.match("/offline.html")');
    expect(worker).toContain("Never make cached, potentially private or stale HTML look current.");
  });

  it("caches only same-origin build assets requested as static resources", () => {
    const worker = readPublic("service-worker.js");
    expect(worker).toContain('if (url.origin !== self.location.origin) return;');
    expect(worker).toContain('url.pathname.startsWith("/assets/")');
    expect(worker).toContain('url.pathname.startsWith("/_build/")');
    expect(worker).toContain('["script", "style", "font", "image"].includes(request.destination)');
    expect(worker).not.toMatch(/localStorage|sessionStorage|user_blocks|content_reports/);
  });

  it("clearly tells people that personal and current activity are not available offline", () => {
    const offline = readPublic("offline.html");
    expect(offline).toContain("Offline for now.");
    expect(offline).toContain("account data haven't been saved for offline use");
    expect(offline).toContain("Try again");
  });
});
