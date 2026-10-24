export type LocalPageIndexability = "DRAFT" | "NOINDEX" | "READY_FOR_REVIEW" | "INDEXABLE" | "STALE" | "DEINDEX_REQUIRED";

export interface LocalPageEvidence {
  realPossibilityCount: number;
  realNeedCount: number;
  realCapabilityCount: number;
  realCommunityCount: number;
  hasUsefulGuideData: boolean;
  hasFreshData: boolean;
  hasMeaningfulAction: boolean;
  isCanonicalRoute: boolean;
}

export interface LocalPageQuality { state: LocalPageIndexability; reasons: string[]; }

/** Evidence gate for local discovery pages; this is not a ranking formula. */
export function localPageQuality(e: LocalPageEvidence): LocalPageQuality {
  const reasons: string[] = [];
  const count = e.realPossibilityCount + e.realNeedCount + e.realCapabilityCount + e.realCommunityCount;
  if (!e.isCanonicalRoute) reasons.push("route is not canonical");
  if (!e.hasFreshData) reasons.push("fresh local evidence is not established");
  if (!e.hasMeaningfulAction) reasons.push("no meaningful user action is available");
  if (count === 0 && !e.hasUsefulGuideData) reasons.push("no real local evidence or useful guide data");
  if (!e.isCanonicalRoute || (count === 0 && !e.hasUsefulGuideData)) return { state: "NOINDEX", reasons };
  if (!e.hasFreshData || !e.hasMeaningfulAction) return { state: "READY_FOR_REVIEW", reasons };
  return { state: "INDEXABLE", reasons };
}
