import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { hapticFeedback } from "../utils/telegram";
import AddItemModal from "./AddItemModal";
import { useStore } from "../store/useStore";
import { addItem, getWishlists } from "../services/supabase-api";
import "./BottomNavBar.css";

interface NavItem {
  id: string;
  path: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

// SF Symbols style icons
const navItems: NavItem[] = [
  {
    id: "home",
    path: "/",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    activeIcon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L3 9.5V20a1 1 0 001 1h5v-8h6v8h5a1 1 0 001-1V9.5L12 3z" />
      </svg>
    ),
  },
  {
    id: "friends",
    path: "/friends",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 20v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
        <circle cx="17" cy="7" r="2.5" />
        <path d="M21 20v-1a3 3 0 00-2-2.83" />
      </svg>
    ),
    activeIcon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 20v-1a4 4 0 014-4h4a4 4 0 014 4v1H3z" />
        <circle cx="17" cy="7" r="2.5" />
        <path d="M21 20v-1a3 3 0 00-2-2.83 3 3 0 00-1-.17h-1v4h4z" />
      </svg>
    ),
  },
  {
    id: "add",
    path: "",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    id: "search",
    path: "/inspiration",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    activeIcon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="7" fillOpacity="0.2" />
        <circle cx="11" cy="11" r="7" fill="none" />
        <path d="M21 21l-4.35-4.35" fill="none" />
      </svg>
    ),
  },
  {
    id: "gift",
    path: "/find-gift",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="13" rx="1" />
        <path d="M12 8v13" />
        <path d="M3 12h18" />
        <path d="M12 8c-1.5-2-4-2.5-4.5 0S12 8 12 8z" />
        <path d="M12 8c1.5-2 4-2.5 4.5 0S12 8 12 8z" />
      </svg>
    ),
    activeIcon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 8h18v13a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
        <path d="M3 12h8v10H4a1 1 0 01-1-1v-9z" fill="currentColor" fillOpacity="0.7" />
        <path d="M13 12h8v9a1 1 0 01-1 1h-7V12z" fill="currentColor" />
        <path d="M12 8c-1.5-2-4-2.5-4.5 0S12 8 12 8z" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M12 8c1.5-2 4-2.5 4.5 0S12 8 12 8z" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <rect x="11" y="8" width="2" height="14" fill="var(--bg-secondary)" />
        <rect x="3" y="11" width="18" height="2" fill="var(--bg-secondary)" />
      </svg>
    ),
  },
];

export default function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const { wishlists, setWishlists } = useStore();

  const handleNavClick = (item: NavItem) => {
    hapticFeedback.impact("light");
    if (item.id === "add") {
      setShowAddModal(true);
    } else {
      navigate(item.path);
    }
  };

  const isActive = (item: NavItem) => {
    if (item.id === "add") return false;
    if (item.path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(item.path);
  };

  const handleAddItem = async (itemData: {
    name: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    currency: string;
    url?: string;
    wishlistIds: string[];
    notifyFollowers: boolean;
  }) => {
    try {
      // Add item to all selected wishlists with notifyFollowers flag
      for (const wishlistId of itemData.wishlistIds) {
        await addItem(
          wishlistId, 
          {
            wishlistId,
            name: itemData.name,
            description: itemData.description,
            url: itemData.url || "",
            originalUrl: itemData.url || "",
            imageUrl: itemData.imageUrl,
            price: itemData.price,
            currency: itemData.currency,
            priority: "medium",
            status: "available",
          },
          itemData.notifyFollowers
        );
      }
      // Refresh wishlists
      const updated = await getWishlists();
      setWishlists(updated);
      hapticFeedback.notification("success");
    } catch (error) {
      console.error("Error adding item:", error);
      hapticFeedback.notification("error");
    }
  };

  return (
    <>
      <nav className="bottom-navbar">
        <div className="nav-container">
          {navItems.map((item) => {
            const active = isActive(item);
            const isCenter = item.id === "add";
            
            return (
              <button
                key={item.id}
                className={`nav-btn ${active ? "active" : ""} ${isCenter ? "center-btn" : ""}`}
                onClick={() => handleNavClick(item)}
                aria-label={item.id}
              >
                {isCenter ? (
                  <div className="center-icon">
                    {item.icon}
                  </div>
                ) : (
                  <div className="icon-wrapper">
                    <div className={`icon ${active ? "active" : ""}`}>
                      {active ? item.activeIcon : item.icon}
                    </div>
                    {active && <div className="active-dot" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddItem={handleAddItem}
      />
    </>
  );
}
