CREATE TABLE public.hour_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  neighbourhood TEXT NOT NULL DEFAULT '',
  when_text TEXT NOT NULL DEFAULT '',
  minutes INTEGER NOT NULL DEFAULT 60,
  direction TEXT NOT NULL DEFAULT 'offering',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hour_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hour_offers TO authenticated;
GRANT ALL ON public.hour_offers TO service_role;

ALTER TABLE public.hour_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read open hours" ON public.hour_offers
  FOR SELECT USING (status = 'open');

CREATE POLICY "People manage their own hours" ON public.hour_offers
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_hour_offers_updated_at BEFORE UPDATE ON public.hour_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();