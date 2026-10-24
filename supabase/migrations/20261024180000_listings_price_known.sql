-- Distinguish a source-backed free price from an unknown/missing price.
-- Default TRUE preserves existing first-party listing semantics; source refresh
-- explicitly marks unknown event prices as FALSE in the dependent application PR.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS price_known boolean NOT NULL DEFAULT true;

-- Before this field existed, the importer converted an absent source amount to
-- cost=0; currency could also have been defaulted or partially present. We
-- cannot distinguish those records from genuinely free events, so conservatively
-- mark all old source-origin zeros unknown. A future approved refresh restores a
-- source-backed free price only when the source explicitly supplies zero + currency.
UPDATE public.listings
SET price_known = false,
    currency = 'XXX'
WHERE origin = 'source'
  AND cost = 0
  AND price_known = true;
