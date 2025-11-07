-- Create chats table
CREATE TABLE public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  is_group BOOLEAN DEFAULT FALSE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat participants table
CREATE TABLE public.chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  UNIQUE(chat_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create message read receipts table
CREATE TABLE public.message_read_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for chats table
-- Users can view chats they participate in
CREATE POLICY "Users can view chats they participate in" ON public.chats
  FOR SELECT USING (
    id IN (
      SELECT chat_id FROM public.chat_participants
      WHERE user_id = auth.uid()
    )
  );

-- Users can create chats
CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Chat participants can update chat details (for group chats)
CREATE POLICY "Chat participants can update chats" ON public.chats
  FOR UPDATE USING (
    id IN (
      SELECT chat_id FROM public.chat_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for chat_participants table
-- Users can view chat participants for chats they're in
CREATE POLICY "Users can view chat participants" ON public.chat_participants
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants
      WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Users can insert chat participants (only admins can add others)
CREATE POLICY "Users can add themselves to chats" ON public.chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can add other participants
CREATE POLICY "Admins can add participants" ON public.chat_participants
  FOR INSERT WITH CHECK (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own participant details
CREATE POLICY "Users can update own participation" ON public.chat_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can update participant roles
CREATE POLICY "Admins can update participants" ON public.chat_participants
  FOR UPDATE USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can remove themselves from chats
CREATE POLICY "Users can leave chats" ON public.chat_participants
  FOR DELETE USING (user_id = auth.uid());

-- Admins can remove participants
CREATE POLICY "Admins can remove participants" ON public.chat_participants
  FOR DELETE USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for messages table
-- Users can view messages from chats they participate in
CREATE POLICY "Users can view chat messages" ON public.messages
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert messages in chats they participate in
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (
      SELECT chat_id FROM public.chat_participants
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own messages (edit functionality)
CREATE POLICY "Users can edit own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Users can soft delete their own messages
CREATE POLICY "Users can delete own messages" ON public.messages
  FOR UPDATE USING (
    sender_id = auth.uid() AND
    deleted_at IS NOT NULL
  );

-- Create policies for message_read_receipts table
-- Users can view read receipts for messages they sent or received
CREATE POLICY "Users can view relevant read receipts" ON public.message_read_receipts
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM public.messages
      WHERE chat_id IN (
        SELECT chat_id FROM public.chat_participants
        WHERE user_id = auth.uid()
      )
    ) OR user_id = auth.uid()
  );

-- Users can insert read receipts for messages they received
CREATE POLICY "Users can create read receipts" ON public.message_read_receipts
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    message_id IN (
      SELECT id FROM public.messages
      WHERE chat_id IN (
        SELECT chat_id FROM public.chat_participants
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_chat_participants_chat_id ON public.chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX idx_chat_participants_unique ON public.chat_participants(chat_id, user_id);

CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_reply_to_id ON public.messages(reply_to_id);
CREATE INDEX idx_messages_deleted_at ON public.messages(deleted_at);

CREATE INDEX idx_message_read_receipts_message_id ON public.message_read_receipts(message_id);
CREATE INDEX idx_message_read_receipts_user_id ON public.message_read_receipts(user_id);

CREATE INDEX idx_chats_created_by ON public.chats(created_by);
CREATE INDEX idx_chats_updated_at ON public.chats(updated_at);

-- Create updated_at trigger for chats
CREATE TRIGGER handle_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create updated_at trigger for messages
CREATE TRIGGER handle_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically update chat's updated_at when message is sent
CREATE OR REPLACE FUNCTION public.update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats
  SET updated_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_timestamp_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_updated_at();

-- Function to prevent users from sending messages to chats they're not in
CREATE OR REPLACE FUNCTION public.verify_chat_participant()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_id = NEW.chat_id AND user_id = NEW.sender_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this chat';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER verify_message_sender_participation
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_chat_participant();