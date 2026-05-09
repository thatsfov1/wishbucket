export type AppLanguage = "en" | "uk" | "ru";

const STORAGE_KEY = "wb_app_language";

const DIRECT_TRANSLATIONS_UK: Record<string, string> = {
  "Set up your new wishlist": "Налаштуйте свій новий вішлист",

  "Welcome back": "З поверненням",
  Wishlists: "Вішлисти",
  Following: "Підписки",
  Followers: "Підписники",
  "Try Again": "Спробувати ще раз",
  "My Wishlists": "Мої вішлисти",
  "See all": "Дивитися всі",
  "New List": "Новий список",
  "Create your first wishlist": "Створіть свій перший вішлист",
  Wishlist: "Вішлист",
  "Quick Actions": "Швидкі дії",
  "Find Gift": "Знайти подарунок",
  Friends: "Друзі",
  Inspiration: "Натхнення",
  "Secret Santa": "Таємний Санта",
  Text: "Текст",
  Voice: "Голос",
  Video: "Відео",
  "Video note": "Відеоповідомлення",
  Photo: "Фото",
  Document: "Документ",
  "Text message": "Текстове повідомлення",
  "Voice message": "Голосове повідомлення",
  "Video message": "Відеоповідомлення",
  "Photo message": "Фото-повідомлення",
  "Gift Hints": "Підказки подарунків",
  "Loading hints...": "Завантаження підказок...",
  "Saved Gift Ideas": "Збережені ідеї подарунків",
  "Forward messages from chats to save hints":
    "Пересилайте повідомлення з чатів, щоб зберігати підказки",
  hints: "підказок",
  "No hints yet": "Поки немає підказок",
  "How it works:": "Як це працює:",
  All: "Усі",
  "Show in chat": "Показати в чаті",
  "Mark as bought": "Позначити як куплене",
  Delete: "Видалити",
  Invite: "Запросити",
  "Invite Friends, Earn Rewards!": "Запрошуйте друзів, отримуйте нагороди!",
  "Share your link and get bonus points":
    "Поділіться своїм посиланням і отримуйте бонусні бали",
  Referrals: "Рефералів",
  "Points 💎": "Бали 💎",
  Shop: "Магазин",
  Earn: "Заробити",
  "Copy Link": "Копіювати посилання",
  Share: "Поділитися",
  Code: "Код",
  Find: "Пошук",
  "Not following anyone yet": "Ви ще ні на кого не підписані",
  "Find Friends": "Знайти друзів",
  "No followers yet": "Поки немає підписників",
  "Share Profile": "Поділитися профілем",
  "Search Users": "Пошук користувачів",
  "Search by name or username...": "Пошук за ім'ям або username...",
  "Searching...": "Пошук...",
  Results: "Результати",
  "Try a different search or invite them!":
    "Спробуйте інший запит або запросіть їх!",
  "Find from Contacts": "Знайти з контактів",
  "Coming soon! We'll help you find friends from your Telegram contacts who use wishbucket.":
    "Скоро! Ми допоможемо знайти друзів з ваших контактів Telegram, які користуються wishbucket.",
  Public: "Публічний",
  "Create Wishlist": "Створити вішлист",
  "Loading wishlists...": "Завантаження вішлистів...",
  "No wishlists yet": "Поки немає вішлистів",
  "Create your first wishlist to start adding items":
    "Створіть свій перший вішлист, щоб почати додавати подарунки",
  "Share Wishlist": "Поділитися вішлистом",
  "Edit Wishlist": "Редагувати вішлист",
  "Delete Wishlist": "Видалити вішлист",
  Active: "Активні",
  Reserved: "Зарезервовані",
  "Received ⤵": "Отримані ⤵",
  "Received Gifts": "Отримані подарунки",
  Items: "Подарунки",
  "Add Item": "Додати подарунок",
  "No items yet": "Поки немає подарунків",
  "Add your first item to this wishlist":
    "Додайте перший подарунок до цього вішлиста",
  Edit: "Редагувати",
  "Open link": "Відкрити посилання",
  "Hide actions": "Сховати дії",
  "Show actions": "Показати дії",
  "✓ Available": "✓ Доступний",
  "⏳ Reserved": "⏳ Зарезервовано",
  "🎁 Received": "🎁 Отримано",
  "View Product": "Переглянути товар",
  "Did you receive this gift?": "Ви отримали цей подарунок?",
  "Yes, I received this gift!": "Так, я отримав(-ла) цей подарунок!",
  "No, just remove it": "Ні, просто видалити",
  Cancel: "Скасувати",
  "Add details about the item...": "Додайте деталі про подарунок...",
  "Item Name *": "Назва подарунка *",
  "Product URL *": "URL товару *",
  "Paste a link to auto-fill...": "Вставте посилання для автозаповнення...",
  "🔄 Refetch Info": "🔄 Оновити інформацію",
  "🔍 Fetch Product Info": "🔍 Отримати дані товару",
  "🔍 Fetching product info...": "🔍 Отримання даних товару...",
  Product: "Товар",
  "✓ Product info loaded": "✓ Дані товару завантажено",
  Currency: "Валюта",
  Hide: "Сховати",
  Change: "Змінити",
  "(optional)": "(необов'язково)",
  Priority: "Пріоритет",
  Low: "Низький",
  Medium: "Середній",
  High: "Високий",
  "➕ Add Item": "➕ Додати подарунок",
  "Save Changes": "Зберегти зміни",
  item: "подарунок",
  items: "подарунків",
  "Wishlist Name *": "Назва вішлиста *",
  "What's this wishlist for?": "Для чого цей вішлист?",
  "Cover Image": "Обкладинка",
  "Add a new item to your wishlist":
    "Додайте новий подарунок до вашого вішлиста",
  "Add a description for your wishlist...":
    "Додайте опис для вашого вішлиста...",
  "e.g., Birthday Wishlist": "напр., Вішлист на день народження",
  "e.g., Iphone 15 Pro": "напр., Iphone 15 Pro",
  "Your followers will be notified about this new wishlist":
    "Ваші підписники будуть повідомлені про цей новий вішлист",
  "Name *": "Назва *",
  Price: "Ціна",
  Link: "Посилання",
  Image: "Зображення",
  Description: "Опис",
  Birthday: "День народження",
  "Save Birthday": "Зберегти день народження",
  "Hide year": "Сховати рік",
  Preferences: "Параметри",
  "Dark Mode": "Темний режим",
  Rewards: "Нагороди",
  "No items in this wishlist": "У цьому вішлисті немає подарунків",
  "Default Currency": "Типова валюта",
  "No public wishlists yet": "Поки немає публічних вішлистів",
  "Gift Shop": "Магазин подарунків",
  "Coming Soon": "Скоро з'явиться",
  Profile: "Профіль",
  "Go Back": "Повернутися",
  More: "Більше",
  "Earn Points": "Заробити бали",
  Collections: "Колекції",
  "Under $50": "До $50",
  Romantic: "Романтичні",
  "Cozy Vibes": "Комфортні вібрації",
  Adventurous: "Пригодичні",
  "Unique Finds": "Унікальні знахідки",
  Luxury: "Люкс",
  Tech: "Техніка",
  Fashion: "Мода",
  Outdoors: "Навколодома",
  Creative: "Творчість",
  Food: "Їжа",
  Wellness: "Здоров'я",
  Gaming: "Ігри",
  Books: "Книги",
  "Visibility": "Видимість",
  "All Gifts": "Усі подарунки",
  "Find a Gift": "Знайти подарунок",
  "Who is this gift for?": "Для кого цей подарунок?",
  "What's the occasion?": "Що це за подія?",
  "What are they into?": "Що вони люблять?",
  "What's your budget?": "Який ваш бюджет?",
  Partner: "Партнер",
  Friend: "Друг",
  Parent: "Батько/мати",
  Sibling: "Брат/сестра",
  Colleague: "Коллега",
  Child: "Дитина",
  Holiday: "Свято",
  Anniversary: "Річниця",
  Graduation: "Випуск",
  "Valentine's": "День святого Валентина",
  "Just Because": "Просто так",
  "Pick their main interest": "Виберіть їхній основний інтерес",
  "How do you want them to feel?": "Як вони хотіли б почуватися?",
  Practical: "Практичний",
  Cozy: "Комфортний",
  Fun: "Веселий",
  Unique: "Унікальний",
  "gifts matched your answers": "подарунків відповіли вашим запитам",
  "No gifts matched all filters. Try restarting with different answers!":
    "Жодних подарунків не відповіли вашим запитам. Спробуйте почати знову з іншими відповідями!",
  "Perfect Picks 🎁": "Ідеальні подарунки 🎁",
  Restart: "Почати знову",
  "Add to list": "Додати до списку",
  match: "відповідь",
  "Add to Wishlist": "Додати до вішлиста",
  New: "Новий",
  "Discover great gift ideas": "Відкрийте для себе чудові ідеї подарунків",
  "Complete tasks, invite friends, and earn points to redeem in the Gift Shop!":
    "Виконуйте завдання, запрошуйте друзів і заробляйте бали для обміну в Магазині подарунків!",
  "Redeem your points for exclusive gifts, discounts, and special rewards!":
    "Обміняйте свої бали на ексклюзивні подарунки, знижки та спеціальні нагороди!",
  "Organize gift exchanges with friends and family! Draw names, set budgets, and spread holiday cheer.":
    "Організуйте обмін подарунками з друзями та родиною! Витягніть імена, встановіть бюджети та розповсюдьте веселощі під час свята.",
  "Auto-notify followers": "Автоматично повідомляти підписників",
  "When adding items or creating lists":
    "При додаванні подарунків або створенні вішлистів",
  "Share & Invite": "Поділитися та запросити",
  Crowdfunding: "Крофандінг",
  "Help your friends get expensive items by contributing together! Pool money with friends and family for big purchases.":
    "Допоможіть друзям отримати дорогі предмети, збираючи кошти разом! Збирайте кошти з друзями та родиною для великих покупок.",
  "Invite Friends": "Запросити друзів",
  "Add to Wishlist *": "Додати до вішлиста *",
  "Notify friends & followers": "Повідомити друзів та підписників",
  "Hidden in app, accessible by shared link":
    "Приховано в застосунку, доступно за посиланням",
  "Event Date": "Дата події",
  "Only you can see this wishlist": "Лише ви бачите цей вішлист",
  "Anyone with link": "Усі за посиланням",
  "Visible to everyone in app and by link":
    "Видно всім у застосунку та за посиланням",
  Private: "Приватний",
  "Loading...": "Завантаження...",
  Today: "Сьогодні",
  Yesterday: "Вчора",
  "Birthday updated successfully!": "День народження успішно оновлено!",
  "Failed to update birthday": "Не вдалося оновити день народження",
  "Please enter a referral code": "Будь ласка, введіть реферальний код",
  "Referral code applied! You received bonus points!":
    "Реферальний код застосовано! Ви отримали бонусні бали!",
  "Failed to apply referral code": "Не вдалося застосувати реферальний код",
  "Premium subscription coming soon!": "Преміум-підписка скоро з'явиться!",
  "Level Board": "Дошка рівнів",
  Close: "Закрити",
  Unlimited: "Безліміт",
  "Up to": "До",
  wishlists: "вішлистів",
  friends: "друзів",
  "Your perks": "Ваші переваги",
  "Share & Invite Friends": "Поділитися і запросити друзів",
  "Maximum Level Reached!": "Досягнуто максимального рівня!",
  "You're a wishbucket Legend. Enjoy unlimited wishlists!":
    "Ви легенда wishbucket. Насолоджуйтеся безлімітними вішлистами!",
  Newcomer: "Новачок",
  Explorer: "Дослідник",
  Collector: "Колекціонер",
  Legend: "Легенда",
  "Just getting started": "Початок шляху",
  "Growing your circle": "Розширюєте своє коло",
  "A true wishlist enthusiast": "Справжній поціновувач вішлистів",
  "The ultimate wishlist master": "Найвищий майстер вішлистів",
  "2 wishlists": "2 вішлисти",
  "5 wishlists": "5 вішлистів",
  "10 wishlists": "10 вішлистів",
  "Unlimited wishlists": "Безлімітні вішлисти",
  "Emoji covers": "Емодзі-обкладинки",
  "Custom cover images": "Власні обкладинки",
  "Priority support": "Пріоритетна підтримка",
  "Legend badge": "Значок легенди",
  "Invite 3 friends": "Запросіть 3 друзів",
  "Invite 10 friends": "Запросіть 10 друзів",
  "Invite 25 friends": "Запросіть 25 друзів",
  "Failed to load wishlist": "Не вдалося завантажити вішлист",
  "Please enter a wishlist name": "Будь ласка, введіть назву вішлиста",
  "Failed to update wishlist": "Не вдалося оновити вішлист",
  "Are you sure you want to delete this wishlist?":
    "Ви впевнені, що хочете видалити цей вішлист?",
  "Please enter a valid URL": "Будь ласка, введіть коректний URL",
  "Failed to fetch. Please fill manually.":
    "Не вдалося отримати дані. Заповніть поля вручну.",
  "Wishlist ID is missing": "ID вішлиста відсутній",
  "Please enter an item name": "Будь ласка, введіть назву подарунка",
  "Please enter a URL": "Будь ласка, введіть URL",
  "Add year": "Додати рік",
  "🎂 Birthday": "🎂 День народження",
  "Failed to add item": "Не вдалося додати подарунок",
  "Failed to follow user": "Не вдалося підписатися на користувача",
  "Failed to unfollow user": "Не вдалося відписатися від користувача",
  "Referral link copied!": "Реферальне посилання скопійовано!",
  "Failed to load user profile": "Не вдалося завантажити профіль користувача",
  "This item is already reserved or purchased":
    "Цей подарунок уже зарезервовано або придбано",
  "Item reserved! They won't see who reserved it.":
    "Подарунок зарезервовано! Власник не побачить, хто саме зарезервував.",
  "Failed to reserve item": "Не вдалося зарезервувати подарунок",
  "Reservation released.": "Резервування скасовано.",
  "Failed to release reservation": "Не вдалося скасувати резервування",
  "Marked as gifted! 🎁": "Позначено як подарований! 🎁",
  "Complete to unlock Level": "Виконайте, щоб відкрити Рівень",
  "Progress to Level": "Прогрес до Рівня",
  "Share your profile and invite friends to get followers!":
    "Поділіться своїм профілем і запросіть друзів, щоб отримати підписників!",
  "Lv.": "Рів.",
};

