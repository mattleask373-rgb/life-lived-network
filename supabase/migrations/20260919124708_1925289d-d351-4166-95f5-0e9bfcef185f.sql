-- Provenance a visitor legitimately needs: who it came from, the link, the state.
-- Nothing more: raw payload fingerprints and internal source identifiers stay in.
REVOKE SELECT ON public.source_records FROM anon, authenticated;
GRANT SELECT (id, source_id, listing_id, source_url, source_state, last_seen_at, source_updated_at)
  ON public.source_records TO anon, authenticated;