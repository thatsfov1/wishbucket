# WishBucket Database Schema

This document describes the database tables needed for the WishBucket application.

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands below to create all required tables

---

## Core Tables

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT UNIQUE NOT NULL, -- Telegram user ID
  telegram_data JSONB NOT NULL, -- Stores Telegram user info
  birthday DATE,
  referral_code VARCHAR(10) UNIQUE NOT NULL,
  referrals INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  premium_status VARCHAR(20) DEFAULT 'free',
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);
```

### Wishlists Table
```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  image_url TEXT,
  event_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
```

### Wishlist Items Table
```sql
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  url TEXT,
  original_url TEXT,
  affiliate_url TEXT,
  image_url TEXT,
  price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  priority VARCHAR(10) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'available',
  reserved_by BIGINT,
  purchased_by BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
```

---

## Friends & Social Tables

### Friends Table (Following relationship)
```sql
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  friend_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
```

---

## Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'new_follower', 'item_reserved', 'wishlist_shared', etc.
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data (wishlistId, userId, etc.)
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
```

---

## Referrals Table
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  referred_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  bonus_earned INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_user_id) -- A user can only be referred once
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
```

---

## Secret Santa Tables
```sql
CREATE TABLE secret_santa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  budget DECIMAL(10, 2),
  exchange_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_drawn BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE secret_santa_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_santa_id UUID NOT NULL REFERENCES secret_santa(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  wishlist_id UUID REFERENCES wishlists(id),
  assigned_to BIGINT,
  has_drawn BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(secret_santa_id, user_id)
);
```

---

## Crowdfunding Tables
```sql
CREATE TABLE crowdfunding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crowdfunding_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crowdfunding_id UUID NOT NULL REFERENCES crowdfunding(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  contributed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update current_amount
CREATE OR REPLACE FUNCTION update_crowdfunding_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE crowdfunding
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM crowdfunding_contributors
    WHERE crowdfunding_id = NEW.crowdfunding_id
  )
  WHERE id = NEW.crowdfunding_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crowdfunding_amount
AFTER INSERT ON crowdfunding_contributors
FOR EACH ROW EXECUTE FUNCTION update_crowdfunding_amount();
```

---

## Row Level Security (RLS)

Enable RLS for all tables:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users: can read all, update own
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);

-- Wishlists: can read public or own, CRUD own
CREATE POLICY "View public wishlists" ON wishlists FOR SELECT USING (is_public = true OR user_id = current_setting('app.current_user_id')::bigint);
CREATE POLICY "Manage own wishlists" ON wishlists FOR ALL USING (true);

-- Items: inherit from wishlist
CREATE POLICY "View items" ON wishlist_items FOR SELECT USING (true);
CREATE POLICY "Manage items" ON wishlist_items FOR ALL USING (true);

-- Friends: can CRUD own
CREATE POLICY "Manage friends" ON friends FOR ALL USING (true);

-- Notifications: read/update own only
CREATE POLICY "View own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Manage notifications" ON notifications FOR ALL USING (true);

-- Referrals: read own only
CREATE POLICY "View referrals" ON referrals FOR SELECT USING (true);
CREATE POLICY "Create referrals" ON referrals FOR INSERT WITH CHECK (true);
```

---

## Supabase Edge Functions

### Send Telegram Notification

Deploy the edge function for sending Telegram notifications:

```bash
# Set up environment variables in Supabase Dashboard > Edge Functions
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Deploy the function
supabase functions deploy send-telegram-notification
```

The function is located at: `supabase/functions/send-telegram-notification/index.ts`

---

## Bot Setup for Notifications

1. Create your bot with [@BotFather](https://t.me/BotFather) on Telegram
2. Get your bot token
3. Set the bot token in Supabase:
   - Go to Supabase Dashboard
   - Navigate to Settings > Edge Functions
   - Add secret: `TELEGRAM_BOT_TOKEN` = your token

4. Configure webhook (optional, for bot commands):
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<your-project>.supabase.co/functions/v1/telegram-webhook"}'
```

---

## Testing

After setting up the database, test with:

```sql
-- Insert test user
INSERT INTO users (user_id, telegram_data, referral_code)
VALUES (123456789, '{"first_name": "Test", "username": "testuser"}', 'TEST1234');

-- Create test notification
INSERT INTO notifications (user_id, type, title, message)
VALUES (123456789, 'new_follower', 'New Follower!', 'Someone started following you');
```

