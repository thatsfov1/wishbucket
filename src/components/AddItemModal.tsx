import { useState, useEffect, useRef, useCallback } from "react";
import { hapticFeedback } from "../utils/telegram";
import { useStore } from "../store/useStore";
import { createWishlist, scrapeProductUrl } from "../services/supabase-api";
import "./AddItemModal.css";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: {
    name: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    currency: string;
    url?: string;
    wishlistIds: string[];
    notifyFollowers: boolean;
  }) => void;
  preselectedWishlistId?: string;
}

const currencies = ["$", "€", "£", "₴", "₽", "¥", "₿"];
const defaultEmojis = ["🎁", "📱", "👟", "👗", "💄", "🎮", "📚", "🎧"];

export default function AddItemModal({
  isOpen,
  onClose,
  onAddItem,
  preselectedWishlistId,
}: AddItemModalProps) {
  const { wishlists, addWishlist } = useStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🎁");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("$");
  const [url, setUrl] = useState("");
  const [selectedWishlists, setSelectedWishlists] = useState<string[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [notifyFollowers, setNotifyFollowers] = useState(true);

  // Quick wishlist creation
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [isCreatingWishlist, setIsCreatingWishlist] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL scraping state
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [currencyAutoDetected, setCurrencyAutoDetected] = useState<
    string | null
  >(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrapedUrlRef = useRef<string>("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setName("");
      setDescription("");
      setSelectedEmoji("🎁");
      setCustomImage(null);
      setPrice("");
      setCurrency("$");
      setUrl("");
      setSelectedWishlists(
        preselectedWishlistId ? [preselectedWishlistId] : [],
      );
      setShowQuickCreate(false);
      setNewWishlistName("");
      // Reset scraping state
      setIsScrapingUrl(false);
      setScrapeError(null);
      setCurrencyAutoDetected(null);
      lastScrapedUrlRef.current = "";
      // Load user's notification preference
      const savedNotifyPref = localStorage.getItem("notifyOnAdd");
      setNotifyFollowers(savedNotifyPref !== "false");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isOpen, preselectedWishlistId]);

  // Auto-scrape URL when pasted/changed
  const scrapeUrl = useCallback(
    async (urlToScrape: string) => {
      if (!urlToScrape.trim()) return;

      // Validate URL
      try {
        new URL(urlToScrape);
      } catch {
        return; // Invalid URL, don't scrape
      }

      setIsScrapingUrl(true);
      setScrapeError(null);

      try {
        console.log("🔍 Auto-scraping URL:", urlToScrape);
        const result = await scrapeProductUrl(urlToScrape);
        console.log("✅ Scrape result:", result);

        lastScrapedUrlRef.current = urlToScrape;

        if (
          result.title ||
          result.imageUrl ||
          result.price ||
          result.description
        ) {
          // Auto-fill fields if they're empty
          if (result.title && !name) {
            setName(result.title);
          }
          if (result.description && !description) {
            setDescription(result.description);
          }
          if (result.price && !price) {
            setPrice(result.price.toString());
          }
          if (result.imageUrl && !customImage) {
            setCustomImage(result.imageUrl);
            setSelectedEmoji("");
          }
          // Map currency symbol
          if (result.currency) {
            const currencyMap: Record<string, string> = {
              USD: "$",
              EUR: "€",
              GBP: "£",
              UAH: "₴",
              RUB: "₽",
              JPY: "¥",
              CNY: "¥",
            };
            const detectedSymbol = currencyMap[result.currency] || "$";
            setCurrency(detectedSymbol);
            // Only show notification if currency is different from default
            if (detectedSymbol !== "$") {
              setCurrencyAutoDetected(result.currency);
            }
          }

          hapticFeedback.notification("success");
        } else {
          // No useful data found
          setScrapeError("Could not find product info. Fill manually.");
        }
      } catch (error) {
        console.error("❌ Error scraping URL:", error);
        setScrapeError("Could not fetch product info");
      } finally {
        setIsScrapingUrl(false);
      }
    },
    [name, description, price, customImage],
  );

  // Effect to auto-scrape when URL changes
  useEffect(() => {
    const urlValue = url.trim();

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only scrape if URL is valid and different from last scraped
    if (urlValue && urlValue !== lastScrapedUrlRef.current) {
      try {
        new URL(urlValue);
        // Debounce to avoid too many requests while typing
        debounceTimerRef.current = setTimeout(() => {
          scrapeUrl(urlValue);
        }, 500);
      } catch {
        // Invalid URL, don't scrape
      }
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [url, scrapeUrl]);

  const handleClose = () => {
    setIsClosing(true);
    hapticFeedback.impact("light");
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  const handleAdd = () => {
    if (!name.trim()) {
      hapticFeedback.notification("error");
      return;
    }
    if (selectedWishlists.length === 0) {
      hapticFeedback.notification("error");
      return;
    }

    hapticFeedback.notification("success");
    onAddItem({
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: customImage || selectedEmoji,
      price: price ? parseFloat(price) : undefined,
      currency,
      url: url.trim() || undefined,
      wishlistIds: selectedWishlists,
      notifyFollowers,
    });
    handleClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        setSelectedEmoji("");
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleWishlist = (wishlistId: string) => {
    hapticFeedback.selection();
    setSelectedWishlists((prev) =>
      prev.includes(wishlistId)
        ? prev.filter((id) => id !== wishlistId)
        : [...prev, wishlistId],
    );
  };

  const handleQuickCreateWishlist = async () => {
    if (!newWishlistName.trim()) {
      hapticFeedback.notification("error");
      return;
    }

    try {
      setIsCreatingWishlist(true);
      const newWishlist = await createWishlist({
        name: newWishlistName.trim(),
        description: "",
        isPublic: true,
        isDefault: wishlists.length === 0,
        userId: 0,
      });
      addWishlist(newWishlist);
      setSelectedWishlists([newWishlist.id]);
      setShowQuickCreate(false);
      setNewWishlistName("");
      hapticFeedback.notification("success");
    } catch (error) {
      console.error("Error creating wishlist:", error);
      hapticFeedback.notification("error");
    } finally {
      setIsCreatingWishlist(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  const hasNoWishlists = wishlists.length === 0;

  return (
    <div
      className={`modal-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`add-item-modal ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        <div className="modal-header">
          <h2>Add Item</h2>
          <p>Add a new item to your wishlist</p>
        </div>

        {/* Image Selection */}
        <div className="form-section">
          <label className="form-label">Image</label>
          <div className="image-row">
            <button
              className={`item-image-preview ${customImage ? "has-image" : ""}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {customImage ? (
                <img src={customImage} alt="Item" />
              ) : selectedEmoji ? (
                <span className="preview-emoji">{selectedEmoji}</span>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
            <div className="emoji-scroll">
              {defaultEmojis.map((emoji) => (
                <button
                  key={emoji}
                  className={`emoji-btn ${
                    selectedEmoji === emoji && !customImage ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedEmoji(emoji);
                    setCustomImage(null);
                    hapticFeedback.selection();
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="form-section">
          <label className="form-label">Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., iPhone 15 Pro"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Price & Currency */}
        <div className="form-section">
          <label className="form-label">
            Price <span className="optional">(optional)</span>
          </label>
          {currencyAutoDetected && (
            <span className="currency-auto-detected">
              💱 Currency detected: {currencyAutoDetected}
            </span>
          )}
          <div className="price-row">
            <button
              className="currency-btn"
              onClick={() => {
                setShowCurrencyPicker(!showCurrencyPicker);
                setCurrencyAutoDetected(null); // Clear notification when user interacts
              }}
            >
              {currency}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            <input
              type="number"
              className="form-input price-input"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          {showCurrencyPicker && (
            <div className="currency-picker">
              {currencies.map((c) => (
                <button
                  key={c}
                  className={`currency-option ${
                    currency === c ? "selected" : ""
                  }`}
                  onClick={() => {
                    setCurrency(c);
                    setShowCurrencyPicker(false);
                    hapticFeedback.selection();
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* URL */}
        <div className="form-section">
          <label className="form-label">
            Link <span className="optional">(optional)</span>
            {isScrapingUrl && (
              <span className="scraping-indicator"> 🔍 Loading...</span>
            )}
          </label>
          <input
            type="url"
            className={`form-input ${isScrapingUrl ? "loading" : ""}`}
            placeholder="Paste a link to auto-fill..."
            value={url}
            onChange={(e) => {
              const newUrl = e.target.value;
              setUrl(newUrl);
            }}
            onPaste={(e) => {
              // Get pasted text and immediately trigger scrape
              const pastedText = e.clipboardData.getData("text").trim();
              console.log("📋 Pasted text:", pastedText);
              if (pastedText) {
                try {
                  new URL(pastedText);
                  // Set the URL first
                  setUrl(pastedText);
                  // Valid URL pasted - scrape immediately without debounce
                  // Use a small delay to ensure state is updated
                  setTimeout(() => {
                    if (debounceTimerRef.current) {
                      clearTimeout(debounceTimerRef.current);
                    }
                    lastScrapedUrlRef.current = ""; // Reset to force scrape
                    scrapeUrl(pastedText);
                  }, 100);
                } catch {
                  // Not a valid URL, let normal flow handle it
                  console.log("❌ Invalid URL pasted");
                }
              }
            }}
          />
          {scrapeError && (
            <span className="scrape-error">⚠️ {scrapeError}</span>
          )}
        </div>

        {/* Description */}
        <div className="form-section">
          <label className="form-label">
            Description <span className="optional">(optional)</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Add details about the item..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={2}
          />
        </div>

        {/* Wishlist Selection */}
        <div className="form-section">
          <label className="form-label">Add to Wishlist *</label>

          {hasNoWishlists && !showQuickCreate ? (
            <div className="no-wishlist-prompt">
              <div className="prompt-icon">📝</div>
              <p>You don't have any wishlists yet</p>
              <button
                className="quick-create-btn"
                onClick={() => {
                  setShowQuickCreate(true);
                  hapticFeedback.impact("medium");
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create one right now
              </button>
            </div>
          ) : showQuickCreate ? (
            <div className="quick-create-form">
              <input
                type="text"
                className="form-input"
                placeholder="Wishlist name (e.g., Birthday)"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                autoFocus
                onKeyDown={(e) =>
                  e.key === "Enter" && handleQuickCreateWishlist()
                }
              />
              <div className="quick-create-actions">
                <button
                  className="cancel-quick"
                  onClick={() => {
                    setShowQuickCreate(false);
                    setNewWishlistName("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="confirm-quick"
                  onClick={handleQuickCreateWishlist}
                  disabled={!newWishlistName.trim() || isCreatingWishlist}
                >
                  {isCreatingWishlist ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          ) : (
            <div className="wishlist-chips">
              {wishlists.map((wishlist) => (
                <button
                  key={wishlist.id}
                  className={`wishlist-chip ${
                    selectedWishlists.includes(wishlist.id) ? "selected" : ""
                  }`}
                  onClick={() => toggleWishlist(wishlist.id)}
                >
                  {selectedWishlists.includes(wishlist.id) && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                  <span>{wishlist.name}</span>
                </button>
              ))}
              <button
                className="wishlist-chip add-new"
                onClick={() => {
                  setShowQuickCreate(true);
                  hapticFeedback.impact("light");
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>New</span>
              </button>
            </div>
          )}
        </div>

        {/* Notify Toggle */}
        {selectedWishlists.length > 0 && (
          <div className="form-section notify-section">
            <div className="notify-toggle">
              <div className="notify-info">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <span>Notify friends & followers</span>
              </div>
              <button
                className={`toggle-switch ${notifyFollowers ? "active" : ""}`}
                onClick={() => {
                  setNotifyFollowers(!notifyFollowers);
                  hapticFeedback.selection();
                }}
              >
                <div className="toggle-thumb" />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="add-btn"
            onClick={handleAdd}
            disabled={!name.trim() || selectedWishlists.length === 0}
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}