const DIRECT_TRANSLATIONS_RU: Record<string, string> = {
  "Welcome back": "С возвращением",
  Wishlists: "Вишлисты",
  Following: "Подписки",
  Followers: "Подписчики",
  "Try Again": "Попробовать снова",
  "My Wishlists": "Мои вишлисты",
  "See all": "Смотреть все",
  "New List": "Новый список",
  "Create your first wishlist": "Создайте свой первый вишлист",
  Wishlist: "Вишлист",
  "Quick Actions": "Быстрые действия",
  "Find Gift": "Найти подарок",
  "Visibility": "Видимость",
  Friends: "Друзья",
  Inspiration: "Вдохновение",
  "Secret Santa": "Тайный Санта",
  "Gift Hints": "Подсказки подарков",
  "Saved Gift Ideas": "Сохраненные идеи подарков",
  "No hints yet": "Пока нет подсказок",
  "How it works:": "Как это работает:",
  All: "Все",
  "Show in chat": "Показать в чате",
  "Mark as bought": "Отметить как купленное",
  Delete: "Удалить",
  Invite: "Пригласить",
  "Invite Friends, Earn Rewards!": "Приглашайте друзей, получайте награды!",
  "Share your link and get bonus points":
    "Поделитесь своей ссылкой и получайте бонусные баллы",
  Referrals: "Рефералов",
  "Points 💎": "Баллы 💎",
  Shop: "Магазин",
  Earn: "Заработать",
  "Copy Link": "Копировать ссылку",
  Share: "Поделиться",
  Code: "Код",
  Find: "Поиск",
  "Not following anyone yet": "Вы еще ни на кого не подписаны",
  "Find Friends": "Найти друзей",
  "No followers yet": "Пока нет подписчиков",
  "Share Profile": "Поделиться профилем",
  "Search Users": "Поиск пользователей",
  "Search by name or username...": "Поиск по имени или username...",
  "Searching...": "Поиск...",
  Results: "Результаты",
  Public: "Публичный",
  "Create Wishlist": "Создать вишлист",
  "Loading wishlists...": "Загрузка вишлистов...",
  "No wishlists yet": "Пока нет вишлистов",
  "Create your first wishlist to start adding items":
    "Создайте первый вишлист, чтобы начать добавлять подарки",
  "Share Wishlist": "Поделиться вишлистом",
  "Edit Wishlist": "Редактировать вишлист",
  "Delete Wishlist": "Удалить вишлист",
  Active: "Активные",
  Reserved: "Зарезервированные",
  "Received ⤵": "Полученные ⤵",
  "Received Gifts": "Полученные подарки",
  Items: "Подарки",
  "Add Item": "Добавить подарок",
  "No items yet": "Пока нет подарков",
  "Add your first item to this wishlist":
    "Добавьте первый подарок в этот вишлист",
  Edit: "Редактировать",
  "Open link": "Открыть ссылку",
  "Hide actions": "Скрыть действия",
  "Show actions": "Показать действия",
  "✓ Available": "✓ Доступен",
  "⏳ Reserved": "⏳ Зарезервирован",
  "🎁 Received": "🎁 Получен",
  "View Product": "Посмотреть товар",
  Cancel: "Отмена",
  "Item Name *": "Название подарка *",
  "Product URL *": "URL товара *",
  "Paste a link to auto-fill...": "Вставьте ссылку для автозаполнения...",
  "Description (optional)": "Описание (необязательно)",
  Priority: "Приоритет",
  Low: "Низкий",
  Medium: "Средний",
  High: "Высокий",
  "Save Changes": "Сохранить изменения",
  "Wishlist Name *": "Название вишлиста *",
  "Cover Image": "Обложка",
  "Default Currency": "Валюта по умолчанию",
  "Dark Mode": "Темная тема",
  Rewards: "Награды",
  Profile: "Профиль",
  "Earn Points": "Заработать баллы",
  "Gift Shop": "Магазин подарков",
  "Coming Soon": "Скоро",
  "Find a Gift": "Найти подарок",
  "All Gifts": "Все подарки",
  "Notify friends & followers": "Уведомить друзей и подписчиков",
  "Auto-notify followers": "Авто-уведомление подписчиков",
  "When adding items or creating lists":
    "При добавлении подарков или создании вишлистов",
  "Birthday updated successfully!": "День рождения успешно обновлен!",
  "Failed to update birthday": "Не удалось обновить день рождения",
  "Please enter a referral code": "Пожалуйста, введите реферальный код",
  "Referral code applied! You received bonus points!":
    "Реферальный код применен! Вы получили бонусные баллы!",
  "Failed to apply referral code": "Не удалось применить реферальный код",
  "Premium subscription coming soon!": "Премиум-подписка скоро появится!",
  "Level Board": "Доска уровней",
  Close: "Закрыть",
  Unlimited: "Безлимит",
  "Up to": "До",
  wishlists: "вишлистов",
  friends: "друзей",
  "Your perks": "Ваши преимущества",
  "Maximum Level Reached!": "Достигнут максимальный уровень!",
  "You're a wishbucket Legend. Enjoy unlimited wishlists!":
    "Вы легенда wishbucket. Наслаждайтесь безлимитными вишлистами!",
  Newcomer: "Новичок",
  Explorer: "Исследователь",
  Collector: "Коллекционер",
  Legend: "Легенда",
  "Just getting started": "Только начинаете",
  "Growing your circle": "Расширяете свой круг",
  "A true wishlist enthusiast": "Настоящий ценитель вишлистов",
  "The ultimate wishlist master": "Высший мастер вишлистов",
  "2 wishlists": "2 вишлиста",
  "5 wishlists": "5 вишлистов",
  "10 wishlists": "10 вишлистов",
  "Unlimited wishlists": "Безлимитные вишлисты",
  "Emoji covers": "Эмодзи-обложки",
  "Custom cover images": "Собственные обложки",
  "Priority support": "Приоритетная поддержка",
  "Legend badge": "Значок легенды",
  "Invite 3 friends": "Пригласите 3 друзей",
  "Invite 10 friends": "Пригласите 10 друзей",
  "Invite 25 friends": "Пригласите 25 друзей",
  "Set up your new wishlist": "Настройте новый вишлист",
  Text: "Текст",
  Voice: "Голос",
  Video: "Видео",
  "Video note": "Видеосообщение",
  Photo: "Фото",
  Document: "Документ",
  "Text message": "Текстовое сообщение",
  "Voice message": "Голосовое сообщение",
  "Video message": "Видеосообщение",
  "Photo message": "Фото-сообщение",
  "Loading hints...": "Загрузка подсказок...",
  "Forward messages from chats to save hints":
    "Пересылайте сообщения из чатов, чтобы сохранять подсказки",
  hints: "подсказок",
  "Try a different search or invite them!":
    "Попробуйте другой запрос или пригласите их!",
  "Find from Contacts": "Найти из контактов",
  "Coming soon! We'll help you find friends from your Telegram contacts who use wishbucket.":
    "Скоро! Мы поможем найти друзей из ваших контактов Telegram, которые пользуются wishbucket.",
  "Did you receive this gift?": "Вы получили этот подарок?",
  "Yes, I received this gift!": "Да, я получил(а) этот подарок!",
  "No, just remove it": "Нет, просто удалить",
  "Add details about the item...": "Добавьте детали о подарке...",
  "🔄 Refetch Info": "🔄 Обновить данные",
  "🔍 Fetch Product Info": "🔍 Получить данные товара",
  "🔍 Fetching product info...": "🔍 Получение данных товара...",
  Product: "Товар",
  "✓ Product info loaded": "✓ Данные товара загружены",
  Currency: "Валюта",
  Hide: "Скрыть",
  Change: "Изменить",
  "(optional)": "(необязательно)",
  "➕ Add Item": "➕ Добавить подарок",
  item: "подарок",
  items: "подарков",
  "What's this wishlist for?": "Для чего этот вишлист?",
  "Add a new item to your wishlist": "Добавьте новый подарок в ваш вишлист",
  "Add a description for your wishlist...": "Добавьте описание для вашего вишлиста...",
  "e.g., Birthday Wishlist": "напр., Вишлист на день рождения",
  "e.g., Iphone 15 Pro": "напр., iPhone 15 Pro",
  "Your followers will be notified about this new wishlist":
    "Ваши подписчики получат уведомление об этом новом вишлисте",
  "Name *": "Название *",
  Price: "Цена",
  Link: "Ссылка",
  Image: "Изображение",
  Description: "Описание",
  Birthday: "День рождения",
  "Save Birthday": "Сохранить день рождения",
  "Hide year": "Скрыть год",
  Preferences: "Настройки",
  "No items in this wishlist": "В этом вишлисте нет подарков",
  "No public wishlists yet": "Пока нет публичных вишлистов",
  "Go Back": "Назад",
  More: "Ещё",
  Collections: "Коллекции",
  "Under $50": "До $50",
  Romantic: "Романтичные",
  "Cozy Vibes": "Уютные",
  Adventurous: "Для приключений",
  "Unique Finds": "Уникальные находки",
  Luxury: "Люкс",
  Tech: "Техника",
  Fashion: "Мода",
  Outdoors: "На природе",
  Creative: "Творчество",
  Food: "Еда",
  Wellness: "Здоровье",
  Gaming: "Игры",
  Books: "Книги",
  "Who is this gift for?": "Для кого этот подарок?",
  "What's the occasion?": "Какой повод?",
  "What are they into?": "Чем они увлекаются?",
  "What's your budget?": "Какой у вас бюджет?",
  Partner: "Партнёр",
  Friend: "Друг",
  Parent: "Родитель",
  Sibling: "Брат/сестра",
  Colleague: "Коллега",
  Child: "Ребёнок",
  Holiday: "Праздник",
  Anniversary: "Годовщина",
  Graduation: "Выпускной",
  "Valentine's": "День святого Валентина",
  "Just Because": "Просто так",
  "Pick their main interest": "Выберите их главный интерес",
  "How do you want them to feel?": "Какие эмоции вы хотите подарить?",
  Practical: "Практичные",
  Cozy: "Уютные",
  Fun: "Весёлые",
  Unique: "Уникальные",
  "gifts matched your answers": "подарков подошло под ваши ответы",
  "No gifts matched all filters. Try restarting with different answers!":
    "Нет подарков по всем фильтрам. Попробуйте начать заново с другими ответами!",
  "Perfect Picks 🎁": "Идеальные подарки 🎁",
  Restart: "Начать заново",
  "Add to list": "Добавить в список",
  match: "совпадение",
  "Add to Wishlist": "Добавить в вишлист",
  New: "Новый",
  "Discover great gift ideas": "Откройте для себя отличные идеи подарков",
  "Complete tasks, invite friends, and earn points to redeem in the Gift Shop!":
    "Выполняйте задания, приглашайте друзей и зарабатывайте баллы для обмена в Магазине подарков!",
  "Redeem your points for exclusive gifts, discounts, and special rewards!":
    "Обменивайте баллы на эксклюзивные подарки, скидки и особые награды!",
  "Organize gift exchanges with friends and family! Draw names, set budgets, and spread holiday cheer.":
    "Организуйте обмен подарками с друзьями и семьёй! Тяните имена, задавайте бюджеты и дарите праздник.",
  "Share & Invite": "Поделиться и пригласить",
  Crowdfunding: "Краудфандинг",
  "Help your friends get expensive items by contributing together! Pool money with friends and family for big purchases.":
    "Помогите друзьям получить дорогие вещи, складываясь вместе! Собирайте деньги с друзьями и семьёй на крупные покупки.",
  "Invite Friends": "Пригласить друзей",
  "Add to Wishlist *": "Добавить в вишлист *",
  "Hidden in app, accessible by shared link":
    "Скрыто в приложении, доступно по ссылке",
  "Event Date": "Дата события",
  "Only you can see this wishlist": "Только вы видите этот вишлист",
  "Anyone with link": "Все по ссылке",
  "Visible to everyone in app and by link":
    "Видно всем в приложении и по ссылке",
  Private: "Приватный",
  "Loading...": "Загрузка...",
  Today: "Сегодня",
  Yesterday: "Вчера",
  "Share & Invite Friends": "Поделиться и пригласить друзей",
  "Failed to load wishlist": "Не удалось загрузить вишлист",
  "Please enter a wishlist name": "Пожалуйста, введите название вишлиста",
  "Failed to update wishlist": "Не удалось обновить вишлист",
  "Are you sure you want to delete this wishlist?":
    "Вы уверены, что хотите удалить этот вишлист?",
  "Please enter a valid URL": "Пожалуйста, введите корректный URL",
  "Failed to fetch. Please fill manually.":
    "Не удалось получить данные. Заполните вручную.",
  "Wishlist ID is missing": "Отсутствует ID вишлиста",
  "Please enter an item name": "Пожалуйста, введите название подарка",
  "Please enter a URL": "Пожалуйста, введите URL",
  "Add year": "Добавить год",
  "🎂 Birthday": "🎂 День рождения",
  "This item is already reserved or purchased":
    "Этот подарок уже зарезервирован или куплен",
  "Item reserved! They won't see who reserved it.":
    "Подарок зарезервирован! Владелец не увидит, кто зарезервировал.",
  "Failed to reserve item": "Не удалось зарезервировать подарок",
  "Reservation released.": "Резерв снят.",
  "Failed to release reservation": "Не удалось снять резерв",
  "Marked as gifted! 🎁": "Отмечено как подарено! 🎁",
  "Complete to unlock Level": "Выполните, чтобы открыть Уровень",
  "Progress to Level": "Прогресс до Уровня",
  "Share your profile and invite friends to get followers!":
    "Поделитесь профилем и пригласите друзей, чтобы получить подписчиков!",
  "Lv.": "Ур.",
  "Failed to add item": "Не удалось добавить подарок",
  "Failed to follow user": "Не удалось подписаться на пользователя",
  "Failed to unfollow user": "Не удалось отписаться от пользователя",
  "Referral link copied!": "Реферальная ссылка скопирована!",
  "Failed to load user profile": "Не удалось загрузить профиль пользователя",
};

