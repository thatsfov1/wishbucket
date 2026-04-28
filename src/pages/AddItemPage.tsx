import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { useStore } from "../store/useStore";
import { addItem as addItemApi } from "../services/supabase-api";
import { scrapeProductUrl } from "../services/supabase-api";
import { generateAffiliateLink } from "../utils/affiliate";
import { sanitizeProductUrl } from "../utils/url";
import { showTelegramAlert, hapticFeedback } from "../utils/telegram";
import "./AddItemPage.css";

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
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    return localStorage.getItem("defaultCurrency") || "USD";
  });
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
  const [scrapedCurrency, setScrapedCurrency] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrapedUrlRef = useRef<string>("");

  const fetchProductInfo = useCallback(async (url: string, isNewUrl: boolean = false) => {
    if (!url.trim()) return;

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

      if (result.scrapeHint) {
        setUrlError(result.scrapeHint);
        return;
      }

      if (result.title || result.imageUrl || result.price) {
        setProductInfo(result);
        lastScrapedUrlRef.current = url;

        if (result.currency) {
          setScrapedCurrency(result.currency);
          if (isNewUrl) {
            setSelectedCurrency("USD");
          }
        } else {
          setScrapedCurrency(null);
        }

        setFormData((prev) => ({
          ...prev,
          name: isNewUrl ? (result.title || prev.name) : (prev.name || result.title || ""),
          description: isNewUrl ? (result.description || prev.description) : (prev.description || result.description || ""),
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

  useEffect(() => {
    const url = sanitizeProductUrl(formData.url);

    if (url !== formData.url) {
      setFormData((prev) => ({ ...prev, url }));
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (url && url !== lastScrapedUrlRef.current) {
      try {
        new URL(url);
        const isNewUrl = lastScrapedUrlRef.current !== "";
        lastScrapedUrlRef.current = url;
        debounceTimerRef.current = setTimeout(() => {
          fetchProductInfo(url, isNewUrl);
        }, 500);
      } catch {}
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData.url, fetchProductInfo]);

  const handleUrlChange = (url: string) => {
    const cleaned = sanitizeProductUrl(url);
    setFormData((prev) => ({ ...prev, url: cleaned }));
    setUrlError(null);
    if (!cleaned.trim()) {
      setProductInfo({});
      setScrapedCurrency(null);
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

      const cleanUrl = sanitizeProductUrl(formData.url);
      console.log("🧹 Submit URL:", { raw: formData.url, clean: cleanUrl });
      const affiliateResult = generateAffiliateLink(cleanUrl);

      const newItem = await addItemApi(id, {
        wishlistId: id,
        name: formData.name,
        description: formData.description,
        url: affiliateResult.affiliateUrl || cleanUrl,
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
            className={processingUrl ? "skeleton" : ""}
            required
          />

          <Input
            label="Product URL *"
            placeholder="Paste a link to auto-fill..."
            type="url"
            value={formData.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            required
          />

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

          {processingUrl && (
            <div className="autofill-skeleton-card">
              <div className="skeleton-image" />
              <div className="skeleton-lines">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
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

          {/* Currency mismatch warning */}
          {scrapedCurrency && scrapedCurrency !== selectedCurrency && !processingUrl && (
            <div className="currency-mismatch-warning">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">
                Website currency ({scrapedCurrency}) differs from selected ({selectedCurrency})
              </span>
              <button
                type="button"
                className="use-detected-btn"
                onClick={() => {
                  setSelectedCurrency(scrapedCurrency);
                  hapticFeedback.impact("light");
                }}
              >
                Use {scrapedCurrency}
              </button>
            </div>
          )}

          {/* Currency notification & selector */}
          {productInfo.price && !processingUrl && (
            <div className="currency-notice">
              <div className="currency-notice-text">
                <span className="currency-icon">💱</span>
                <span>
                  Currency: <strong>{selectedCurrency}</strong>
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
            className={processingUrl ? "skeleton" : ""}
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
