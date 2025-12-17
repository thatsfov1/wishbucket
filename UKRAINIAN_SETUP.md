# Wish Bucket - Інструкція з налаштування

## ✅ Що вже зроблено:

1. ✅ **Назва змінена** - "Wish.ly" → "Wish Bucket" всюди
2. ✅ **Аватарка додана** - відображається в:
   - Профілі користувача (великий)
   - Хедері (маленький)
   - Головній сторінці (великий)
3. ✅ **Компонент Avatar** створений з підтримкою:
   - Фото з Telegram (якщо є)
   - Ініціали (якщо фото немає)
   - Різні розміри (small, medium, large)

## 🎯 Що потрібно зробити сьогодні:

### Крок 1: Підключення бази даних

**Рекомендація: PostgreSQL** (найкращий вибір)

**Швидкий старт з Supabase (безкоштовно):**
1. Зареєструйтесь на [supabase.com](https://supabase.com)
2. Створіть новий проект
3. Перейдіть до SQL Editor
4. Скопіюйте SQL з `DATABASE_SETUP.md` (розділ "Структура таблиць")
5. Виконайте SQL запит

**Або локально PostgreSQL:**
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Створити БД
psql postgres
CREATE DATABASE wish_bucket;
\q
```

### Крок 2: Створення бекенду

```bash
mkdir backend
cd backend
npm init -y
npm install express pg dotenv cors
npm install -D @types/node @types/express @types/pg typescript ts-node nodemon
```

**Створіть структуру:**
```
backend/
├── src/
│   ├── index.ts          # Головний сервер
│   ├── db.ts             # Підключення до БД
│   └── telegram-auth.ts  # Верифікація Telegram
├── database/
│   └── schema.sql        # SQL схема
├── .env                  # Змінні оточення
└── package.json
```

### Крок 3: Реєстрація через Telegram

**Що потрібно:**
1. Telegram Bot Token (отримайте в @BotFather)
2. Верифікація `initData` від Telegram WebApp
3. Збереження користувача в БД
4. Повернення профілю з аватаркою

**Приклад коду в `backend/src/index.ts`:**

```typescript
app.post('/api/auth/register', async (req, res) => {
  const { initData } = req.body;
  
  // Верифікація Telegram
  const userData = verifyTelegramWebAppData(initData);
  
  // Перевірка чи існує користувач
  const existing = await pool.query(
    'SELECT * FROM users WHERE user_id = $1',
    [userData.id]
  );

  if (existing.rows.length === 0) {
    // Новий користувач - створити
    const referralCode = generateReferralCode();
    await pool.query(
      `INSERT INTO users (user_id, telegram_data, referral_code) 
       VALUES ($1, $2, $3)`,
      [userData.id, JSON.stringify(userData), referralCode]
    );
  }

  // Повернути профіль
  const result = await pool.query(
    'SELECT * FROM users WHERE user_id = $1',
    [userData.id]
  );

  res.json({
    userId: result.rows[0].user_id,
    telegramUser: JSON.parse(result.rows[0].telegram_data),
    // ... інші поля
  });
});
```

### Крок 4: Оновлення frontend

**В `src/services/api.ts` додайте:**

```typescript
export const registerUser = async (initData: string): Promise<UserProfile> => {
  const response = await api.post('/auth/register', { initData });
  return response.data;
};
```

**В `src/App.tsx` оновіть:**

```typescript
useEffect(() => {
  const tg = initTelegram();
  if (!tg) return;

  const loadData = async () => {
    try {
      // Реєстрація/авторизація
      const initData = tg.initData;
      const profile = await registerUser(initData);
      setUserProfile(profile);
      
      // Завантажити інші дані...
    } catch (error) {
      console.error('Error:', error);
    }
  };

  loadData();
}, []);
```

## 📋 Чеклист для сьогодні:

- [ ] Встановити PostgreSQL або створити Supabase проект
- [ ] Створити таблиці в БД (SQL з DATABASE_SETUP.md)
- [ ] Створити бекенд структуру
- [ ] Встановити залежності бекенду
- [ ] Налаштувати підключення до БД
- [ ] Реалізувати верифікацію Telegram
- [ ] Створити endpoint `/api/auth/register`
- [ ] Підключити frontend до бекенду
- [ ] Протестувати реєстрацію
- [ ] Перевірити що аватарка відображається

## 🔗 Корисні посилання:

- [Supabase](https://supabase.com) - безкоштовний PostgreSQL хостинг
- [Telegram Bot API](https://core.telegram.org/bots/api) - документація
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/) - навчання

## 💡 Поради:

1. **Почніть з Supabase** - найшвидший спосіб запустити БД
2. **Використовуйте TypeScript** - менше помилок
3. **Тестуйте покроково** - спочатку реєстрація, потім інші функції
4. **Зберігайте `photo_url`** - Telegram надає URL аватарки в `initData`

## 🐛 Якщо щось не працює:

1. Перевірте що PostgreSQL запущений
2. Перевірте `.env` файл з правильними credentials
3. Перевірте що Telegram Bot Token правильний
4. Перевірте логи бекенду на помилки
5. Перевірте Network tab в браузері для API запитів

Успіхів! 🚀

