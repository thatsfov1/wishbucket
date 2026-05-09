export type AppLanguage = "en" | "uk" | "ru";

const STORAGE_KEY = "wb_app_language";

const DIRECT_TRANSLATIONS: Record<string, string> = {
  "Set up your new wishlist": "Налаштуйте свій новий вішлист",

  "Welcome back": "З поверненням",
  "Wishlists": "Вішлисти",
  "Following": "Підписки",
  "Followers": "Підписники",
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
  "All": "Усі",
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
  "items": "подарунків",
  "item": "подарунок",
  "Wishlist Name *": "Назва вішлиста *",
  "What's this wishlist for?": "Для чого цей вішлист?",
  "Cover Image": "Обкладинка",
  "Add a new item to your wishlist": "Додайте новий подарунок до вашого вішлиста",
  "Add a description for your wishlist...": "Додайте опис для вашого вішлиста...",
  "e.g., Birthday Wishlist": "напр., Вішлист на день народження",
  "e.g., Iphone 15 Pro": "напр., Iphone 15 Pro",
  "Your followers will be notified about this new wishlist": "Ваші підписники будуть повідомлені про цей новий вішлист",
  "Name *": "Назва *",
  "Price": "Ціна",
  "Link": "Посилання",
  "Image": "Зображення",
  "Description": "Опис",
  "Birthday": "День народження",
  "Save Birthday": "Зберегти день народження",
  "Hide year": "Сховати рік",
  "PREFERENCES": "Параметри",
  "Dark mode": "Темний режим",
  "REWARDS": "Нагороди",
  "Default Currency": "Типова валюта",
  "Gift Shop": "Магазин подарунків",
  "Coming Soon": "Скоро з'явиться",
  "Go Back": "Повернутися",
  "MORE": "Більше",
  "Earn Points": "Заробити бали",
  "Collections": "Колекції",
  "Under $50": "До $50",
  "Romantic": "Романтичні",
  "Cozy Vibes": "Комфортні вібрації",
  "Adventurous": "Пригодичні",
  "Unique Finds": "Унікальні знахідки",
  "Luxury": "Люкс",
  "Tech": "Техніка",
  "Fashion": "Мода",
  "Outdoors": "Навколодома",
  "Creative": "Творчість",
  "Food": "Їжа",
  "Wellness": "Здоров'я",
  "Gaming": "Ігри",
  "Books": "Книги",
  "All Gifts": "Усі подарунки",
  "Find a Gift": "Знайти подарунок",
  "Who is this gift for?": "Для кого цей подарунок?",
  "What's the occasion?": "Що це за подія?",
  "What are they into?": "Що вони люблять?",
  "What's your budget?": "Який ваш бюджет?",
  "Partner": "Партнер",
  "Friend": "Друг",
  "Parent": "Батько/мати",
  "Sibling": "Брат/сестра",
  "Colleague": "Коллега",
  "Child": "Дитина",
  "Holiday": "Свято",
  "Anniversary": "Річниця",
  "Graduation": "Випуск",
  "Valentine's": "День святого Валентина",
  "Just Because": "Просто так",
  "Pick their main interest": "Виберіть їхній основний інтерес",
  "How do you want them to feel?": "Як вони хотіли б почуватися?",
  "Practical": "Практичний",
  "Cozy": "Комфортний",
  "Fun": "Веселий",
  "Unique": "Унікальний",
  "gifts matched your answers": "подарунків відповіли вашим запитам",
  "No gifts matched all filters. Try restarting with different answers!": "Жодних подарунків не відповіли вашим запитам. Спробуйте почати знову з іншими відповідями!",
  "Perfect Picks 🎁": "Ідеальні подарунки 🎁",
  "Restart": "Почати знову",
  "Add to list": "Додати до списку",
  "match": "відповідь",
  "Add to Wishlist": "Додати до вішлиста",
  "New": "Новий",
  "Discover great gift ideas": "Відкрийте для себе чудові ідеї подарунків",
  "Complete tasks, invite friends, and earn points to redeem in the Gift Shop!": "Виконуйте завдання, запрошуйте друзів і заробляйте бали для обміну в Магазині подарунків!",
  "Redeem your points for exclusive gifts, discounts, and special rewards!": "Обміняйте свої бали на ексклюзивні подарунки, знижки та спеціальні нагороди!",
  "Organize gift exchanges with friends and family! Draw names, set budgets, and spread holiday cheer.": "Організуйте обмін подарунками з друзями та родиною! Витягніть імена, встановіть бюджети та розповсюдьте веселощі під час свята.",
  "Auto-notify followers": "Автоматично повідомляти підписників",
  "When adding items or creating lists": "При додаванні подарунків або створенні вішлистів",
  "SHARE & INVITE": "Поділитися та запросити",
  "Crowdfunding": "Крофандінг",
  "Help your friends get expensive items by contributing together! Pool money with friends and family for big purchases.":
    "Допоможіть друзям отримати дорогі предмети, збираючи кошти разом! Збирайте кошти з друзями та родиною для великих покупок.",
  "Invite Friends": "Запросити друзів",
  "Add to Wishlist *": "Додати до вішлиста *",
  "Notify friends & followers": "Повідомити друзів та підписників",
  "Hidden in app, accessible by shared link": "Приховано в застосунку, доступно за посиланням",
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
  "Complete to unlock Level": "Виконайте, щоб відкрити Рівень",
  "Share & Invite Friends": "Поділитися і запросити друзів",
  "Maximum Level Reached!": "Досягнуто максимального рівня!",
  "You're a wishbucket Legend. Enjoy unlimited wishlists!":
    "Ви легенда wishbucket. Насолоджуйтеся безлімітними вішлистами!",
  "Newcomer": "Новачок",
  "Explorer": "Дослідник",
  "Collector": "Колекціонер",
  "Legend": "Легенда",
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
};

