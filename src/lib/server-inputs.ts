/**
 * Input shapes for server actions that previously trusted the caller's types.
 * Validation rejects malformed requests early; it does not replace the
 * row-level and role checks done on the server and in the database.
 */
import { z } from "zod";

export const moveConnectionInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["sent", "accepted", "declined", "withdrawn"]),
});

export const needIdInput = z.object({ needId: z.string().uuid() });

export const refreshSourceInput = z.object({
  sourceId: z.string().uuid(),
  placeSlug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
  days: z.number().int().min(1).max(60).optional(),
  force: z.boolean().optional(),
});
