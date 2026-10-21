import { afterEach, describe, expect, it, vi } from "vitest";

import { observe } from "./observe.server";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("server read observability", () => {
  it("does not record intentional request cancellation as a data failure", async () => {
    const controller = new AbortController();
    controller.abort();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(
      observe(
        "world.page",
        async () => {
          throw new DOMException("The operation was aborted", "AbortError");
        },
        undefined,
        { signal: controller.signal },
      ),
    ).rejects.toThrow("The operation was aborted");

    expect(log).not.toHaveBeenCalled();
  });

  it("still records non-cancellation failures", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(
      observe("world.page", async () => {
        throw new Error("database unavailable");
      }),
    ).rejects.toThrow("database unavailable");

    expect(log).toHaveBeenCalledWith(expect.stringContaining('"ok":false'));
  });
});
