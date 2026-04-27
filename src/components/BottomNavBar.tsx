import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { hapticFeedback } from "../utils/telegram";
import AddItemModal from "./AddItemModal";
import { useStore } from "../store/useStore";
import { addItemToMultipleWishlists, getWishlists } from "../services/supabase-api";
import { generateAffiliateLink } from "../utils/affiliate";
import "./BottomNavBar.css";
import { GoHomeFill } from "react-icons/go";
import { BsPeopleFill, BsSearch, BsGiftFill } from "react-icons/bs";
import { PiPlusBold } from "react-icons/pi";
import { IoSearch } from "react-icons/io5";


interface NavItem {
  id: string;
  path: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "home",
    path: "/",
    icon: <GoHomeFill size={26} />,
    activeIcon: <GoHomeFill size={26} />,
  },
  {
    id: "friends",
    path: "/friends",
    icon: <BsPeopleFill size={26} />,
    activeIcon: <BsPeopleFill size={26} />,
  },
  {
    id: "add",
    path: "",
    icon: <PiPlusBold size={24} />,
    activeIcon: <PiPlusBold size={24} />,
  },
  {
    id: "search",
    path: "/inspiration",
    icon: <IoSearch size={26} />,
    activeIcon: <IoSearch size={26} />,
  },
  {
    id: "gift",
    path: "/find-gift",
    icon: <BsGiftFill size={26} />,
    activeIcon: <BsGiftFill size={26} />,
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
      const cleanUrl = itemData.url?.trim() || "";
      const affiliateResult = cleanUrl
        ? generateAffiliateLink(cleanUrl)
        : { affiliateUrl: cleanUrl, hasAffiliate: false as const };
      const finalUrl = affiliateResult.affiliateUrl || cleanUrl;

      // Add item to all selected wishlists with a single notification
      await addItemToMultipleWishlists(
        itemData.wishlistIds,
        {
          name: itemData.name,
          description: itemData.description,
          url: finalUrl,
          imageUrl: itemData.imageUrl,
          price: itemData.price,
          currency: itemData.currency,
          priority: "medium",
          status: "available",
        },
        itemData.notifyFollowers,
      );
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
                  <div className="center-icon">{item.icon}</div>
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
