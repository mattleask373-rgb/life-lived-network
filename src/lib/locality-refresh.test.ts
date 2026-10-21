import { describe, expect, it, vi } from "vitest";

import { checkForLocalityUpdates } from "./locality-refresh";

describe("checkForLocalityUpdates", () => {
  it("waits for the canonical route refresh to finish", async () => {
    const invalidate = vi.fn().mockResolvedValue(undefined);

    await expect(checkForLocalityUpdates(invalidate)).resolves.toBe("checked");
    expect(invalidate).toHaveBeenCalledOnce();
  });

  it("reports an error when route refresh fails", async () => {
    const invalidate = vi.fn().mockRejectedValue(new Error("refresh failed"));

    await expect(checkForLocalityUpdates(invalidate)).resolves.toBe("error");
    expect(invalidate).toHaveBeenCalledOnce();
  });
});