const REGEX_TRANSLATIONS: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^(\d+)\sitems?$/i, (m) => `${m[1]} подарунків`],
  [/^(\d+)\shints?$/i, (m) => `${m[1]} підказок`],
  [/^All\s\((\d+)\)$/i, (m) => `Усі (${m[1]})`],
  [/^(\d+)\sdays ago$/i, (m) => `${m[1]} дн. тому`],
  [/^No users found for "(.+)"$/i, (m) => `Користувачів за запитом "${m[1]}" не знайдено`],
  [/^Code:\s?/i, () => "Код: "],
  [/^Created at:\s?/i, () => "Створено: "],
  [/^Lv\.(\d+)$/i, (m) => `Рів.${m[1]}`],
  [/^Level\s(\d+)\sunlocks\s(.+)$/i, (m) => `Рівень ${m[1]} відкриває ${translateText(m[2])}`],
  [/^🔓 Unlock at Level\s(\d+)$/i, (m) => `🔓 Відкривається на Рівні ${m[1]}`],
  [/^Progress to Level\s(\d+)\s(.+)$/i, (m) => `Прогрес до Рівня ${m[1]} ${m[2]}`],
  [/^(\d+)\s\/\s(\d+)\sfriends$/i, (m) => `${m[1]} / ${m[2]} друзів`],
  [/^Level\s(\d+)\s–\s(.+)\.\sTap to view progress\.$/i, (m) => `Рівень ${m[1]} — ${translateText(m[2])}. Натисніть, щоб переглянути прогрес.`],
];

let currentLanguage: AppLanguage = "en";
let observer: MutationObserver | null = null;

const normalizeLanguage = (value?: string | null): AppLanguage => {
  const normalized = (value || "").toLowerCase();
  if (normalized.startsWith("uk") || normalized.startsWith("ua")) return "uk";
  if (normalized.startsWith("ru")) return "ru";
  return "en";
};

const getLanguageFromSource = (): AppLanguage => {
  const tgUserLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  const tgLanguage = normalizeLanguage(tgUserLang);
  if (tgLanguage !== "en") return tgLanguage;

  const stored = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
  if (stored !== "en") return stored;

  return tgLanguage;
};

export const getAppLanguage = (): AppLanguage => currentLanguage;

const applyDocumentLanguage = () => {
  document.documentElement.lang = currentLanguage === "uk" ? "uk" : "en";
};

export const translateText = (input: string): string => {
  if (currentLanguage !== "uk" || !input) return input;
  const trimmed = input.trim();
  if (!trimmed) return input;

  if (DIRECT_TRANSLATIONS[trimmed]) {
    return input.replace(trimmed, DIRECT_TRANSLATIONS[trimmed]);
  }

  for (const [regex, handler] of REGEX_TRANSLATIONS) {
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

  if (currentLanguage !== "uk") return;

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

export const setAppLanguage = (language?: string | null) => {
  const nextLanguage = normalizeLanguage(language);
  currentLanguage = nextLanguage;
  localStorage.setItem(STORAGE_KEY, currentLanguage);
  applyDocumentLanguage();

  if (currentLanguage === "uk") {
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
    return;
  }

  observer?.disconnect();
};
