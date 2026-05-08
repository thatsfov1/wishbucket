CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE INDEX idx_users_referral_code ON users(referral_code);

CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  friend_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);

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

CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_public ON wishlists(is_public) WHERE is_public = true;

CREATE UNIQUE INDEX idx_wishlists_user_default ON wishlists(user_id) WHERE is_default = true;

CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
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

CREATE INDEX idx_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_items_status ON wishlist_items(status);
CREATE INDEX idx_items_reserved_by ON wishlist_items(reserved_by) WHERE reserved_by IS NOT NULL;

CREATE TABLE crowdfunding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  target_amount DECIMAL(10, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(10, 2) DEFAULT 0 CHECK (current_amount >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_id)
);

CREATE INDEX idx_crowdfunding_item_id ON crowdfunding(item_id);
CREATE INDEX idx_crowdfunding_active ON crowdfunding(is_active) WHERE is_active = true;

CREATE TABLE crowdfunding_contributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crowdfunding_id UUID NOT NULL REFERENCES crowdfunding(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  contributed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contributors_crowdfunding_id ON crowdfunding_contributors(crowdfunding_id);
CREATE INDEX idx_contributors_user_id ON crowdfunding_contributors(user_id);


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

CREATE INDEX idx_secret_santa_organizer_id ON secret_santa(organizer_id);
CREATE INDEX idx_secret_santa_active ON secret_santa(is_active) WHERE is_active = true;

CREATE TABLE secret_santa_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secret_santa_id UUID NOT NULL REFERENCES secret_santa(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id),
  wishlist_id UUID REFERENCES wishlists(id),
  assigned_to BIGINT REFERENCES users(user_id),
  has_drawn BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(secret_santa_id, user_id)
);

CREATE INDEX idx_participants_secret_santa_id ON secret_santa_participants(secret_santa_id);
CREATE INDEX idx_participants_user_id ON secret_santa_participants(user_id);
CREATE INDEX idx_participants_assigned_to ON secret_santa_participants(assigned_to) WHERE assigned_to IS NOT NULL;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON wishlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON wishlist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crowdfunding_updated_at BEFORE UPDATE ON crowdfunding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER update_crowdfunding_on_contribution
  AFTER INSERT OR UPDATE OR DELETE ON crowdfunding_contributors
  FOR EACH ROW EXECUTE FUNCTION update_crowdfunding_amount();


ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE crowdfunding DISABLE ROW LEVEL SECURITY;
ALTER TABLE crowdfunding_contributors DISABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa DISABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_participants DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_users_telegram_username ON users ((lower(telegram_data->>'username')));


CREATE OR REPLACE VIEW public_user_profiles AS
SELECT 
  user_id,
  telegram_data,
  lower(telegram_data->>'username') as username,
  telegram_data->>'first_name' as first_name,
  telegram_data->>'last_name' as last_name,
  created_at
FROM users;


CREATE INDEX IF NOT EXISTS idx_items_wishlist_created ON wishlist_items(wishlist_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_created ON wishlists(user_id, created_at DESC);

