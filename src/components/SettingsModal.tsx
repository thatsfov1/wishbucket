import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hapticFeedback, openTelegramLink } from "../utils/telegram";
import "./SettingsModal.css";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    firstName: string;
    photoUrl?: string;
  } | null;
}

export default function SettingsModal({ isOpen, onClose, user }: SettingsModalProps) {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifyOnAdd, setNotifyOnAdd] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    setIsDarkMode(theme === "dark");
    
    // Load notification preference
    const savedNotifyPref = localStorage.getItem("notifyOnAdd");
    setNotifyOnAdd(savedNotifyPref !== "false");
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
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

  const handleNavigation = (path: string) => {
    hapticFeedback.impact("light");
    handleClose();
    setTimeout(() => navigate(path), 250);
  };

  const handleInvite = () => {
    hapticFeedback.impact("medium");
    openTelegramLink("https://t.me/share/url?url=https://t.me/wishbucket_bot/app?startapp=invite&text=Join me on WishBucket! Create and share wishlists with friends 🎁");
  };

  const handleShareProfile = () => {
    hapticFeedback.impact("medium");
    openTelegramLink("https://t.me/share/url?url=https://t.me/wishbucket_bot&text=Check out my wishlist on WishBucket!");
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`settings-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose}>
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
          <div className="profile-info">
            <h3>{user?.firstName || "Guest"}</h3>
            <p>View profile</p>
          </div>
          <button className="profile-chevron" onClick={() => handleNavigation("/profile")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        {/* Quick Share */}
        <div className="settings-section">
          <h4>Share & Invite</h4>
          <div className="share-row">
            <button className="share-button telegram" onClick={handleInvite}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              Invite Friends
            </button>
            <button className="share-button" onClick={handleShareProfile}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div className="option-label-group">
              <span className="option-label">Auto-notify followers</span>
              <span className="option-sublabel">When adding items or creating lists</span>
            </div>
            <button 
              className={`toggle-switch ${notifyOnAdd ? "active" : ""}`}
              onClick={toggleNotifyOnAdd}
            >
              <div className="toggle-thumb" />
            </button>
          </div>

          <button className="settings-option" onClick={() => handleNavigation("/notifications")}>
            <div className="option-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
                <circle cx="18" cy="5" r="3" fill="var(--coral)" stroke="none" />
              </svg>
            </div>
            <span className="option-label">Notifications</span>
            <svg className="option-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>

          <button className="settings-option" onClick={() => handleNavigation("/profile")}>
            <div className="option-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <span className="option-label">Account Settings</span>
            <svg className="option-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        <div className="settings-section">
          <h4>More</h4>

          <button className="settings-option" onClick={() => handleNavigation("/secret-santa")}>
            <div className="option-icon santa-icon">
              <span>🎄</span>
            </div>
            <span className="option-label">Secret Santa</span>
            <svg className="option-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>

          <button className="settings-option" onClick={() => handleNavigation("/crowdfunding")}>
            <div className="option-icon crowdfund-icon">
              <span>💰</span>
            </div>
            <span className="option-label">Crowdfunding</span>
            <svg className="option-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        <p className="settings-version">WishBucket v1.0.0 · @wishbucket_bot</p>
      </div>
    </div>
  );
}