const DIRECT_TRANSLATIONS_BY_LANGUAGE: Record<Exclude<AppLanguage, "en">, Record<string, string>> = {
  uk: DIRECT_TRANSLATIONS_UK,
  ru: DIRECT_TRANSLATIONS_RU,
};

const REGEX_TRANSLATIONS_UK: Array<[RegExp, (match: RegExpMatchArray) => string]> =
  [
    [/^(\d+)\sitems?$/i, (m) => `${m[1]} подарунків`],
    [/^(\d+)\shints?$/i, (m) => `${m[1]} підказок`],
    [/^All\s\((\d+)\)$/i, (m) => `Усі (${m[1]})`],
    [/^(\d+)\sdays ago$/i, (m) => `${m[1]} дн. тому`],
    [
      /^No users found for "(.+)"$/i,
      (m) => `Користувачів за запитом "${m[1]}" не знайдено`,
    ],
    [/^Code:\s?/i, () => "Код: "],
    [/^Created at:\s?/i, () => "Створено: "],
    [/^Level\s(\d+)\sunlocks$/i, (m) => `Рівень ${m[1]} відкриває`],
    [
      /^Level\s(\d+)\sunlocks\s(.+)$/i,
      (m) => `Рівень ${m[1]} відкриває ${translateText(m[2])}`,
    ],
    [
      /^🔓 Unlock at Level\s(\d+)$/i,
      (m) => `🔓 Відкривається на Рівні ${m[1]}`,
    ],
    [/^Progress to Level\s(\d+)$/i, (m) => `Прогрес до Рівня ${m[1]}`],
    [
      /^Progress to Level\s(\d+)\s(.+)$/i,
      (m) => `Прогрес до Рівня ${m[1]} ${m[2]}`,
    ],
    [
      /^Complete to unlock Level\s(\d+)$/i,
      (m) => `Виконайте, щоб відкрити Рівень ${m[1]}`,
    ],
    [/^(\d+)\s\/\s(\d+)\sfriends$/i, (m) => `${m[1]} / ${m[2]} друзів`],
    [
      /^Level\s(\d+)\s–\s(.+)\.\sTap to view progress\.$/i,
      (m) =>
        `Рівень ${m[1]} — ${translateText(m[2])}. Натисніть, щоб переглянути прогрес.`,
    ],
  ];

