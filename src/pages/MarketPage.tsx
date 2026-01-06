import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { hapticFeedback, showTelegramAlert } from "../utils/telegram";
import {
  MARKET_CATEGORIES,
  getActiveMarketItems,
  getItemsByCategory,
  isItemLocked,
  canPurchaseItem,
  MarketCategory,
  MarketItem,
} from "../config/market";
import BottomNavBar from "../components/BottomNavBar";
import "./MarketPage.css";

export default function MarketPage() {
  const navigate = useNavigate();
  const { userProfile } = useStore();
  const [activeCategory, setActiveCategory] = useState<MarketCategory | "all">(
    "all"
  );
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

  const userPoints = userProfile?.bonusPoints || 0;

  const getDisplayItems = () => {
    if (activeCategory === "all") {
      return getActiveMarketItems();
    }
    return getItemsByCategory(activeCategory);
  };

  const handleCategoryChange = (category: MarketCategory | "all") => {
    hapticFeedback.selection();
    setActiveCategory(category);
  };

  const handleItemClick = (item: MarketItem) => {
    hapticFeedback.impact("light");

    if (isItemLocked(item, userPoints)) {
      showTelegramAlert(
        `🔒 Locked! You need ${item.unlockThreshold} points to unlock this item. Keep inviting friends!`
      );
      return;
    }

    setSelectedItem(item);
  };

  const handlePurchase = (item: MarketItem) => {
    hapticFeedback.impact("medium");

    const result = canPurchaseItem(item, userPoints);
    if (!result.canPurchase) {
      showTelegramAlert(result.reason || "Cannot purchase this item");
      return;
    }

    // TODO: Implement actual purchase logic via API
    showTelegramAlert(
      `🎁 You purchased ${item.name}! This feature is coming soon.`
    );
    setSelectedItem(null);
  };

  const handleCloseModal = () => {
    hapticFeedback.impact("light");
    setSelectedItem(null);
  };

  const renderItem = (item: MarketItem) => {
    const locked = isItemLocked(item, userPoints);
    const affordable = userPoints >= item.pointsCost;

    return (
      <div
        key={item.id}
        className={`market-item ${locked ? "locked" : ""} ${
          !affordable && !locked ? "not-affordable" : ""
        }`}
        onClick={() => handleItemClick(item)}
      >
        {locked && (
          <div className="lock-overlay">
            <span className="lock-icon">🔒</span>
            <span className="lock-text">{item.unlockThreshold} pts</span>
          </div>
        )}
        <div className="item-emoji">{item.emoji}</div>
        <h4 className="item-name">{item.name}</h4>
        <div className="item-price">
          <span className="price-icon">💎</span>
          <span className="price-value">{item.pointsCost}</span>
        </div>
        {item.stock !== null && (
          <div className="item-stock">{item.stock} left</div>
        )}
      </div>
    );
  };

  return (
    <div className="market-container">
      {/* Header */}
      <header className="market-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <h1>Gift Shop</h1>
        <div className="header-points">
          <span className="points-icon">💎</span>
          <span className="points-value">{userPoints}</span>
        </div>
      </header>

      {/* Points Banner */}
      <div className="points-banner">
        <div className="banner-content">
          <div className="banner-icon">🎁</div>
          <div className="banner-text">
            <h3>Your Points</h3>
            <p className="points-amount">{userPoints} points</p>
          </div>
        </div>
        <button className="earn-more-btn" onClick={() => navigate("/tasks")}>
          Earn More
        </button>
      </div>

      {/* Categories */}
      <div className="market-categories">
        <button
          className={`category-btn ${activeCategory === "all" ? "active" : ""}`}
          onClick={() => handleCategoryChange("all")}
        >
          All
        </button>
        {MARKET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${
              activeCategory === cat.id ? "active" : ""
            }`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="market-content">
        {activeCategory === "all" ? (
          MARKET_CATEGORIES.map((category) => {
            const items = getItemsByCategory(category.id);
            if (items.length === 0) return null;

            return (
              <div key={category.id} className="category-section">
                <div className="section-header">
                  <span className="section-emoji">{category.emoji}</span>
                  <h2>{category.name}</h2>
                </div>
                <div className="items-grid">{items.map(renderItem)}</div>
              </div>
            );
          })
        ) : (
          <div className="items-grid">{getDisplayItems().map(renderItem)}</div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedItem && (
        <div className="purchase-modal-overlay" onClick={handleCloseModal}>
          <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseModal}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-item-preview">
              <span className="preview-emoji">{selectedItem.emoji}</span>
            </div>

            <h2>{selectedItem.name}</h2>
            <p className="item-description">{selectedItem.description}</p>

            <div className="modal-price">
              <span className="price-icon">💎</span>
              <span className="price-value">{selectedItem.pointsCost}</span>
              <span className="price-label">points</span>
            </div>

            <div className="modal-balance">
              Your balance: <strong>{userPoints}</strong> points
            </div>

            {userPoints >= selectedItem.pointsCost ? (
              <button
                className="purchase-btn"
                onClick={() => handlePurchase(selectedItem)}
              >
                Purchase
              </button>
            ) : (
              <div className="not-enough">
                <p>
                  You need {selectedItem.pointsCost - userPoints} more points
                </p>
                <button
                  className="earn-btn"
                  onClick={() => {
                    handleCloseModal();
                    navigate("/tasks");
                  }}
                >
                  Earn Points
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
}
