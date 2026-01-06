-- ============================================
-- Gift Hints Table
-- ============================================
-- For storing hints about gifts that friends mentioned
-- Users forward messages to the bot to save gift ideas

CREATE TABLE IF NOT EXISTS gift_hints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who saved this hint (the user who forwarded the message)
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- About whom (the person who mentioned they want something)
  -- Can be null if we couldn't identify the person
  about_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  about_name VARCHAR(255), -- Name of the person (from forward or manually set)
  about_username VARCHAR(255), -- Telegram username if available
  
  -- The hint content
  hint_text TEXT, -- Extracted or transcribed text
  message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'video', 'photo', 'video_note', 'document')),
  
  -- Media references (stored in Telegram, we keep file_id)
  media_file_id TEXT,
  media_thumbnail_url TEXT,
  
  -- Original message reference
  telegram_message_id BIGINT,
  telegram_chat_id BIGINT,
  forward_date TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'purchased', 'archived')),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_gift_hints_user_id ON gift_hints(user_id);
CREATE INDEX idx_gift_hints_about_user_id ON gift_hints(about_user_id);
CREATE INDEX idx_gift_hints_status ON gift_hints(status);
CREATE INDEX idx_gift_hints_about_name ON gift_hints(about_name);

-- Disable RLS (security at API level)
ALTER TABLE gift_hints DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================