const REGEX_TRANSLATIONS_RU: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^(\d+)\sitems?$/i, (m) => `${m[1]} подарков`],
  [/^(\d+)\shints?$/i, (m) => `${m[1]} подсказок`],
  [/^All\s\((\d+)\)$/i, (m) => `Все (${m[1]})`],
  [/^(\d+)\sdays ago$/i, (m) => `${m[1]} дн. назад`],
  [
    /^No users found for "(.+)"$/i,
    (m) => `Пользователей по запросу "${m[1]}" не найдено`,
  ],
  [/^Code:\s?/i, () => "Код: "],
  [/^Created at:\s?/i, () => "Создано: "],
  [/^Level\s(\d+)\sunlocks$/i, (m) => `Уровень ${m[1]} открывает`],
  [
    /^Level\s(\d+)\sunlocks\s(.+)$/i,
    (m) => `Уровень ${m[1]} открывает ${translateText(m[2])}`,
  ],
  [/^🔓 Unlock at Level\s(\d+)$/i, (m) => `🔓 Открывается на Уровне ${m[1]}`],
  [/^Progress to Level\s(\d+)$/i, (m) => `Прогресс до Уровня ${m[1]}`],
  [/^Progress to Level\s(\d+)\s(.+)$/i, (m) => `Прогресс до Уровня ${m[1]} ${m[2]}`],
  [/^Complete to unlock Level\s(\d+)$/i, (m) => `Выполните, чтобы открыть Уровень ${m[1]}`],
  [/^(\d+)\s\/\s(\d+)\sfriends$/i, (m) => `${m[1]} / ${m[2]} друзей`],
  [
    /^Level\s(\d+)\s–\s(.+)\.\sTap to view progress\.$/i,
    (m) =>
      `Уровень ${m[1]} — ${translateText(m[2])}. Нажмите, чтобы посмотреть прогресс.`,
  ],
];

