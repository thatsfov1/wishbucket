CREATE TABLE IF NOT EXISTS gift_hints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
  about_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  about_name VARCHAR(255), 
  about_username VARCHAR(255), 
  
  hint_text TEXT,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'video', 'photo', 'video_note', 'document')),
  
  media_file_id TEXT,
  media_thumbnail_url TEXT,
  
  telegram_message_id BIGINT,
  telegram_chat_id BIGINT,
  forward_date TIMESTAMP WITH TIME ZONE,
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'purchased', 'archived')),
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gift_hints_user_id ON gift_hints(user_id);
CREATE INDEX idx_gift_hints_about_user_id ON gift_hints(about_user_id);
CREATE INDEX idx_gift_hints_status ON gift_hints(status);
CREATE INDEX idx_gift_hints_about_name ON gift_hints(about_name);

ALTER TABLE gift_hints DISABLE ROW LEVEL SECURITY;