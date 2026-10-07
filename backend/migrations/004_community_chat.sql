-- Common community chat, public profile avatars, and private recorded voice storage.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'voice')),
    content TEXT,
    voice_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_chat_message_payload CHECK (
        (message_type = 'text' AND content IS NOT NULL AND length(btrim(content)) BETWEEN 1 AND 2000 AND voice_path IS NULL)
        OR
        (message_type = 'voice' AND content IS NULL AND voice_path IS NOT NULL AND length(voice_path) <= 512)
    )
);

CREATE INDEX IF NOT EXISTS ix_chat_messages_created_id
    ON public.chat_messages (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS ix_chat_messages_user_created
    ON public.chat_messages (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_message_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 500),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (message_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS ix_chat_message_reports_status_created
    ON public.chat_message_reports (status, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT ON public.chat_message_reports TO authenticated;

CREATE OR REPLACE FUNCTION public.is_milkmaatu_chat_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
$$;
REVOKE ALL ON FUNCTION public.is_milkmaatu_chat_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_milkmaatu_chat_admin() TO authenticated;

DROP POLICY IF EXISTS "Authenticated users read community chat" ON public.chat_messages;
CREATE POLICY "Authenticated users read community chat"
    ON public.chat_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users create their own chat messages" ON public.chat_messages;
CREATE POLICY "Users create their own chat messages"
    ON public.chat_messages FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND (
            (message_type = 'text' AND content IS NOT NULL AND voice_path IS NULL)
            OR (message_type = 'voice' AND content IS NULL AND voice_path LIKE auth.uid()::TEXT || '/%')
        )
    );

DROP POLICY IF EXISTS "Users delete their own chat messages" ON public.chat_messages;
CREATE POLICY "Users delete their own chat messages"
    ON public.chat_messages FOR DELETE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users report messages as themselves" ON public.chat_message_reports;
CREATE POLICY "Users report messages as themselves"
    ON public.chat_message_reports FOR INSERT TO authenticated
    WITH CHECK (
        reporter_id = auth.uid()
        AND reporter_id <> (SELECT m.user_id FROM public.chat_messages AS m WHERE m.id = message_id)
    );

DROP POLICY IF EXISTS "Admins read community chat reports" ON public.chat_message_reports;
CREATE POLICY "Admins read community chat reports"
    ON public.chat_message_reports FOR SELECT TO authenticated
    USING (public.is_milkmaatu_chat_admin());

CREATE OR REPLACE FUNCTION public.enforce_chat_message_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::TEXT, 0));
    IF EXISTS (
        SELECT 1
        FROM public.chat_messages AS prior
        WHERE prior.user_id = NEW.user_id
          AND prior.created_at > now() - interval '2 seconds'
    ) THEN
        RAISE EXCEPTION 'Chat message rate limit exceeded.' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_message_rate_limit ON public.chat_messages;
CREATE TRIGGER trg_chat_message_rate_limit
    BEFORE INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.enforce_chat_message_rate_limit();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-voice', 'chat-voice', false, 5242880, ARRAY['audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/3gpp'])
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users read community voice" ON storage.objects;
CREATE POLICY "Authenticated users read community voice"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'chat-voice');

DROP POLICY IF EXISTS "Users upload their own community voice" ON storage.objects;
CREATE POLICY "Users upload their own community voice"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'chat-voice'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

DROP POLICY IF EXISTS "Users delete their own community voice" ON storage.objects;
CREATE POLICY "Users delete their own community voice"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'chat-voice'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (
           SELECT 1 FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
             AND schemaname = 'public'
             AND tablename = 'chat_messages'
       ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
END;
$$;