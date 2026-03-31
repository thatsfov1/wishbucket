import { useState, useMemo } from "react";
import { hapticFeedback } from "../utils/telegram";
import BottomNavBar from "../components/BottomNavBar";
import PickWishlistModal from "../components/PickWishlistModal";
import type { PrefilledGiftItem } from "../components/PickWishlistModal";
import { giftCatalog, GiftItem } from "../data/giftCatalog";
import "./InspirationPage.css";

interface Category {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: "all",      name: "All",       icon: "✨" },
  { id: "tech",     name: "Tech",      icon: "💻" },
  { id: "fashion",  name: "Fashion",   icon: "👗" },
  { id: "home",     name: "Home",      icon: "🏠" },
  { id: "beauty",   name: "Beauty",    icon: "💆" },
  { id: "wellness", name: "Wellness",  icon: "🧘" },
  { id: "food",     name: "Food",      icon: "🍽️" },
  { id: "outdoors", name: "Outdoors",  icon: "🏕️" },
  { id: "creative", name: "Creative",  icon: "🎨" },
  { id: "gaming",   name: "Gaming",    icon: "🎮" },
  { id: "books",    name: "Books",     icon: "📚" },
];

interface Collection {
  id: string;
  label: string;
  icon: string;
  gradient: string;
  filter: (item: GiftItem) => boolean;
}

const collections: Collection[] = [
  {
    id: "under50",
    label: "Under $50",
    icon: "💵",
    gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
    filter: (i) => i.price < 50,
  },
  {
    id: "romantic",
    label: "Romantic",
    icon: "❤️",
    gradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
    filter: (i) => i.vibes.includes("romantic"),
  },
  {
    id: "cozy",
    label: "Cozy Vibes",
    icon: "🛋️",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    filter: (i) => i.vibes.includes("cozy"),
  },
  {
    id: "adventure",
    label: "Adventurous",
    icon: "🗺️",
    gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    filter: (i) => i.vibes.includes("adventurous"),
  },
  {
    id: "unique",
    label: "Unique Finds",
    icon: "✨",
    gradient: "linear-gradient(135deg, #a855f7, #7e22ce)",
    filter: (i) => i.vibes.includes("unique"),
  },
  {
    id: "luxury",
    label: "Luxury",
    icon: "👑",
    gradient: "linear-gradient(135deg, #eab308, #a16207)",
    filter: (i) => i.priceRange === "luxury" || i.vibes.includes("luxury"),
  },
];

export default function InspirationPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pickerItem, setPickerItem] = useState<PrefilledGiftItem | null>(null);

  const handleCategoryClick = (id: string) => {
    hapticFeedback.selection();
    setActiveCategory(id);
    setActiveCollection(null);
  };

  const handleCollectionClick = (col: Collection) => {
    hapticFeedback.selection();
    if (activeCollection === col.id) {
      setActiveCollection(null);
    } else {
      setActiveCollection(col.id);
      setActiveCategory("all");
    }
  };

  const handleAdd = (item: GiftItem) => {
    hapticFeedback.impact("medium");
    setPickerItem({
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      emoji: item.emoji,
      price: item.price,
      currency: "$",
      url: item.url,
    });
  };

  const filteredItems = useMemo(() => {
    const col = collections.find((c) => c.id === activeCollection);
    if (col) return giftCatalog.filter(col.filter);
    if (activeCategory === "all") return giftCatalog;
    return giftCatalog.filter((i) => i.categories.includes(activeCategory));
  }, [activeCategory, activeCollection]);

  const activeCol = collections.find((c) => c.id === activeCollection);

  return (
    <div className="inspiration-container">
      {/* Header */}
      <header className="insp-header">
        <div>
          <h1>Inspiration</h1>
          <p>Discover great gift ideas</p>
        </div>
      </header>

      {/* Collections row */}
      <section className="insp-collections-section">
        <h2 className="insp-section-title">Collections</h2>
        <div className="insp-collections-scroll">
          {collections.map((col) => (
            <button
              key={col.id}
              className={`insp-collection-chip ${activeCollection === col.id ? "active" : ""}`}
              style={{ "--col-gradient": col.gradient } as React.CSSProperties}
              onClick={() => handleCollectionClick(col)}
            >
              <span className="insp-chip-icon">{col.icon}</span>
              <span className="insp-chip-label">{col.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Category pills */}
      <section className="insp-categories-section">
        <div className="insp-category-scroll">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`insp-cat-pill ${activeCategory === cat.id && !activeCollection ? "active" : ""}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Items grid */}
      <section className="insp-items-section">
        <div className="insp-items-header">
          <h2 className="insp-section-title">
            {activeCol
              ? `${activeCol.icon} ${activeCol.label}`
              : activeCategory === "all"
              ? "All Gifts 🎁"
              : `${categories.find((c) => c.id === activeCategory)?.icon} ${categories.find((c) => c.id === activeCategory)?.name}`}
          </h2>
          <span className="insp-item-count">{filteredItems.length} items</span>
        </div>

        <div className="insp-grid">
          {filteredItems.map((item, i) => (
            <div
              key={item.id}
              className="insp-card"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="insp-card-image">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <span className="insp-card-emoji">{item.emoji}</span>
                )}
              </div>
              <div className="insp-card-body">
                <span className="insp-card-category">
                  {item.categories[0]}
                </span>
                <h3 className="insp-card-name">{item.name}</h3>
                <p className="insp-card-desc">{item.description}</p>
                <div className="insp-card-footer">
                  <span className="insp-card-price">~${item.price}</span>
                  <button
                    className={`insp-add-btn ${addedIds.has(item.id) ? "added" : ""}`}
                    onClick={() => handleAdd(item)}
                  >
                    {addedIds.has(item.id) ? (
                      "✓"
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="insp-empty">
            <span>🔍</span>
            <p>No gifts in this category yet.</p>
          </div>
        )}
      </section>

      <BottomNavBar />

      <PickWishlistModal
        isOpen={!!pickerItem}
        item={pickerItem}
        onClose={() => setPickerItem(null)}
        onAdded={() => {
          if (pickerItem) {
            // find the catalog item id to mark as added
            const match = giftCatalog.find((g) => g.name === pickerItem.name);
            if (match) setAddedIds((prev) => new Set([...prev, match.id]));
          }
        }}
      />
    </div>
  );
}