const REGEX_TRANSLATIONS_BY_LANGUAGE: Record<Exclude<AppLanguage, "en">, Array<[RegExp, (match: RegExpMatchArray) => string]>> = {
  uk: REGEX_TRANSLATIONS_UK,
  ru: REGEX_TRANSLATIONS_RU,
};

let currentLanguage: AppLanguage = "en";
let observer: MutationObserver | null = null;

const isLocalizedLanguage = (lang: AppLanguage): lang is Exclude<AppLanguage, "en"> =>
  lang === "uk" || lang === "ru";

const startDomLocalization = () => {
  if (!isLocalizedLanguage(currentLanguage)) {
    observer?.disconnect();
    observer = null;
    return;
  }

  const runTranslate = () => {
    if (document.body) translateTree(document.body);
  };

  runTranslate();
  window.requestAnimationFrame(runTranslate);

  observer?.disconnect();
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => translateTree(node));
      } else if (mutation.type === "characterData" && mutation.target) {
        translateNodeText(mutation.target);
      }
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });
  }
};

const normalizeLanguage = (value?: string | null): AppLanguage => {
  const normalized = (value || "").toLowerCase();
  if (normalized.startsWith("uk") || normalized.startsWith("ua")) return "uk";
  if (normalized.startsWith("ru")) return "ru";
  return "en";
};

const getLanguageFromSource = (): AppLanguage => {

  const stored = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
  if (stored === "uk" || stored === "ru") return stored;
  return "en";
};


export const getAppLanguage = (): AppLanguage => currentLanguage;

type PluralCategory = "one" | "many";
type CountNounKey = "item";

type CountNounForms = {
  one: string;
  many: string;
};

const COUNT_NOUNS: Record<AppLanguage, Partial<Record<CountNounKey, CountNounForms>>> = {
  en: {
    item: { one: "item", many: "items" },
  },
  uk: {
    item: { one: "подарунок", many: "подарунків" },
  },
  ru: {
    item: { one: "подарок", many: "подарков" },
  },
};

const getPluralCategory = (language: AppLanguage, count: number): PluralCategory => {
  void language;
  return count === 1 ? "one" : "many";
};

export const formatCount = (count: number, noun: CountNounKey): string => {
  const forms =
    COUNT_NOUNS[currentLanguage][noun] ||
    COUNT_NOUNS.en[noun];

  if (!forms) return `${count}`;
  const category = getPluralCategory(currentLanguage, count);
  return `${count} ${forms[category]}`;
};

export const formatItemCount = (count: number): string => formatCount(count, "item");

const applyDocumentLanguage = () => {
  document.documentElement.lang = currentLanguage;
};

