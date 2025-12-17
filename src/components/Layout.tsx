import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Avatar from "./Avatar";
import { getTelegramUser } from "../utils/telegram";
import "./Layout.css";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export default function Layout({
  children,
  title,
  showBackButton = true,
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const isHome = location.pathname === "/";
  const telegramUser = getTelegramUser();

  return (
    <div className="layout">
      {!isHome && (
        <header className="header">
          {showBackButton && (
            <button className="back-button" onClick={handleBack}>
              ←
            </button>
          )}
          {title && <h1 className="header-title">{title}</h1>}
          {telegramUser && (
            <div className="header-avatar">
              <Avatar user={telegramUser} size="small" />
            </div>
          )}
        </header>
      )}
      <main className="main-content">{children}</main>
      {!isHome && (
        <nav className="bottom-nav">
          <button
            className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            🏠 Home
          </button>
          <button
            className={`nav-item ${
              location.pathname === "/wishlists" ? "active" : ""
            }`}
            onClick={() => navigate("/wishlists")}
          >
            📝 Wishlists
          </button>
          <button
            className={`nav-item ${
              location.pathname === "/secret-santa" ? "active" : ""
            }`}
            onClick={() => navigate("/secret-santa")}
          >
            🎁 Secret Santa
          </button>
          <button
            className={`nav-item ${
              location.pathname === "/profile" ? "active" : ""
            }`}
            onClick={() => navigate("/profile")}
          >
            👤 Profile
          </button>
        </nav>
      )}
    </div>
  );
}
