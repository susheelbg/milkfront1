-- Upgrade existing community chat installs for image messages and private image storage.

ALTER TABLE public.chat_messages
    ADD COLUMN IF NOT EXISTS image_path TEXT;

ALTER TABLE public.chat_messages
    DROP CONSTRAINT IF EXISTS chat_messages_message_type_check,
    DROP CONSTRAINT IF EXISTS ck_chat_message_payload,
    DROP CONSTRAINT IF EXISTS ck_chat_messages_message_type,
    ADD CONSTRAINT ck_chat_messages_message_type
        CHECK (message_type IN ('text', 'voice', 'image')),
    ADD CONSTRAINT ck_chat_message_payload CHECK (
        (message_type = 'text' AND content IS NOT NULL AND length(btrim(content)) BETWEEN 1 AND 2000 AND voice_path IS NULL AND image_path IS NULL)
        OR
        (message_type = 'voice' AND content IS NULL AND voice_path IS NOT NULL AND image_path IS NULL AND length(voice_path) <= 512)
        OR
        (message_type = 'image' AND content IS NULL AND voice_path IS NULL AND image_path IS NOT NULL AND length(image_path) <= 512)
    );

DROP POLICY IF EXISTS "Users create their own chat messages" ON public.chat_messages;
CREATE POLICY "Users create their own chat messages"
    ON public.chat_messages FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND (
            (message_type = 'text' AND content IS NOT NULL AND voice_path IS NULL AND image_path IS NULL)
            OR (message_type = 'voice' AND content IS NULL AND image_path IS NULL AND voice_path LIKE auth.uid()::TEXT || '/%')
            OR (message_type = 'image' AND content IS NULL AND voice_path IS NULL AND image_path LIKE auth.uid()::TEXT || '/%')
        )
    );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-images', 'chat-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users read community images" ON storage.objects;
CREATE POLICY "Authenticated users read community images"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'chat-images');

DROP POLICY IF EXISTS "Users upload their own community images" ON storage.objects;
CREATE POLICY "Users upload their own community images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'chat-images'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

DROP POLICY IF EXISTS "Users delete their own community images" ON storage.objects;
CREATE POLICY "Users delete their own community images"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'chat-images'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );