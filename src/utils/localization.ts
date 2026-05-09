export type AppLanguage = "en" | "uk" | "ru";

const STORAGE_KEY = "wb_app_language";

const DIRECT_TRANSLATIONS: Record<string, string> = {
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
  "Add Item": "Додати подарунок",
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
  "Description (optional)": "Опис (необов'язково)",
  Priority: "Пріоритет",
  Low: "Низький",
  Medium: "Середній",
  High: "Високий",
  "➕ Add Item": "➕ Додати подарунок",
  "Save Changes": "Зберегти зміни",
  "Wishlist Name *": "Назва вішлиста *",
  "What's this wishlist for?": "Для чого цей вішлист?",
  "Cover Image": "Обкладинка",
  "Event Date": "Дата події",
  "Only you can see this wishlist": "Лише ви бачите цей вішлист",
  "Anyone with link": "Усі за посиланням",
  "Hidden in app, accessible by shared link":
    "Приховано в застосунку, доступно за посиланням",
  "Visible to everyone in app and by link":
    "Видно всім у застосунку та за посиланням",
  Private: "Приватний",
  "Loading...": "Завантаження...",
  Today: "Сьогодні",
  Yesterday: "Вчора",
};

const REGEX_TRANSLATIONS: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^(\d+)\sitems?$/i, (m) => `${m[1]} подарунків`],
  [/^(\d+)\shints?$/i, (m) => `${m[1]} підказок`],
  [/^All\s\((\d+)\)$/i, (m) => `Усі (${m[1]})`],
  [/^(\d+)\sdays ago$/i, (m) => `${m[1]} дн. тому`],
  [/^No users found for "(.+)"$/i, (m) => `Користувачів за запитом "${m[1]}" не знайдено`],
  [/^Code:\s?/i, () => "Код: "],
  [/^Created at:\s?/i, () => "Створено: "],
];

let currentLanguage: AppLanguage = "en";
let observer: MutationObserver | null = null;

const normalizeLanguage = (value?: string | null): AppLanguage => {
  const normalized = (value || "").toLowerCase();
  if (normalized.startsWith("uk")) return "uk";
  if (normalized.startsWith("ru")) return "ru";
  return "en";
};

const getLanguageFromSource = (): AppLanguage => {
  const stored = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
  if (stored !== "en") return stored;
  const tgUserLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  return normalizeLanguage(tgUserLang);
};

export const getAppLanguage = (): AppLanguage => currentLanguage;

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
  document.documentElement.lang = currentLanguage === "uk" ? "uk" : "en";

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
