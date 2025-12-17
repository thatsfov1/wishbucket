# Wish Bucket - Інтеграція з Supabase

## Швидкий старт

### 1. Встановлення залежностей

```bash
npm install
```

Це встановить `@supabase/supabase-js` та інші залежності.

### 2. Створення проекту Supabase

1. Зареєструйтесь на [supabase.com](https://supabase.com)
2. Створіть новий проект
3. Скопіюйте **Project URL** та **anon public key**

### 3. Налаштування змінних оточення

Створіть файл `.env` в корені проекту:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Створення таблиць

1. Відкрийте Supabase Dashboard
2. Перейдіть до **SQL Editor**
3. Відкрийте файл `supabase/schema.sql`
4. Скопіюйте весь SQL код
5. Вставте в SQL Editor та натисніть **Run**

### 5. Запуск додатку

```bash
npm run dev
```

## Структура коду

### API Сервіси

- `src/services/supabase-api.ts` - Всі функції для роботи з Supabase
- `src/services/api.ts` - Старий API (можна видалити після міграції)

### Клієнт Supabase

- `src/lib/supabase.ts` - Налаштування Supabase клієнта

### Типи

- `src/types/supabase.ts` - TypeScript типи для Supabase
- `src/types/index.ts` - Загальні типи додатку

## Основні функції

### Користувачі

```typescript
import { getUserProfile, updateUserProfile } from './services/supabase-api';

// Отримати профіль (автоматично створює якщо не існує)
const profile = await getUserProfile();

// Оновити профіль
await updateUserProfile({ birthday: '1990-01-15' });
```

### Wishlists

```typescript
import { getWishlists, createWishlist } from './services/supabase-api';

// Отримати всі wishlists
const wishlists = await getWishlists();

// Створити новий
const newWishlist = await createWishlist({
  name: 'Birthday Wishlist',
  description: 'Things I want',
  isPublic: true,
  isDefault: false,
});
```

### Items

```typescript
import { addItem, updateItem } from './services/supabase-api';

// Додати item
const item = await addItem(wishlistId, {
  name: 'iPhone 15',
  url: 'https://example.com/product',
  originalUrl: 'https://example.com/product',
  priority: 'high',
  status: 'available',
});
```

## Row Level Security (RLS)

Supabase автоматично застосовує RLS політики з `schema.sql`:

- Користувачі можуть читати/редагувати тільки свої дані
- Публічні wishlists доступні всім
- Items доступні тільки з публічних wishlists або власних

## Real-time оновлення

Supabase підтримує real-time підписки. Приклад:

```typescript
import { supabase } from './lib/supabase';

// Підписатися на зміни wishlist
const subscription = supabase
  .channel('wishlists')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'wishlists',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    console.log('Wishlist changed:', payload);
  })
  .subscribe();
```

## Налаштування автентифікації

Для Telegram WebApp ми використовуємо `initData` для автентифікації. Supabase RLS політики налаштовані для роботи з `user_id` з Telegram.

## Troubleshooting

### Помилка підключення

Перевірте:
1. Правильність `VITE_SUPABASE_URL` та `VITE_SUPABASE_ANON_KEY`
2. Чи створені таблиці в Supabase
3. Чи увімкнено RLS для таблиць

### Помилки RLS

Якщо отримуєте помилки доступу:
1. Перевірте політики в Supabase Dashboard → Authentication → Policies
2. Переконайтеся що `user_id` правильно передається

### Помилки типів

Якщо TypeScript показує помилки:
1. Перевірте що `src/types/supabase.ts` містить правильні типи
2. Можна згенерувати типи автоматично через Supabase CLI

## Додаткові ресурси

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

