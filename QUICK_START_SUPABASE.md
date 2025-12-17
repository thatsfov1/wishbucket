# Швидкий старт з Supabase для Wish Bucket

## Крок 1: Встановлення (2 хвилини)

```bash
npm install
```

## Крок 2: Створення Supabase проекту (5 хвилин)

1. Зареєструйтесь на [supabase.com](https://supabase.com) (безкоштовно)
2. Натисніть **"New Project"**
3. Заповніть:
   - **Name**: `wish-bucket`
   - **Database Password**: Створіть надійний пароль (збережіть!)
   - **Region**: Найближчий до вас
4. Натисніть **"Create new project"**
5. Зачекайте 2-3 хвилини

## Крок 3: Отримання ключів (1 хвилина)

1. В Supabase Dashboard перейдіть до **Settings** → **API**
2. Скопіюйте:
   - **Project URL** (виглядає як `https://xxxxx.supabase.co`)
   - **anon public** key (довгий рядок що починається з `eyJ...`)

## Крок 4: Налаштування .env (1 хвилина)

Створіть файл `.env` в корені проекту:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Важливо:** Замініть `xxxxx` на ваш реальний URL!

## Крок 5: Створення таблиць (2 хвилини)

1. В Supabase Dashboard перейдіть до **SQL Editor**
2. Відкрийте файл `supabase/schema.sql` в вашому проекті
3. Скопіюйте **весь** SQL код
4. Вставте в SQL Editor
5. Натисніть **Run** (або `Ctrl+Enter`)

Ви повинні побачити повідомлення про успішне виконання.

## Крок 6: Запуск (30 секунд)

```bash
npm run dev
```

Відкрийте додаток в Telegram і перевірте що все працює!

## ✅ Готово!

Тепер ваш додаток підключений до Supabase і готовий до використання.

## Що далі?

- Додайте перший wishlist
- Додайте items
- Протестуйте всі функції

## Проблеми?

### Помилка підключення
- Перевірте `.env` файл
- Переконайтеся що ключі правильні
- Перевірте що таблиці створені

### Помилки RLS
- Перевірте що SQL схема виконана повністю
- Перевірте Authentication → Policies в Supabase

### Помилки типів TypeScript
- Перезапустіть TypeScript сервер
- Перевірте що `src/types/supabase.ts` існує

## Корисні посилання

- [Supabase Dashboard](https://app.supabase.com)
- [Документація Supabase](https://supabase.com/docs)
- [SQL Editor](https://app.supabase.com/project/_/sql/new)

