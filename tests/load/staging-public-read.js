// Low-intensity, public GET-only load smoke test. This is not a capacity test.
import http from "k6/http";
import { check, sleep } from "k6";

const rawBaseUrl = (__ENV.LOAD_TEST_BASE_URL || "").trim();
const targetEnvironment = (__ENV.LOAD_TEST_ENV || "").trim().toLowerCase();
const explicitlyApproved = (__ENV.LOAD_TEST_APPROVED || "") === "YES_I_APPROVE_STAGING_LOAD";

function stop(message) {
  throw new Error(`[load-test safety stop] ${message}`);
}

if (!explicitlyApproved) {
  stop("set LOAD_TEST_APPROVED=YES_I_APPROVE_STAGING_LOAD only after approving the target.");
}
if (!rawBaseUrl) {
  stop("LOAD_TEST_BASE_URL is required; no default target is provided.");
}
if (!["staging", "local"].includes(targetEnvironment)) {
  stop("LOAD_TEST_ENV must be exactly 'staging' or 'local'.");
}

let parsedBaseUrl;
try {
  parsedBaseUrl = new URL(rawBaseUrl);
} catch {
  stop("LOAD_TEST_BASE_URL must be a valid absolute URL.");
}

if (parsedBaseUrl.username || parsedBaseUrl.password) {
  stop("credentials in LOAD_TEST_BASE_URL are not permitted.");
}
if (parsedBaseUrl.search || parsedBaseUrl.hash) {
  stop("use an origin only; query strings and fragments are not permitted.");
}
if (parsedBaseUrl.pathname !== "/" && parsedBaseUrl.pathname !== "") {
  stop("use the origin only; the test owns its request paths.");
}

const hostname = parsedBaseUrl.hostname.toLowerCase().replace(/\.$/, "");
const knownProductionHosts = new Set(["life-lived-network.lovable.app"]);

if (knownProductionHosts.has(hostname)) {
  stop("the known production hostname is blocked.");
}

const isLocalHost = ["localhost", "127.0.0.1"].includes(hostname);
if (targetEnvironment === "local") {
  if (!isLocalHost) {
    stop("local mode only permits localhost or 127.0.0.1.");
  }
} else {
  if (isLocalHost || parsedBaseUrl.protocol !== "https:") {
    stop("staging mode requires HTTPS on a non-local hostname.");
  }
  if (
    !/(^|[.-])(staging|stage|preview|test|testing|qa|perf|performance|load)([.-]|$)/i.test(hostname)
  ) {
    stop("staging hostname must contain a staging/preview/test/QA/performance label.");
  }
}

const BASE_URL = parsedBaseUrl.origin;

export const options = {
  scenarios: {
    public_read_smoke: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "20s", target: 1 },
        { duration: "20s", target: 3 },
        { duration: "30s", target: 5 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500"],
    checks: ["rate>0.99"],
  },
  discardResponseBodies: true,
};

const publicRoutes = [
  { path: "/", contentType: /text\/html/i },
  { path: "/robots.txt", contentType: /text\/plain/i },
  { path: "/sitemap.xml", contentType: /(?:application|text)\/(?:xml|xhtml\+xml)/i },
];

export default function () {
  const route = publicRoutes[(__VU + __ITER) % publicRoutes.length];
  const response = http.get(`${BASE_URL}${route.path}`, {
    timeout: "10s",
    // Do not follow redirects: a staging alias must not relay load to another host.
    redirects: 0,
    tags: { route: route.path },
  });

  check(response, {
    [`${route.path} returns HTTP 2xx`]: (res) => res.status >= 200 && res.status < 300,
    [`${route.path} has expected content type`]: (res) =>
      route.contentType.test(String(res.headers["Content-Type"] || "")),
  });

  sleep(1);
}
