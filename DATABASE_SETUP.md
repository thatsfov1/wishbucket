# Покрокова інструкція: Підключення бази даних до Wish Bucket

## Яка база даних найкраща?

**Рекомендація: PostgreSQL** 🏆

**Чому PostgreSQL?**
- ✅ Безкоштовна та open-source
- ✅ Надійна та масштабована
- ✅ Підтримка JSON для Telegram даних
- ✅ Відмінна підтримка в Node.js
- ✅ Підходить для production
- ✅ Безкоштовні хостинги (Supabase, Railway, Render)

**Альтернативи:**
- **MongoDB** - якщо потрібна NoSQL
- **SQLite** - для простих проектів (не для production)
- **MySQL** - класичний варіант

---

## Крок 1: Встановлення PostgreSQL

### macOS:
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Windows:
Завантажте з [postgresql.org](https://www.postgresql.org/download/windows/)

### Linux (Ubuntu):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Перевірка:
```bash
psql --version
```

---

## Крок 2: Створення бази даних

```bash
# Підключитися до PostgreSQL
psql postgres

# Створити базу даних
CREATE DATABASE wish_bucket;

# Створити користувача
CREATE USER wishbucket_user WITH PASSWORD 'your_secure_password';

# Дати права
GRANT ALL PRIVILEGES ON DATABASE wish_bucket TO wishbucket_user;

# Вийти
\q
```

---

## Крок 3: Встановлення залежностей для бекенду

Створіть папку `backend` та встановіть:

```bash
mkdir backend
cd backend
npm init -y
npm install express pg dotenv cors
npm install -D @types/node @types/express @types/pg typescript ts-node nodemon
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## Крок 4: Структура таблиць

Створіть файл `backend/database/schema.sql`:

```sql
-- Користувачі
CREATE TABLE users (
  user_id BIGINT PRIMARY KEY,
  telegram_data JSONB NOT NULL,
  birthday DATE,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referrals INTEGER DEFAULT 0,
  premium_status VARCHAR(10) DEFAULT 'free',
  premium_expires_at TIMESTAMP,
  bonus_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Друзі
CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  friend_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id)
);

-- Wishlists
CREATE TABLE wishlists (
  id VARCHAR(50) PRIMARY KEY,
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Елементи wishlist
CREATE TABLE wishlist_items (
  id VARCHAR(50) PRIMARY KEY,
  wishlist_id VARCHAR(50) REFERENCES wishlists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  original_url TEXT NOT NULL,
  affiliate_url TEXT,
  image_url TEXT,
  price DECIMAL(10, 2),
  currency VARCHAR(10),
  priority VARCHAR(10) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'available',
  reserved_by BIGINT REFERENCES users(user_id),
  purchased_by BIGINT REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crowdfunding
CREATE TABLE crowdfunding (
  id VARCHAR(50) PRIMARY KEY,
  item_id VARCHAR(50) REFERENCES wishlist_items(id) ON DELETE CASCADE,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Учасники crowdfunding
CREATE TABLE crowdfunding_contributors (
  id SERIAL PRIMARY KEY,
  crowdfunding_id VARCHAR(50) REFERENCES crowdfunding(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(user_id),
  amount DECIMAL(10, 2) NOT NULL,
  contributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secret Santa
CREATE TABLE secret_santa (
  id VARCHAR(50) PRIMARY KEY,
  organizer_id BIGINT REFERENCES users(user_id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  budget DECIMAL(10, 2),
  exchange_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Учасники Secret Santa
CREATE TABLE secret_santa_participants (
  id SERIAL PRIMARY KEY,
  secret_santa_id VARCHAR(50) REFERENCES secret_santa(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(user_id),
  wishlist_id VARCHAR(50) REFERENCES wishlists(id),
  assigned_to BIGINT REFERENCES users(user_id),
  has_drawn BOOLEAN DEFAULT false
);

-- Індекси для швидкості
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_crowdfunding_item_id ON crowdfunding(item_id);
```

---

## Крок 5: Підключення до бази даних

Створіть `backend/src/db.ts`:

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'wish_bucket',
  user: process.env.DB_USER || 'wishbucket_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

Створіть `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wish_bucket
DB_USER=wishbucket_user
DB_PASSWORD=your_secure_password
PORT=3001
TELEGRAM_BOT_TOKEN=your_bot_token
```

---

## Крок 6: Базовий сервер з реєстрацією

Створіть `backend/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import pool from './db';
import { verifyTelegramWebAppData } from './telegram-auth';

const app = express();
app.use(cors());
app.use(express.json());

// Реєстрація/авторизація через Telegram
app.post('/api/auth/register', async (req, res) => {
  try {
    const { initData } = req.body;
    
    // Верифікація Telegram даних
    const userData = verifyTelegramWebAppData(initData);
    
    if (!userData) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Перевірка чи користувач вже існує
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [userData.id]
    );

    if (existingUser.rows.length === 0) {
      // Створення нового користувача
      const referralCode = generateReferralCode();
      
      await pool.query(
        `INSERT INTO users (user_id, telegram_data, referral_code) 
         VALUES ($1, $2, $3)`,
        [userData.id, JSON.stringify(userData), referralCode]
      );
    }

    // Отримати профіль користувача
    const result = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [userData.id]
    );

    res.json({
      userId: result.rows[0].user_id,
      telegramUser: JSON.parse(result.rows[0].telegram_data),
      referralCode: result.rows[0].referral_code,
      referrals: result.rows[0].referrals,
      premiumStatus: result.rows[0].premium_status,
      bonusPoints: result.rows[0].bonus_points,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});
```

---

## Крок 7: Верифікація Telegram

Створіть `backend/src/telegram-auth.ts`:

```typescript
import crypto from 'crypto';

export function verifyTelegramWebAppData(initData: string): any | null {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN || '')
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) {
    return null;
  }

  const userStr = urlParams.get('user');
  return userStr ? JSON.parse(userStr) : null;
}
```

---

## Крок 8: Запуск

1. **Запустити PostgreSQL:**
```bash
brew services start postgresql@14  # macOS
# або
sudo systemctl start postgresql    # Linux
```

2. **Створити таблиці:**
```bash
psql -U wishbucket_user -d wish_bucket -f database/schema.sql
```

3. **Запустити бекенд:**
```bash
cd backend
npm run dev
```

---

## Альтернатива: Supabase (безкоштовний хостинг)

1. Зареєструйтесь на [supabase.com](https://supabase.com)
2. Створіть новий проект
3. Скопіюйте connection string
4. Використовуйте Supabase як PostgreSQL

**Переваги:**
- ✅ Безкоштовний tier
- ✅ Автоматичні бекапи
- ✅ Веб-інтерфейс для БД
- ✅ HTTPS з коробки

---

## Наступні кроки

1. ✅ База даних створена
2. ✅ Таблиці створені
3. ✅ Бекенд підключений
4. 🔄 Додати всі API endpoints
5. 🔄 Підключити frontend до бекенду
6. 🔄 Тестування

Готово! 🎉

