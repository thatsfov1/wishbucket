# Налаштування Supabase для Wish Bucket

## Крок 1: Створення проекту Supabase

1. Зареєструйтесь на [supabase.com](https://supabase.com)
2. Натисніть "New Project"
3. Заповніть форму:
   - **Name**: `wish-bucket`
   - **Database Password**: Створіть надійний пароль (збережіть його!)
   - **Region**: Оберіть найближчий регіон
4. Натисніть "Create new project"
5. Зачекайте 2-3 хвилини поки проект створюється

## Крок 2: Отримання ключів

1. Перейдіть до **Settings** → **API**
2. Скопіюйте:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (тримайте в секреті!)

## Крок 3: Створення таблиць

1. Перейдіть до **SQL Editor** в Supabase
2. Відкрийте файл `supabase/schema.sql`
3. Скопіюйте весь SQL код
4. Вставте в SQL Editor
5. Натисніть "Run" або `Ctrl+Enter`

## Крок 4: Налаштування RLS (Row Level Security)

Supabase автоматично створить політики безпеки. Перевірте в **Authentication** → **Policies**.

## Крок 5: Налаштування змінних оточення

Створіть файл `.env` в корені проекту:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Для бекенду (якщо потрібен)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## Крок 6: Встановлення залежностей

```bash
npm install @supabase/supabase-js
```

## Крок 7: Тестування підключення

Запустіть додаток і перевірте консоль на помилки підключення.

## Корисні посилання

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Структура проекту

```
wish-bucket/
├── supabase/
│   └── schema.sql          # SQL схема для таблиць
├── src/
│   ├── lib/
│   │   └── supabase.ts      # Клієнт Supabase
│   └── services/
│       └── api.ts           # API сервіси
└── .env                     # Змінні оточення
```

## Наступні кроки

1. ✅ Створити проект в Supabase
2. ✅ Виконати SQL схему
3. ✅ Налаштувати змінні оточення
4. ✅ Встановити залежності
5. ✅ Протестувати підключення

