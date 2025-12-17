-- ============================================
-- Wish Bucket Database Schema for Supabase
-- ============================================
-- Виконайте цей SQL в Supabase SQL Editor
-- ============================================

-- Увімкнути розширення для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Таблиця: users (користувачі)
-- ============================================
CREATE TABLE users (
  user_id BIGINT PRIMARY KEY,
  telegram_data JSONB NOT NULL,
  birthday DATE,
  referral_code VARCHAR(20) UNIQUE NOT NULL DEFAULT upper(substring(md5(random()::text) from 1 for 8)),
  referrals INTEGER DEFAULT 0,
  premium_status VARCHAR(10) DEFAULT 'free' CHECK (premium_status IN ('free', 'premium')),
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  bonus_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Індекс для швидкого пошуку по referral_code
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- ============================================
-- Таблиця: friends (друзі)
-- ============================================
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  friend_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id) -- Не можна додати себе в друзі
);

-- Індекси для швидкого пошуку
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);

-- ============================================
-- Таблиця: wishlists (списки бажань)
-- ============================================
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Індекси
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_public ON wishlists(is_public) WHERE is_public = true;

-- Унікальний індекс: тільки один default wishlist на користувача
CREATE UNIQUE INDEX idx_wishlists_user_default ON wishlists(user_id) WHERE is_default = true;

-- ============================================
-- Таблиця: wishlist_items (елементи списку)
-- ============================================
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  original_url TEXT NOT NULL,
  affiliate_url TEXT,
  image_url TEXT,
  price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'purchased')),
  reserved_by BIGINT REFERENCES users(user_id),
  purchased_by BIGINT REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Індекси
CREATE INDEX idx_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_items_status ON wishlist_items(status);
CREATE INDEX idx_items_reserved_by ON wishlist_items(reserved_by) WHERE reserved_by IS NOT NULL;

-- ============================================
-- Таблиця: crowdfunding (збір коштів)
-- ============================================
CREATE TABLE crowdfunding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  target_amount DECIMAL(10, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(10, 2) DEFAULT 0 CHECK (current_amount >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_id) -- Один crowdfunding на item
);

-- Індекси
CREATE INDEX idx_crowdfunding_item_id ON crowdfunding(item_id);
CREATE INDEX idx_crowdfunding_active ON crowdfunding(is_active) WHERE is_active = true;

-- ============================================
-- Таблиця: crowdfunding_contributors (учасники збору)
-- ============================================
CREATE TABLE crowdfunding_contributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crowdfunding_id UUID NOT NULL REFERENCES crowdfunding(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  contributed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Індекси
CREATE INDEX idx_contributors_crowdfunding_id ON crowdfunding_contributors(crowdfunding_id);
CREATE INDEX idx_contributors_user_id ON crowdfunding_contributors(user_id);

-- ============================================
-- Таблиця: secret_santa (таємний санта)
-- ============================================
CREATE TABLE secret_santa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  budget DECIMAL(10, 2) CHECK (budget > 0),
  exchange_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Індекси
CREATE INDEX idx_secret_santa_organizer_id ON secret_santa(organizer_id);
CREATE INDEX idx_secret_santa_active ON secret_santa(is_active) WHERE is_active = true;

-- ============================================
-- Таблиця: secret_santa_participants (учасники)
-- ============================================
CREATE TABLE secret_santa_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secret_santa_id UUID NOT NULL REFERENCES secret_santa(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id),
  wishlist_id UUID REFERENCES wishlists(id),
  assigned_to BIGINT REFERENCES users(user_id),
  has_drawn BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(secret_santa_id, user_id) -- Один користувач може бути тільки один раз
);

-- Індекси
CREATE INDEX idx_participants_secret_santa_id ON secret_santa_participants(secret_santa_id);
CREATE INDEX idx_participants_user_id ON secret_santa_participants(user_id);
CREATE INDEX idx_participants_assigned_to ON secret_santa_participants(assigned_to) WHERE assigned_to IS NOT NULL;

-- ============================================
-- Функції для автоматичного оновлення updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригери для автоматичного оновлення updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON wishlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON wishlist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crowdfunding_updated_at BEFORE UPDATE ON crowdfunding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Функція для автоматичного оновлення current_amount в crowdfunding
-- ============================================
CREATE OR REPLACE FUNCTION update_crowdfunding_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE crowdfunding
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM crowdfunding_contributors
    WHERE crowdfunding_id = NEW.crowdfunding_id
  ),
  updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.crowdfunding_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригер для автоматичного оновлення суми
CREATE TRIGGER update_crowdfunding_on_contribution
  AFTER INSERT OR UPDATE OR DELETE ON crowdfunding_contributors
  FOR EACH ROW EXECUTE FUNCTION update_crowdfunding_amount();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- 
-- ВАЖЛИВО: Для Telegram Mini Apps ми використовуємо 
-- anon key + фільтрацію на рівні додатку.
-- RLS вимкнено, безпека забезпечується через API.
-- 
-- Якщо потрібна додаткова безпека, використовуйте:
-- 1. Service role key тільки на бекенді
-- 2. Supabase Edge Functions з верифікацією Telegram initData
-- ============================================

-- Вимкнути RLS для простоти (безпека на рівні API)
-- Якщо потрібен RLS, розкоментуйте секцію нижче

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE crowdfunding DISABLE ROW LEVEL SECURITY;
ALTER TABLE crowdfunding_contributors DISABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa DISABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_participants DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Альтернатива: RLS з custom claims (опціонально)
-- ============================================
-- Якщо ви хочете увімкнути RLS, створіть custom JWT
-- з telegram_user_id в claims і використовуйте:
--
-- CREATE POLICY "Users can read own data" ON users
--   FOR SELECT USING (
--     user_id = (current_setting('request.jwt.claims', true)::json->>'telegram_user_id')::bigint
--   );
--
-- Докладніше: https://supabase.com/docs/guides/auth/jwts

-- ============================================
-- Початкові дані (опціонально)
-- ============================================

-- Коментар: Ви можете додати тестові дані тут, якщо потрібно

-- ============================================
-- Кінець схеми
-- ============================================

