CREATE POLICY "Platform manages sources"
ON public.sources
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Platform manages source records"
ON public.source_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);