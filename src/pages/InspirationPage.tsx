import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hapticFeedback } from "../utils/telegram";
import BottomNavBar from "../components/BottomNavBar";
import "./InspirationPage.css";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface TrendingItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  popularity: number;
}

const categories: Category[] = [
  { id: "tech", name: "Tech", icon: "💻", color: "#5c5ce0" },
  { id: "fashion", name: "Fashion", icon: "👗", color: "#e05c8c" },
  { id: "home", name: "Home", icon: "🏠", color: "#5ce0a5" },
  { id: "beauty", name: "Beauty", icon: "✨", color: "#e0c05c" },
  { id: "sports", name: "Sports", icon: "⚽", color: "#e08c5c" },
  { id: "books", name: "Books", icon: "📚", color: "#8c5ce0" },
];

const trendingItems: TrendingItem[] = [
  {
    id: "1",
    name: "Apple AirPods Pro 2",
    price: 249,
    currency: "$",
    image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=800&hei=800&fmt=jpeg&qlt=90",
    category: "Tech",
    popularity: 98,
  },
  {
    id: "2",
    name: "Sony WH-1000XM5",
    price: 399,
    currency: "$",
    image: "https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg",
    category: "Tech",
    popularity: 95,
  },
  {
    id: "3",
    name: "Kindle Paperwhite",
    price: 149,
    currency: "$",
    image: "https://m.media-amazon.com/images/I/61Ww4abGclL._AC_SL1000_.jpg",
    category: "Tech",
    popularity: 92,
  },
];

export default function InspirationPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    hapticFeedback.selection();
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleAddToWishlist = (item: TrendingItem) => {
    hapticFeedback.notification("success");
    // In real implementation, this would add the item to user's wishlist
    navigate(`/wishlists?action=add&item=${encodeURIComponent(JSON.stringify(item))}`);
  };

  return (
    <div className="inspiration-container">
      {/* Header */}
      <header className="inspiration-header">
        <h1>Inspiration</h1>
        <p>Discover trending gifts and ideas</p>
      </header>

      {/* Categories */}
      <section className="categories-section">
        <h2>Categories</h2>
        <div className="categories-grid">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? "active" : ""}`}
              style={{ "--cat-color": cat.color } as React.CSSProperties}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trending Section */}
      <section className="trending-section">
        <div className="section-header">
          <h2>Trending Now 🔥</h2>
          <button className="see-all-btn">See all</button>
        </div>
        <div className="trending-list">
          {trendingItems.map((item) => (
            <div key={item.id} className="trending-card">
              <div className="trending-image">
                <img src={item.image} alt={item.name} />
                <span className="popularity-badge">
                  🔥 {item.popularity}%
                </span>
              </div>
              <div className="trending-info">
                <span className="trending-category">{item.category}</span>
                <h3>{item.name}</h3>
                <div className="trending-footer">
                  <span className="trending-price">{item.currency}{item.price}</span>
                  <button
                    className="add-to-wishlist-btn"
                    onClick={() => handleAddToWishlist(item)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collections */}
      <section className="collections-section">
        <h2>Gift Collections</h2>
        <div className="collections-scroll">
          <div className="collection-card" style={{ background: "linear-gradient(135deg, #ff6b6b, #ee5a5a)" }}>
            <span className="collection-icon">🎄</span>
            <h3>Holiday Gifts</h3>
            <p>Perfect presents for the season</p>
          </div>
          <div className="collection-card" style={{ background: "linear-gradient(135deg, #a855f7, #9333ea)" }}>
            <span className="collection-icon">🎂</span>
            <h3>Birthday Ideas</h3>
            <p>Make their day special</p>
          </div>
          <div className="collection-card" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            <span className="collection-icon">💝</span>
            <h3>Romantic Gifts</h3>
            <p>Show your love</p>
          </div>
        </div>
      </section>

      <BottomNavBar />
    </div>
  );
}


