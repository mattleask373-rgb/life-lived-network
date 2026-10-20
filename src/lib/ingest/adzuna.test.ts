import { describe, expect, it } from "vitest";

import {
  ADZUNA_API_ROOT,
  ADZUNA_SOURCE_KEY,
  adzunaSearchRequest,
  parseAdzunaSearchPayload,
} from "./adzuna";

function payload(results: unknown[]) {
  return {
    count: results.length,
    results,
  };
}

const GOOD_JOB = {
  id: "123456789",
  title: "Gardener",
  description: "Maintain gardens and outdoor spaces.",
  redirect_url: "https://www.adzuna.co.uk/jobs/details/123456789",
  created: "2026-10-18T10:30:00Z",
  company: { display_name: "Local Employer" },
  location: {
    display_name: "Example locality",
    area: ["United Kingdom", "Example locality"],
    latitude: 51.5,
    longitude: -0.12,
  },
  category: { label: "Trade & Construction Jobs", tag: "trade-construction-jobs" },
  contract_type: "permanent",
  contract_time: "part_time",
  salary_min: 20000,
  salary_max: 24000,
  salary_is_predicted: 0,
};

describe("Adzuna request construction", () => {
  it("builds a country-scoped search without putting credentials into the request", () => {
    const request = adzunaSearchRequest({
      market: "gb",
      what: "gardener",
      where: "Newtown",
      page: 2,
      resultsPerPage: 20,
    });

    expect(request.path).toBe("/jobs/gb/search/2");
    expect(new URL(ADZUNA_API_ROOT + request.path).origin).toBe("https://api.adzuna.com");
    expect(request.params.get("what")).toBe("gardener");
    expect(request.params.get("where")).toBe("Newtown");
    expect(request.params.get("results_per_page")).toBe("20");
    expect(request.params.get("content-type")).toBe("application/json");
    expect(request.params.has("app_id")).toBe(false);
    expect(request.params.has("app_key")).toBe(false);
    expect(request.params.has("apikey")).toBe(false);
  });

  it("supports configured markets without hard-coding a locality", () => {
    for (const market of ["gb", "us", "au", "jp", "th", "np", "ph"]) {
      expect(adzunaSearchRequest({ market, what: "local service" }).path).toBe(
        `/jobs/${market}/search/1`,
      );
    }

    expect(adzunaSearchRequest({ market: "au", what: "builder", where: "Byron Bay" }).params.get("where"))
      .toBe("Byron Bay");
  });

  it("rejects an unconfigured market or unsafe/unbounded query settings", () => {
    expect(() => adzunaSearchRequest({ market: "../", what: "gardener" })).toThrow();
    expect(() => adzunaSearchRequest({ market: "gb", what: "  " })).toThrow();
    expect(() => adzunaSearchRequest({ market: "gb", what: "gardener", page: 0 })).toThrow();
    expect(
      () => adzunaSearchRequest({ market: "gb", what: "gardener", resultsPerPage: 500 }),
    ).toThrow();
  });

  it("sanitises provider-controlled query text before URL encoding it", () => {
    const request = adzunaSearchRequest({
      market: "gb",
      what: "<script>alert(1)</script>gardener",
      where: "Example <b>Town</b>",
    });
    expect(request.params.get("what")).toBe("gardener");
    expect(request.params.get("where")).toBe("Example Town");
  });
});

