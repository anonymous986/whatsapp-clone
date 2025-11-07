-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create policies for storage bucket
-- Users can upload files to chats they participate in
CREATE POLICY "Users can upload to chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT chat_id::text FROM public.chat_participants
      WHERE user_id = auth.uid()
    )
  );

-- Users can view files from chats they participate in
CREATE POLICY "Users can view chat attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-attachments' AND
    (storage.foldername(name))[1] IN (
      SELECT chat_id::text FROM public.chat_participants
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own uploaded files
CREATE POLICY "Users can update own attachments" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'chat-attachments' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Users can delete their own uploaded files
CREATE POLICY "Users can delete own attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-attachments' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Create a function to extract folder path from storage object name
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] AS $$
BEGIN
  RETURN string_to_array(name, '/');
END;
$$ LANGUAGE plpgsql IMMUTABLE;