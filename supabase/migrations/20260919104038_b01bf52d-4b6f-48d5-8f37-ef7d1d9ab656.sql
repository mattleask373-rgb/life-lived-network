DROP POLICY "Public can view photos for open listings" ON public.listing_photos;
CREATE POLICY "Public can view photos for published listings" ON public.listing_photos FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.status = 'published'));

DROP POLICY "Capabilities of discoverable people are readable" ON public.person_capabilities;
CREATE POLICY "Visible capabilities of discoverable people are readable" ON public.person_capabilities FOR SELECT TO anon, authenticated USING (visibility <> 'private' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.discoverable = true));

DROP POLICY "Service areas of discoverable people are readable" ON public.service_areas;
CREATE POLICY "Visible service areas of discoverable people are readable" ON public.service_areas FOR SELECT TO anon, authenticated USING (visibility <> 'private' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.discoverable = true));

DROP POLICY "Availability of discoverable people is readable" ON public.availability_windows;
CREATE POLICY "Visible current availability of discoverable people is readable" ON public.availability_windows FOR SELECT TO anon, authenticated USING (visibility <> 'private' AND (expires_at IS NULL OR expires_at >= now()) AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.discoverable = true));

DROP POLICY "People can send their own requests" ON public.connection_requests;
CREATE POLICY "People can send unblocked requests" ON public.connection_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND NOT private.people_are_blocked(sender_id, recipient_id));
DROP POLICY "Only the two people involved can read a request" ON public.connection_requests;
CREATE POLICY "Unblocked participants can read a request" ON public.connection_requests FOR SELECT TO authenticated USING (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)) AND NOT private.people_are_blocked(sender_id, recipient_id));
DROP POLICY "Either person can move a request along" ON public.connection_requests;
CREATE POLICY "Unblocked participants can move a request" ON public.connection_requests FOR UPDATE TO authenticated USING (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)) AND NOT private.people_are_blocked(sender_id, recipient_id)) WITH CHECK (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)) AND NOT private.people_are_blocked(sender_id, recipient_id));

DROP POLICY "Only the two people involved can read messages" ON public.connection_messages;
CREATE POLICY "Unblocked participants can read messages" ON public.connection_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.connection_requests r WHERE r.id = request_id AND ((auth.uid() = r.sender_id) OR (auth.uid() = r.recipient_id)) AND NOT private.people_are_blocked(r.sender_id, r.recipient_id)));
DROP POLICY "Only the two people involved can add a message" ON public.connection_messages;
CREATE POLICY "Unblocked participants can add messages" ON public.connection_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.connection_requests r WHERE r.id = request_id AND ((auth.uid() = r.sender_id) OR (auth.uid() = r.recipient_id)) AND NOT private.people_are_blocked(r.sender_id, r.recipient_id)));