import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hapticFeedback, openTelegramLink } from "../utils/telegram";
import { getUserProfile, updateUserProfile } from "../services/supabase-api";
import "./SettingsModal.css";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    firstName: string;
    photoUrl?: string;
  } | null;
}

export default function SettingsModal({
  isOpen,
  onClose,
  user,
}: SettingsModalProps) {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifyOnAdd, setNotifyOnAdd] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [birthday, setBirthday] = useState("");
  const [savedBirthday, setSavedBirthday] = useState("");
  const [isSavingBirthday, setIsSavingBirthday] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const theme = document.documentElement.getAttribute("data-theme");
    setIsDarkMode(theme === "dark");

    // Load notification preference
    const savedNotifyPref = localStorage.getItem("notifyOnAdd");
    setNotifyOnAdd(savedNotifyPref !== "false");

    // Load default currency
    const savedCurrency = localStorage.getItem("defaultCurrency");
    if (savedCurrency) {
      setDefaultCurrency(savedCurrency);
    }

    const loadBirthday = async () => {
      try {
        const profile = await getUserProfile();
        const profileBirthday = profile.birthday || "";
        setBirthday(profileBirthday);
        setSavedBirthday(profileBirthday);
      } catch (error) {
        console.error("Error loading birthday:", error);
      }
    };

    loadBirthday();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    hapticFeedback.impact("light");
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  const toggleTheme = () => {
    hapticFeedback.impact("medium");
    const newTheme = isDarkMode ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setIsDarkMode(!isDarkMode);
  };

  const toggleNotifyOnAdd = () => {
    hapticFeedback.selection();
    const newValue = !notifyOnAdd;
    setNotifyOnAdd(newValue);
    localStorage.setItem("notifyOnAdd", String(newValue));
  };

  const handleCurrencyChange = (currencyCode: string) => {
    hapticFeedback.selection();
    setDefaultCurrency(currencyCode);
    localStorage.setItem("defaultCurrency", currencyCode);
    setShowCurrencyPicker(false);
  };

  const handleNavigation = (path: string) => {
    hapticFeedback.impact("light");
    handleClose();
    setTimeout(() => navigate(path), 250);
  };

  const handleSaveBirthday = async () => {
    try {
      setIsSavingBirthday(true);
      const updated = await updateUserProfile({
        birthday: birthday || undefined,
      });
      const updatedBirthday = updated.birthday || "";
      setBirthday(updatedBirthday);
      setSavedBirthday(updatedBirthday);
    } catch (error) {
      console.error("Error updating birthday:", error);
    } finally {
      setIsSavingBirthday(false);
    }
  };

  const handleInvite = () => {
    hapticFeedback.impact("medium");
    openTelegramLink(
      "https://t.me/share/url?url=https://t.me/wishbucket_bot/app?startapp=invite&text=Join me on WishBucket! Create and share wishlists with friends 🎁",
    );
  };

  const handleShareProfile = () => {
    hapticFeedback.impact("medium");
    openTelegramLink(
      "https://t.me/share/url?url=https://t.me/wishbucket_bot&text=Check out my wishlist on WishBucket!",
    );
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`settings-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`settings-modal ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        {/* User Profile Section */}
        <div className="settings-profile">
          <div className="profile-avatar">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.firstName} />
            ) : (
              <span>{user?.firstName?.[0]?.toUpperCase() || "U"}</span>
            )}
          </div>
          <div className="birthday-editor">
            <div className="birthday-editor-head">
              <h3>{user?.firstName || "Guest"}</h3>
              <span className="birthday-editor-label">Birthday</span>
            </div>
            <div className="birthday-editor-row">
              <input
                className="birthday-input"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                max="9999-12-31"
              />
              <button
                className="birthday-save-btn"
                onClick={handleSaveBirthday}
                disabled={isSavingBirthday || birthday === savedBirthday}
              >
                {isSavingBirthday ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Default Currency */}
        <div className="settings-section currency-section">
          <h4>Default Currency</h4>
          <button
            className="currency-selector-btn"
            onClick={() => {
              setShowCurrencyPicker(!showCurrencyPicker);
              hapticFeedback.selection();
            }}
          >
            <div className="currency-display">
              <span className="currency-symbol">
                {CURRENCIES.find(c => c.code === defaultCurrency)?.symbol}
              </span>
              <span className="currency-name">
                {CURRENCIES.find(c => c.code === defaultCurrency)?.name}
              </span>
            </div>
            <svg
              className={`currency-chevron ${showCurrencyPicker ? "open" : ""}`}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>
          {showCurrencyPicker && (
            <div className="currency-options">
              {CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  className={`currency-option ${defaultCurrency === currency.code ? "selected" : ""}`}
                  onClick={() => handleCurrencyChange(currency.code)}
                >
                  <span className="option-symbol">{currency.symbol}</span>
                  <span className="option-name">{currency.name}</span>
                  <span className="option-code">{currency.code}</span>
                  {defaultCurrency === currency.code && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Share */}
        <div className="settings-section">
          <h4>Share & Invite</h4>
          <div className="share-row">
            <button className="share-button telegram" onClick={handleInvite}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              Invite Friends
            </button>
            <button className="share-button" onClick={handleShareProfile}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16,6 12,2 8,6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* Settings Options */}
        <div className="settings-section">
          <h4>Preferences</h4>

          <div className="settings-option">
            <div className="option-icon theme-icon">
              {isDarkMode ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </div>
            <span className="option-label">Dark Mode</span>
            <button
              className={`toggle-switch ${isDarkMode ? "active" : ""}`}
              onClick={toggleTheme}
            >
              <div className="toggle-thumb" />
            </button>
          </div>

          <div className="settings-option">
            <div className="option-icon notify-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div className="option-label-group">
              <span className="option-label">Auto-notify followers</span>
              <span className="option-sublabel">
                When adding items or creating lists
              </span>
            </div>
            <button
              className={`toggle-switch ${notifyOnAdd ? "active" : ""}`}
              onClick={toggleNotifyOnAdd}
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h4>Rewards</h4>

          <button
            className="settings-option"
            onClick={() => handleNavigation("/hints")}
          >
            <div className="option-icon hints-icon">
              <span>💡</span>
            </div>
            <span className="option-label">Gift Hints</span>
            <svg
              className="option-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>

          <button
            className="settings-option"
            onClick={() => handleNavigation("/market")}
          >
            <div className="option-icon market-icon">
              <span>🎁</span>
            </div>
            <span className="option-label">Gift Shop</span>
            <svg
              className="option-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>

          <button
            className="settings-option"
            onClick={() => handleNavigation("/tasks")}
          >
            <div className="option-icon tasks-icon">
              <span>⭐</span>
            </div>
            <span className="option-label">Earn Points</span>
            <svg
              className="option-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        <div className="settings-section">
          <h4>More</h4>

          <button
            className="settings-option"
            onClick={() => handleNavigation("/secret-santa")}
          >
            <div className="option-icon santa-icon">
              <span>🎄</span>
            </div>
            <span className="option-label">Secret Santa</span>
            <svg
              className="option-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>

          <button
            className="settings-option"
            onClick={() => handleNavigation("/crowdfunding")}
          >
            <div className="option-icon crowdfund-icon">
              <span>💰</span>
            </div>
            <span className="option-label">Crowdfunding</span>
            <svg
              className="option-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        <div className="settings-footer">
          <p className="settings-version">WishBucket v1.0.0</p>
          <p className="settings-credits">
            made by{" "}
            <button
              className="dev-link"
              onClick={() => {
                hapticFeedback.impact("light");
                openTelegramLink("https://t.me/thatsfov1");
              }}
            >
              @thatsfov1
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
