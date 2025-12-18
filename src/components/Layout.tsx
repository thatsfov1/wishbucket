import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNavBar from "./BottomNavBar";
import "./Layout.css";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showNavBar?: boolean;
}

export default function Layout({
  children,
  title,
  showBackButton = true,
  showNavBar = true,
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

  // Pages that use custom layouts (no header needed)
  const customLayoutPages = ["/", "/friends", "/inspiration", "/find-gift"];
  const isCustomLayout = customLayoutPages.includes(location.pathname);

  if (isCustomLayout) {
    return (
      <div className="layout custom-layout">
        <main className="main-content no-header">{children}</main>
        {showNavBar && <BottomNavBar />}
      </div>
    );
  }

  return (
    <div className="layout">
      <header className="header">
        {showBackButton && (
          <button className="back-button" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
        )}
        {title && <h1 className="header-title">{title}</h1>}
      </header>
      <main className="main-content">{children}</main>
      {showNavBar && <BottomNavBar />}
    </div>
  );
}