describe("Adzuna response parsing", () => {
  it("normalises source identity, safe text, links, location evidence and timestamps", () => {
    const parsed = parseAdzunaSearchPayload(payload([GOOD_JOB]), "GB");
    expect(parsed.skipped).toEqual([]);
    expect(parsed.jobs).toHaveLength(1);

    const job = parsed.jobs[0]!;
    expect(job.providerKey).toBe(ADZUNA_SOURCE_KEY);
    expect(job.externalId).toBe("123456789");
    expect(job.title).toBe("Gardener");
    expect(job.summary).toBe("Maintain gardens and outdoor spaces.");
    expect(job.employerName).toBe("Local Employer");
    expect(job.countryCode).toBe("GB");
    expect(job.locationText).toBe("Example locality");
    expect(job.latitude).toBe(51.5);
    expect(job.longitude).toBe(-0.12);
    expect(job.categoryTag).toBe("trade-construction-jobs");
    expect(job.contractType).toBe("permanent");
    expect(job.contractTime).toBe("part_time");
    expect(job.sourceUrl).toBe("https://www.adzuna.co.uk/jobs/details/123456789");
    expect(job.sourceCreatedAt).toBe("2026-10-18T10:30:00.000Z");
    expect(job.reviewRequired).toBe(true);
  });

  it("does not convert missing, predicted or non-predicted salary into public pay", () => {
    const statedFlag = parseAdzunaSearchPayload(payload([GOOD_JOB]), "GB").jobs[0]!;
    expect(statedFlag.compensationEvidence).toEqual({
      minimum: 20000,
      maximum: 24000,
      salaryIsPredicted: false,
      currency: null,
      basis: null,
    });

    const predicted = parseAdzunaSearchPayload(
      payload([{ ...GOOD_JOB, salary_is_predicted: 1 }]),
      "GB",
    ).jobs[0]!;
    expect(predicted.compensationEvidence.salaryIsPredicted).toBe(true);
    expect(predicted.compensationEvidence.currency).toBeNull();
    expect(predicted.compensationEvidence.basis).toBeNull();

    const noSalary = parseAdzunaSearchPayload(
      payload([{ ...GOOD_JOB, salary_min: undefined, salary_max: undefined }]),
      "GB",
    ).jobs[0]!;
    expect(noSalary.compensationEvidence).toEqual({
      minimum: null,
      maximum: null,
      salaryIsPredicted: null,
      currency: null,
      basis: null,
    });
  });

  it("skips records with missing identity/title or unsafe source URLs", () => {
    const parsed = parseAdzunaSearchPayload(
      payload([
        { ...GOOD_JOB, id: "" },
        { ...GOOD_JOB, title: "" },
        { ...GOOD_JOB, redirect_url: "javascript:alert(1)" },
      ]),
      "GB",
    );

    expect(parsed.jobs).toEqual([]);
    expect(parsed.skipped).toHaveLength(3);
  });

  it("sanitises HTML and rejects malformed coordinates as a pair", () => {
    const parsed = parseAdzunaSearchPayload(
      payload([
        {
          ...GOOD_JOB,
          description: "<script>steal()</script><b>Outdoor</b> work",
          location: {
            display_name: "<b>Example locality</b>",
            latitude: 999,
            longitude: -0.12,
          },
        },
      ]),
      "AU",
    );
    expect(parsed.jobs[0]!.summary).toBe("Outdoor work");
    expect(parsed.jobs[0]!.locationText).toBe("Example locality");
    expect(parsed.jobs[0]!.latitude).toBeNull();
    expect(parsed.jobs[0]!.longitude).toBeNull();
  });

  it("does not guess invalid salary ranges or country codes", () => {
    const parsed = parseAdzunaSearchPayload(
      payload([{ ...GOOD_JOB, salary_min: 30000, salary_max: 20000 }]),
      "AU",
    );
    expect(parsed.jobs[0]!.compensationEvidence.minimum).toBeNull();
    expect(parsed.jobs[0]!.compensationEvidence.maximum).toBeNull();

    expect(parseAdzunaSearchPayload(payload([GOOD_JOB]), "AUS")).toEqual({
      jobs: [],
      skipped: ["Configured countryCode must be a two-letter ISO code"],
    });
  });

  it("distinguishes provider errors and malformed payloads from an empty result set", () => {
    expect(parseAdzunaSearchPayload({ error: "Invalid API key" }, "GB").skipped[0]).toContain(
      "Invalid API key",
    );
    expect(parseAdzunaSearchPayload(null, "GB").skipped).toContain(
      "Provider response was not an object",
    );
    expect(parseAdzunaSearchPayload({ count: 0 }, "GB").skipped).toContain(
      "Provider response had no results array",
    );
    expect(parseAdzunaSearchPayload(payload([]), "GB")).toEqual({ jobs: [], skipped: [] });
  });

  it("never turns a parsed result into approved/public inventory", () => {
    const [job] = parseAdzunaSearchPayload(payload([GOOD_JOB]), "GB").jobs;
    expect(job?.reviewRequired).toBe(true);
    expect(job?.compensationEvidence.currency).toBeNull();
    expect(job?.compensationEvidence.basis).toBeNull();
  });
});
