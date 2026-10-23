-- The quota function is SECURITY DEFINER and references its application
-- objects with explicit schemas. Keep its effective lookup path inside
-- pg_catalog so a writable application schema is never needed for name lookup.
ALTER FUNCTION public.consume_ai_draft_quota()
  SET search_path = pg_catalog;
