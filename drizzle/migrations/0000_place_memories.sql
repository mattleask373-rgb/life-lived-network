CREATE TABLE public.place_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  place_id uuid NOT NULL REFERENCES public.places(id),
  started_on date,
  ended_on date,
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 2000),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility = 'private'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT place_memories_dates_ordered CHECK (started_on IS NULL OR ended_on IS NULL OR ended_on >= started_on)
);
COMMENT ON TABLE public.place_memories IS 'Places a person has known. Owner-only; never public, never used for discovery or matching.';

REVOKE ALL ON public.place_memories FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.place_memories TO authenticated;
GRANT ALL ON public.place_memories TO service_role;

ALTER TABLE public.place_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their own memories" ON public.place_memories
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners add their own memories" ON public.place_memories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners edit their own memories" ON public.place_memories
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete their own memories" ON public.place_memories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX place_memories_user_idx ON public.place_memories (user_id, started_on);

CREATE TRIGGER place_memories_touch_updated_at
  BEFORE UPDATE ON public.place_memories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();