export const translateText = (input: string): string => {
  if (currentLanguage === "en" || !input) return input;
  const trimmed = input.trim();
  if (!trimmed) return input;

  const directTranslations = DIRECT_TRANSLATIONS_BY_LANGUAGE[currentLanguage];
  if (directTranslations?.[trimmed]) {
    return input.replace(trimmed, directTranslations[trimmed]);
  }

  const regexTranslations = REGEX_TRANSLATIONS_BY_LANGUAGE[currentLanguage] || [];
  for (const [regex, handler] of regexTranslations) {
    const match = trimmed.match(regex);
    if (match) {
      return input.replace(trimmed, handler(match));
    }
  }

  return input;
};

const translateNodeText = (node: Node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const original = node.textContent || "";
    const translated = translateText(original);
    if (translated !== original) node.textContent = translated;
    return;
  }

  if (!(node instanceof HTMLElement)) return;
  const attrs = ["placeholder", "title", "aria-label"];
  for (const attr of attrs) {
    const value = node.getAttribute(attr);
    if (!value) continue;
    const translated = translateText(value);
    if (translated !== value) {
      node.setAttribute(attr, translated);
    }
  }
};

const translateTree = (root: Node) => {
  translateNodeText(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
  let current: Node | null = walker.nextNode();
  while (current) {
    translateNodeText(current);
    current = walker.nextNode();
  }
};

export const initLocalization = () => {
  currentLanguage = getLanguageFromSource();
  localStorage.setItem(STORAGE_KEY, currentLanguage);
  applyDocumentLanguage();
  startDomLocalization();
};

export const setAppLanguage = (language?: string | null) => {
  const nextLanguage = normalizeLanguage(language);
  const prev = currentLanguage;

  if (prev !== nextLanguage) {
    const fromLoc = isLocalizedLanguage(prev);
    const toLoc = isLocalizedLanguage(nextLanguage);
    if ((fromLoc && !toLoc) || (fromLoc && toLoc && prev !== nextLanguage)) {
      currentLanguage = nextLanguage;
      localStorage.setItem(STORAGE_KEY, currentLanguage);
      applyDocumentLanguage();
      observer?.disconnect();
      observer = null;
      window.location.reload();
      return;
    }
  }

  currentLanguage = nextLanguage;
  localStorage.setItem(STORAGE_KEY, currentLanguage);
  applyDocumentLanguage();
  startDomLocalization();
};
