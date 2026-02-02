import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { useStore } from "../store/useStore";
import { addItem as addItemApi } from "../services/supabase-api";
import { scrapeProductUrl } from "../services/supabase-api";
import { generateAffiliateLink } from "../utils/affiliate";
import { showTelegramAlert, hapticFeedback } from "../utils/telegram";
import "./AddItemPage.css";

// European and common currencies
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev" },
  { code: "HRK", symbol: "kn", name: "Croatian Kuna" },
  { code: "RSD", symbol: "дин", name: "Serbian Dinar" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "GEL", symbol: "₾", name: "Georgian Lari" },
  { code: "ISK", symbol: "kr", name: "Icelandic Króna" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
];

const getCurrencySymbol = (code: string): string => {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol || code;
};

export default function AddItemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setLoading, addItem: addItemToStore } = useStore();
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    priority: "medium" as "low" | "medium" | "high",
  });
  const [processingUrl, setProcessingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<{
    title?: string;
    imageUrl?: string;
    price?: number;
    currency?: string;
    description?: string;
  }>({});
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrapedUrlRef = useRef<string>("");

  // Fetch product info from URL
  const fetchProductInfo = useCallback(async (url: string) => {
    if (!url.trim()) return;

    // Validate URL
    try {
      new URL(url);
    } catch {
      setUrlError("Please enter a valid URL");
      return;
    }

    setProcessingUrl(true);
    setUrlError(null);
    setProductInfo({});

    try {
      console.log("🔍 Fetching product info for:", url);
      const result = await scrapeProductUrl(url);
      console.log("✅ Scrape result:", result);

      if (result.title || result.imageUrl || result.price) {
        setProductInfo(result);
        lastScrapedUrlRef.current = url;

        // Set detected currency
        if (result.currency) {
          setSelectedCurrency(result.currency);
        }

        // Auto-fill name and description if not already filled
        setFormData((prev) => ({
          ...prev,
          name: prev.name || result.title || "",
          description: prev.description || result.description || "",
        }));

        hapticFeedback.notification("success");
      } else {
        setUrlError("Could not find product info. Please fill manually.");
      }
    } catch (error) {
      console.error("❌ Error processing URL:", error);
      setUrlError("Failed to fetch. Please fill manually.");
    } finally {
      setProcessingUrl(false);
    }
  }, []);

  // Auto-scrape when URL changes (with debounce)
  useEffect(() => {
    const url = formData.url.trim();

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only scrape if URL is valid and different from last scraped
    if (url && url !== lastScrapedUrlRef.current) {
      try {
        new URL(url);
        // Debounce the scraping to avoid too many requests while typing
        debounceTimerRef.current = setTimeout(() => {
          fetchProductInfo(url);
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
  }, [formData.url, fetchProductInfo]);

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, url }));
    setUrlError(null);
    // Only clear product info if URL is completely different (not just being typed)
    if (!url.trim()) {
      setProductInfo({});
      lastScrapedUrlRef.current = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      showTelegramAlert("Wishlist ID is missing");
      return;
    }

    if (!formData.name.trim()) {
      showTelegramAlert("Please enter an item name");
      return;
    }

    if (!formData.url.trim()) {
      showTelegramAlert("Please enter a URL");
      return;
    }

    try {
      setLoading(true);

      // Generate affiliate link if possible
      const affiliateResult = generateAffiliateLink(formData.url);

      const newItem = await addItemApi(id, {
        wishlistId: id,
        name: formData.name,
        description: formData.description,
        url: affiliateResult.affiliateUrl || formData.url,
        originalUrl: formData.url,
        affiliateUrl: affiliateResult.hasAffiliate
          ? affiliateResult.affiliateUrl
          : undefined,
        imageUrl: productInfo.imageUrl,
        price: productInfo.price,
        currency: selectedCurrency,
        priority: formData.priority,
        status: "available",
      });

      addItemToStore(newItem);
      hapticFeedback.notification("success");
      navigate(`/wishlists/${id}`);
    } catch (error) {
      console.error("Error adding item:", error);
      showTelegramAlert("Failed to add item");
      hapticFeedback.notification("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Add Item" showBackButton={true}>
      <div className="add-item-page">
        <form onSubmit={handleSubmit}>
          <Input
            label="Item Name *"
            placeholder="e.g., iPhone 15 Pro"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Product URL *"
            placeholder="Paste a link to auto-fill..."
            type="url"
            value={formData.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
              // Get pasted text and immediately trigger scrape
              const pastedText = e.clipboardData.getData("text");
              if (pastedText) {
                try {
                  new URL(pastedText);
                  // Valid URL pasted - scrape immediately without debounce
                  setTimeout(() => {
                    if (debounceTimerRef.current) {
                      clearTimeout(debounceTimerRef.current);
                    }
                    fetchProductInfo(pastedText);
                  }, 0);
                } catch {
                  // Not a valid URL, let normal flow handle it
                }
              }
            }}
            required
          />

          {/* Fetch button - always shows when URL is entered */}
          {formData.url && !processingUrl && (
            <button
              type="button"
              className="fetch-info-btn"
              onClick={() => fetchProductInfo(formData.url)}
            >
              {productInfo.title ? "🔄 Refetch Info" : "🔍 Fetch Product Info"}
            </button>
          )}

          {processingUrl && (
            <div className="processing-indicator">
              🔍 Fetching product info...
            </div>
          )}

          {urlError && <div className="url-error">⚠️ {urlError}</div>}

          {(productInfo.imageUrl || productInfo.title || productInfo.price) &&
            !processingUrl && (
              <div className="product-preview">
                {productInfo.imageUrl && (
                  <img
                    src={productInfo.imageUrl}
                    alt="Product"
                    className="product-image"
                  />
                )}
                <div className="product-preview-info">
                  <span className="product-preview-success">
                    ✓ Product info loaded
                  </span>
                  {productInfo.title && (
                    <span className="product-preview-title">
                      {productInfo.title}
                    </span>
                  )}
                  {productInfo.price && (
                    <div className="product-price">
                      {getCurrencySymbol(selectedCurrency)}
                      {productInfo.price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Currency notification & selector */}
          {productInfo.price && !processingUrl && (
            <div className="currency-notice">
              <div className="currency-notice-text">
                <span className="currency-icon">💱</span>
                <span>
                  Currency: <strong>{selectedCurrency}</strong>
                  {productInfo.currency &&
                    productInfo.currency !== selectedCurrency && (
                      <span className="currency-auto-detected">
                        {" "}
                        (detected: {productInfo.currency})
                      </span>
                    )}
                </span>
              </div>
              <button
                type="button"
                className="currency-change-btn"
                onClick={() => {
                  setShowCurrencySelector(!showCurrencySelector);
                  hapticFeedback.selection();
                }}
              >
                {showCurrencySelector ? "Hide" : "Change"}
              </button>
            </div>
          )}

          {showCurrencySelector && (
            <div className="currency-selector">
              <div className="currency-grid">
                {CURRENCIES.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    className={`currency-option ${selectedCurrency === currency.code ? "active" : ""}`}
                    onClick={() => {
                      setSelectedCurrency(currency.code);
                      setShowCurrencySelector(false);
                      hapticFeedback.impact("light");
                    }}
                  >
                    <span className="currency-symbol">{currency.symbol}</span>
                    <span className="currency-code">{currency.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Textarea
            label="Description (optional)"
            placeholder="Add any notes about this item..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div className="input-group">
            <label className="input-label">Priority</label>
            <div className="priority-buttons">
              {(["low", "medium", "high"] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={`priority-button ${
                    formData.priority === priority ? "active" : ""
                  }`}
                  onClick={() => {
                    setFormData({ ...formData, priority });
                    hapticFeedback.selection();
                  }}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              fullWidth
              size="large"
              loading={processingUrl}
            >
              ➕ Add Item
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => navigate(`/wishlists/${id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
