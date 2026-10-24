-- Distinguish a source-backed free price from an unknown/missing price.
-- Default TRUE preserves existing first-party listing semantics; source refresh
-- explicitly marks unknown event prices as FALSE in the dependent application PR.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS price_known boolean NOT NULL DEFAULT true;

-- Before this field existed, the importer converted an absent source price to
-- cost=0 and an absent currency to GBP. We cannot recover whether those older
-- values were actually free, so fail closed and let the next approved refresh
-- restore a source-backed known price when evidence exists.
UPDATE public.listings
SET price_known = false,
    currency = 'XXX'
WHERE origin = 'source'
  AND cost = 0
  AND currency = 'GBP';
