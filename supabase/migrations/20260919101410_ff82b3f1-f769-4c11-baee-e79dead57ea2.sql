CREATE TABLE public.connection_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  need_id uuid NOT NULL REFERENCES public.needs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'offer',
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'sent',
  context_title text NOT NULL DEFAULT '',
  context_place text NOT NULL DEFAULT '',
  context_when text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connection_requests_direction_check CHECK (direction IN ('offer','invite')),
  CONSTRAINT connection_requests_status_check CHECK (status IN ('sent','accepted','declined','withdrawn')),
  CONSTRAINT connection_requests_not_self CHECK (sender_id <> recipient_id),
  CONSTRAINT connection_requests_once UNIQUE (need_id, sender_id, recipient_id)
);

GRANT SELECT, INSERT, UPDATE ON public.connection_requests TO authenticated;
GRANT ALL ON public.connection_requests TO service_role;

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only the two people involved can read a request"
  ON public.connection_requests FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "People can send their own requests"
  ON public.connection_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Either person can move a request along"
  ON public.connection_requests FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE TRIGGER connection_requests_touch
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX connection_requests_recipient_idx ON public.connection_requests (recipient_id, created_at DESC);
CREATE INDEX connection_requests_sender_idx ON public.connection_requests (sender_id, created_at DESC);
CREATE INDEX connection_requests_need_idx ON public.connection_requests (need_id);

CREATE TABLE public.connection_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.connection_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.connection_messages TO authenticated;
GRANT ALL ON public.connection_messages TO service_role;

ALTER TABLE public.connection_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only the two people involved can read messages"
  ON public.connection_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.connection_requests r
    WHERE r.id = connection_messages.request_id
      AND (auth.uid() = r.sender_id OR auth.uid() = r.recipient_id)
  ));

CREATE POLICY "Only the two people involved can add a message"
  ON public.connection_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.connection_requests r
    WHERE r.id = connection_messages.request_id
      AND (auth.uid() = r.sender_id OR auth.uid() = r.recipient_id)
  ));

CREATE TRIGGER connection_messages_touch
  BEFORE UPDATE ON public.connection_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX connection_messages_request_idx ON public.connection_messages (request_id, created_at);